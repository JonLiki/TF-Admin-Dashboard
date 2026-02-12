import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// --- Scoreboard Export Utilities (Existing) ---

export interface ScoreboardExportData {
    weekNumber: number;
    date: string;
    standings: {
        rank: number;
        teamName: string;
        totalPoints: number;
    }[];
    winners?: {
        weightLoss?: { team: string; award: string };
        lifestyle?: { team: string; award: string };
        km?: { team: string; award: string };
    };
}

/**
 * Generate and download a PDF of the scoreboard
 */
export function generateScoreboardPDF(data: ScoreboardExportData): void {
     
    const doc = new jsPDF();

    // Colors (dark ocean theme)
    const primaryColor: [number, number, number] = [200, 16, 46]; // Tongan red
    const darkBlue: [number, number, number] = [10, 31, 46]; // Ocean deep
    const lightBlue: [number, number, number] = [11, 60, 93]; // Ocean

    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("TO'A FATALONA", 105, 15, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(`Week ${data.weekNumber} Scoreboard`, 105, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.text(data.date, 105, 33, { align: 'center' });

    // Overall Standings Section
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('OVERALL STANDINGS', 14, 50);

    // Standings Table
    const tableData = data.standings.map(team => [
        team.rank.toString(),
        team.teamName,
        team.totalPoints.toString()
    ]);

    autoTable(doc, {
        startY: 55,
        head: [['Rank', 'Team Name', 'Total Points']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: lightBlue,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            textColor: darkBlue,
            halign: 'center'
        },
        columnStyles: {
            0: { cellWidth: 25, halign: 'center' },
            1: { cellWidth: 100, halign: 'left' },
            2: { cellWidth: 45, halign: 'center' }
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        margin: { left: 14, right: 14 }
    });

    // Winners Section (if available)
     
    if (data.winners) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalY = (doc as any).lastAutoTable.finalY || 100;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
        doc.text('WEEKLY WINNERS', 14, finalY + 15);

        let winnerY = finalY + 25;

        if (data.winners.weightLoss) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text('🏆 Weight Loss Champion', 14, winnerY);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
            doc.text(`${data.winners.weightLoss.team} - ${data.winners.weightLoss.award}`, 14, winnerY + 6);
            winnerY += 15;
        }

        if (data.winners.lifestyle) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text('🏆 Lifestyle Champion', 14, winnerY);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
            doc.text(`${data.winners.lifestyle.team} - ${data.winners.lifestyle.award}`, 14, winnerY + 6);
            winnerY += 15;
        }

        if (data.winners.km) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text('🏆 KM Champion', 14, winnerY);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
            doc.text(`${data.winners.km.team} - ${data.winners.km.award}`, 14, winnerY + 6);
        }
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
            `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
            105,
            285,
            { align: 'center' }
        );
    }

    // Download
    doc.save(`TOA-FATALONA-Week${data.weekNumber}-Scoreboard.pdf`);
}

/**
 * Generate and download a CSV of the scoreboard
 */
export function generateScoreboardCSV(data: ScoreboardExportData): void {
    // CSV Header
    const headers = ['Rank', 'Team Name', 'Total Points'];

    // CSV Rows
    const rows = data.standings.map(team => [
        team.rank,
        `"${team.teamName}"`, // Quote to handle commas in names
        team.totalPoints
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `TOA-FATALONA-Week${data.weekNumber}-Scoreboard.csv`);
}


// --- New Summary Export Utilities ---

export interface ExportData {
    title: string;
    headers: string[];
    rows: (string | number | null)[][];
    footers?: (string | number | null)[][];
}

export const exportToCSV = (data: ExportData, filename: string) => {
    // Construct CSV content
    let csvContent = `"${data.title}"\n\n`;

    // Headers
    csvContent += data.headers.map(h => `"${h}"`).join(",") + "\n";

    // Rows
    data.rows.forEach(row => {
        const line = row.map(cell => {
            if (cell === null || cell === undefined) return "";
            const stringCell = String(cell);
            // Escape quotes
            return `"${stringCell.replace(/"/g, '""')}"`;
        }).join(",");
        csvContent += line + "\n";
    });

    // Footers
    if (data.footers) {
        data.footers.forEach(footer => {
            const line = footer.map(cell => {
                if (cell === null || cell === undefined) return "";
                const stringCell = String(cell);
                return `"${stringCell.replace(/"/g, '""')}"`;
            }).join(",");
            csvContent += line + "\n";
        });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${filename}.csv`);
};

export const exportToExcel = (data: ExportData, filename: string) => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Prepare data array for sheet
    const wsData: (string | number | null)[][] = [
        [data.title],
        Array(data.headers.length).fill(""), // Empty row for spacing
        data.headers,
        ...data.rows
    ];

    if (data.footers) {
        data.footers.forEach(f => wsData.push(f));
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge title cells
    if (data.headers.length > 1) {
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: data.headers.length - 1 } }
        ];
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Report");

    // Write file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
};

export const exportToPDF = (data: ExportData, filename: string) => {
     
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(data.title, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateStr = format(new Date(), 'PPpp');
    doc.text(`Generated on: ${dateStr}`, 14, 30);

    autoTable(doc, {
        startY: 36,
        head: [data.headers],
        body: data.rows,
        foot: data.footers,
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] }, // Green/Teal
        styles: { fontSize: 8, cellPadding: 2 },
    });

    doc.save(`${filename}.pdf`);
};
