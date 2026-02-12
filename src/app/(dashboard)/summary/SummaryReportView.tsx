"use client";

import { useState, Fragment } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { cn } from "@/lib/utils";
import { Scale, Activity, Heart, CalendarCheck, FileSpreadsheet, FileText, FileType } from "lucide-react";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/exportUtils";

interface SummaryReportViewProps {
    block: any;
    members: any[];
    sessions: any[];
}

type TabType = 'weight' | 'km' | 'lifestyle' | 'attendance';

export default function SummaryReportView({ block, members, sessions }: SummaryReportViewProps) {
    const [activeTab, setActiveTab] = useState<TabType>('weight');

    // Group members by team
    const teamsMap = new Map();
    members.forEach(member => {
        const teamName = member.team?.name || 'Unassigned';
        if (!teamsMap.has(teamName)) {
            teamsMap.set(teamName, []);
        }
        teamsMap.get(teamName).push(member);
    });

    // Helper to get weigh-in for a specific week
    const getWeighInForWeek = (member: any, week: any) => {
        const start = startOfDay(new Date(week.startDate));
        const end = endOfDay(new Date(week.endDate));
        return member.weighIns.find((w: any) => {
            const d = new Date(w.date);
            return d >= start && d <= end;
        });
    };

    // Helper to get KM log for a week
    const getKmLogForWeek = (member: any, weekId: string) => {
        return member.kmLogs.find((log: any) => log.blockWeekId === weekId);
    };

    // Helper to get Lifestyle log for a week
    const getLifestyleLogForWeek = (member: any, weekId: string) => {
        return member.lifestyleLogs.find((log: any) => log.blockWeekId === weekId);
    };

    // Helper to get Attendance for a week
    const getAttendanceForWeek = (member: any, week: any) => {
        const weekStart = startOfDay(new Date(week.startDate));
        const weekEnd = endOfDay(new Date(week.endDate));

        // Find sessions in this week
        const weekSessions = sessions.filter(s => {
            const d = new Date(s.date);
            // Strict inequality for end date to exclude next week's start (if weeks are contiguous)
            return d >= weekStart && d < new Date(week.endDate);
        });

        const presentCount = weekSessions.reduce((acc, session) => {
            const isPresent = member.attendance.some((a: any) => a.sessionId === session.id && a.isPresent);
            return acc + (isPresent ? 1 : 0);
        }, 0);

        return { present: presentCount, total: weekSessions.length };
    };

    const tabs = [
        { id: 'weight', label: 'Weight Loss', icon: Scale },
        { id: 'km', label: 'KM Tracker', icon: Activity },
        { id: 'lifestyle', label: 'Lifestyle', icon: Heart },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    ];

    const handleExport = (type: 'pdf' | 'csv' | 'excel') => {
        const headers = ['Member'];
        block.weeks.forEach((week: any, i: number) => {
            headers.push(`Week ${i + 1} (${format(new Date(week.startDate), 'MMM d')})`);
        });
        headers.push('Total');

        const rows: any[] = [];
        const sortedTeams = Array.from(teamsMap.entries()).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));

        sortedTeams.forEach(([teamName, teamMembers]) => {
            // Add Team Header Row (handled differently across formats, but for table data we can just add a row or prefix)
            // For Excel/CSV, maybe a row "--- Team Name ---"
            // For PDF, we can rely on order or styling, but let's just add a row
            rows.push([`${teamName} (Team)`, ...Array(headers.length - 1).fill('')]);

            teamMembers.forEach((member: any) => {
                const rowData: any[] = [`${member.firstName} ${member.lastName}`];
                let rowTotal = 0;

                // Calculate Row Total first
                if (activeTab === 'weight') {
                    const sorted = member.weighIns.filter((w: any) => w.weight > 0).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    if (sorted.length >= 2) rowTotal = sorted[0].weight - sorted[sorted.length - 1].weight;
                } else if (activeTab === 'km') {
                    rowTotal = member.kmLogs.reduce((s: number, k: any) => s + k.totalKm, 0);
                } else if (activeTab === 'lifestyle') {
                    rowTotal = member.lifestyleLogs.reduce((s: number, l: any) => s + l.postCount, 0);
                } else if (activeTab === 'attendance') {
                    rowTotal = member.attendance.filter((a: any) => a.isPresent).length;
                }

                // Calculate Week Cells
                block.weeks.forEach((week: any, weekIndex: number) => {
                    let cellValue: string | number = '-';

                    if (activeTab === 'weight') {
                        const w = getWeighInForWeek(member, week);
                        if (weekIndex === 0) {
                            cellValue = (w && w.weight > 0) ? w.weight.toFixed(1) : '-';
                        } else {
                            const prevWeek = block.weeks[weekIndex - 1];
                            const prevW = getWeighInForWeek(member, prevWeek);
                            if (w && w.weight > 0 && prevW && prevW.weight > 0) {
                                const delta = w.weight - prevW.weight;
                                cellValue = (delta > 0 ? '+' : '') + delta.toFixed(1);
                            } else if (w && w.weight > 0) {
                                cellValue = '0.0';
                            }
                        }
                    } else if (activeTab === 'km') {
                        const k = getKmLogForWeek(member, week.id);
                        cellValue = k ? k.totalKm.toFixed(1) : '-';
                    } else if (activeTab === 'lifestyle') {
                        const l = getLifestyleLogForWeek(member, week.id);
                        cellValue = l ? l.postCount : '-';
                    } else if (activeTab === 'attendance') {
                        const a = getAttendanceForWeek(member, week);
                        // For export, maybe just "Present/Total" or percentage? specific "3/3" format is good
                        cellValue = `${a.present}/${a.total}`;
                    }
                    rowData.push(cellValue);
                });

                // Add Row Total
                let totalStr = '-';
                if (activeTab === 'weight') {
                    totalStr = rowTotal > 0 ? `-${rowTotal.toFixed(1)}` : `+${Math.abs(rowTotal).toFixed(1)}`;
                } else {
                    totalStr = rowTotal.toFixed(1).replace('.0', '');
                }
                rowData.push(totalStr);
                rows.push(rowData);
            });

            // Calculate Team Footer Totals
            const teamFooterRow = [`${teamName} Totals`];
            // Week Totals
            const teamWeekTotals = block.weeks.map((week: any, weekIndex: number) => {
                let sum = 0;
                teamMembers.forEach((m: any) => {
                    if (activeTab === 'weight') {
                        const w = getWeighInForWeek(m, week);
                        if (weekIndex === 0) {
                            if (w && w.weight > 0) sum += w.weight;
                        } else {
                            const prevWeek = block.weeks[weekIndex - 1];
                            const prevW = getWeighInForWeek(m, prevWeek);
                            if (w && prevW && prevW.weight > 0 && w.weight > 0) {
                                const delta = w.weight - prevW.weight;
                                if (delta < 0) sum += delta; // Only negative deltas
                            }
                        }
                    } else if (activeTab === 'km') {
                        const k = getKmLogForWeek(m, week.id);
                        if (k) sum += k.totalKm;
                    } else if (activeTab === 'lifestyle') {
                        const l = getLifestyleLogForWeek(m, week.id);
                        if (l) sum += l.postCount;
                    } else if (activeTab === 'attendance') {
                        const a = getAttendanceForWeek(m, week);
                        sum += a.present;
                    }
                });
                return sum;
            });

            // Add Week Totals to Footer
            teamWeekTotals.forEach((total: number, idx: number) => {
                let displayTotal = total.toFixed(1).replace('.0', '');
                if (activeTab === 'weight') {
                    if (idx === 0) {
                        displayTotal = total.toFixed(1);
                    } else {
                        displayTotal = (total > 0 ? '+' : '') + total.toFixed(1);
                    }
                }
                teamFooterRow.push(displayTotal);
            });

            // Grand Total for Team
            const teamGrandTotal = teamMembers.reduce((acc: number, m: any) => {
                if (activeTab === 'weight') {
                    const sorted = m.weighIns.filter((w: any) => w.weight > 0).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    if (sorted.length >= 2) {
                        const loss = sorted[0].weight - sorted[sorted.length - 1].weight;
                        if (loss > 0) return acc + loss;
                    }
                    return acc;
                } else if (activeTab === 'km') {
                    return acc + m.kmLogs.reduce((s: number, k: any) => s + k.totalKm, 0);
                } else if (activeTab === 'lifestyle') {
                    return acc + m.lifestyleLogs.reduce((s: number, l: any) => s + l.postCount, 0);
                } else if (activeTab === 'attendance') {
                    return acc + m.attendance.filter((a: any) => a.isPresent).length;
                }
                return acc;
            }, 0);

            let grandTotalStr = '';
            if (activeTab === 'weight' && teamGrandTotal > 0) {
                grandTotalStr = `-${teamGrandTotal.toFixed(1)}`;
            } else {
                grandTotalStr = teamGrandTotal.toFixed(1).replace('.0', '');
            }
            teamFooterRow.push(grandTotalStr);
            rows.push(teamFooterRow);

            // Add empty row for spacing between teams
            rows.push(Array(headers.length).fill(''));
        });

        const exportData = {
            title: `Proactive - ${activeTab.toUpperCase()} Report - ${block.name}`,
            headers: headers,
            rows: rows
        };

        if (type === 'pdf') exportToPDF(exportData, `summary_${activeTab}`);
        if (type === 'csv') exportToCSV(exportData, `summary_${activeTab}`);
        if (type === 'excel') exportToExcel(exportData, `summary_${activeTab}`);
    };

    return (
        <div className="space-y-6">
            {/* Control Bar: Tabs + Export */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-black/20 backdrop-blur-sm rounded-xl border border-white/5 p-2">
                {/* Custom Tabs */}
                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300",
                                activeTab === tab.id
                                    ? "bg-gradient-to-r from-lagoon to-ocean text-white shadow-lg shadow-lagoon/20"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-white" : "text-slate-500")} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-2 hidden md:block">Export:</span>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors tooltip"
                        title="Export PDF"
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleExport('csv')}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors tooltip"
                        title="Export CSV"
                    >
                        <FileType className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleExport('excel')}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors tooltip"
                        title="Export Excel"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <PremiumCard className="p-0 overflow-hidden bg-ocean-deep/80 backdrop-blur-md border border-white/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-black/20">
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider sticky left-0 z-20 bg-[#0c1a25]">
                                    Member
                                </th>
                                {block.weeks.map((week: any, i: number) => (
                                    <th key={week.id} className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center min-w-[100px]">
                                        W{i + 1}<br />
                                        <span className="text-[9px] opacity-50 lowercase font-normal">
                                            {format(new Date(week.startDate), 'MMM d')}
                                        </span>
                                    </th>
                                ))}
                                <th className="p-4 text-xs font-bold text-lagoon-100 uppercase tracking-wider text-center sticky right-0 z-20 bg-[#0c1a25] shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.5)]">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {Array.from(teamsMap.entries())
                                .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
                                .map(([teamName, teamMembers]) => {
                                    // Calculate Team Totals for Footer
                                    const teamWeekTotals = block.weeks.map((week: any, weekIndex: number) => {
                                        let sum = 0;
                                        teamMembers.forEach((m: any) => {
                                            if (activeTab === 'weight') {
                                                const w = getWeighInForWeek(m, week);

                                                // Week 1 (Index 0): Sum of Absolute Weights
                                                if (weekIndex === 0) {
                                                    if (w && w.weight > 0) sum += w.weight;
                                                } else {
                                                    // Week 2+: Sum of Deltas
                                                    const prevWeek = block.weeks[weekIndex - 1];
                                                    const prevW = getWeighInForWeek(m, prevWeek);
                                                    // Only calculate delta if previous weight is valid (> 0)
                                                    if (w && prevW && prevW.weight > 0 && w.weight > 0) {
                                                        const delta = w.weight - prevW.weight;
                                                        // Request: "For the + red or gain numbers do not include that in the total calculation but just total up the green minus numbers."
                                                        // Only include if delta is negative (weight loss)
                                                        if (delta < 0) {
                                                            sum += delta;
                                                        }
                                                    }
                                                }
                                            } else if (activeTab === 'km') {
                                                const k = getKmLogForWeek(m, week.id);
                                                if (k) sum += k.totalKm;
                                            } else if (activeTab === 'lifestyle') {
                                                const l = getLifestyleLogForWeek(m, week.id);
                                                if (l) sum += l.postCount;
                                            } else if (activeTab === 'attendance') {
                                                const a = getAttendanceForWeek(m, week);
                                                sum += a.present;
                                            }
                                        });
                                        return sum;
                                    });

                                    const teamGrandTotal = teamMembers.reduce((acc: number, m: any) => {
                                        if (activeTab === 'weight') {
                                            // Net change: First valid weigh-in - Last valid weigh-in
                                            // Request: "Total the members that had a weight loss and discard weight gain"
                                            const sorted = m.weighIns.filter((w: any) => w.weight > 0).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                                            if (sorted.length >= 2) {
                                                const loss = sorted[0].weight - sorted[sorted.length - 1].weight;
                                                // Only include if it's a loss (positive value in Start - End)
                                                if (loss > 0) {
                                                    return acc + loss;
                                                }
                                            }
                                            return acc;
                                        } else if (activeTab === 'km') {
                                            return acc + m.kmLogs.reduce((s: number, k: any) => s + k.totalKm, 0);
                                        } else if (activeTab === 'lifestyle') {
                                            return acc + m.lifestyleLogs.reduce((s: number, l: any) => s + l.postCount, 0);
                                        } else if (activeTab === 'attendance') {
                                            // Total present
                                            return acc + m.attendance.filter((a: any) => a.isPresent).length;
                                        }
                                        return acc;
                                    }, 0);

                                    return (
                                        <Fragment key={teamName}>
                                            {/* Team Header Row */}
                                            <tr className="bg-ocean/10">
                                                <td colSpan={block.weeks.length + 2} className="p-3 pl-4 text-xs font-bold text-tongan uppercase tracking-widest border-l-4 border-tongan">
                                                    {teamName}
                                                </td>
                                            </tr>

                                            {/* Member Rows */}
                                            {teamMembers.map((member: any) => {
                                                // Calculate Row Total/Net
                                                let rowTotal = 0;
                                                if (activeTab === 'weight') {
                                                    const sorted = member.weighIns.filter((w: any) => w.weight > 0).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                                                    if (sorted.length >= 2) rowTotal = sorted[0].weight - sorted[sorted.length - 1].weight;
                                                    else rowTotal = 0;
                                                } else if (activeTab === 'km') {
                                                    rowTotal = member.kmLogs.reduce((s: number, k: any) => s + k.totalKm, 0);
                                                } else if (activeTab === 'lifestyle') {
                                                    rowTotal = member.lifestyleLogs.reduce((s: number, l: any) => s + l.postCount, 0);
                                                } else if (activeTab === 'attendance') {
                                                    rowTotal = member.attendance.filter((a: any) => a.isPresent).length;
                                                }

                                                return (
                                                    <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                                                        <td className="p-3 pl-6 text-sm font-medium text-white sticky left-0 bg-[#0b1620] group-hover:bg-[#112231] transition-colors border-r border-white/5">
                                                            {member.firstName} {member.lastName}
                                                        </td>
                                                        {block.weeks.map((week: any, weekIndex: number) => {
                                                            let content: any = '-';
                                                            if (activeTab === 'weight') {
                                                                const w = getWeighInForWeek(member, week);
                                                                if (weekIndex === 0) {
                                                                    // Week 1: Show Absolute Weight
                                                                    // Only show if > 0 to avoid "0.0" clutter if data missing/invalid
                                                                    content = (w && w.weight > 0) ? w.weight.toFixed(1) : '-';
                                                                } else {
                                                                    // Week 2+: Show Delta from Previous Available Week
                                                                    const prevWeek = block.weeks[weekIndex - 1];
                                                                    const prevW = getWeighInForWeek(member, prevWeek);

                                                                    // Ensure previous weight is valid (> 0) to avoid artificial large gains (e.g. 0 -> 140)
                                                                    if (w && w.weight > 0 && prevW && prevW.weight > 0) {
                                                                        const delta = w.weight - prevW.weight;
                                                                        const isLoss = delta < 0;
                                                                        content = (
                                                                            <span className={cn(
                                                                                "font-medium",
                                                                                isLoss ? "text-green-400" : (delta > 0 ? "text-red-400" : "text-slate-400")
                                                                            )}>
                                                                                {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                                                                            </span>
                                                                        );
                                                                    } else if (w && w.weight > 0) {
                                                                        // Current week exists and is valid, but previous week is missing or 0
                                                                        // Treat as baseline / no change to report
                                                                        content = <span className="text-slate-500 font-medium">0.0</span>;
                                                                    } else {
                                                                        content = '-';
                                                                    }
                                                                }
                                                            } else if (activeTab === 'km') {
                                                                const k = getKmLogForWeek(member, week.id);
                                                                content = k ? k.totalKm.toFixed(1) : '-';
                                                            } else if (activeTab === 'lifestyle') {
                                                                const l = getLifestyleLogForWeek(member, week.id);
                                                                content = l ? l.postCount : '-';
                                                            } else if (activeTab === 'attendance') {
                                                                const a = getAttendanceForWeek(member, week);
                                                                content = <span className={cn(a.present === a.total ? "text-green-400" : "text-white")}>{a.present}/{a.total}</span>;
                                                            }

                                                            return (
                                                                <td key={week.id} className="p-3 text-sm text-slate-300 text-center border-r border-dashed border-white/5">
                                                                    {content}
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="p-3 text-sm font-bold text-lagoon-100 text-center sticky right-0 bg-[#0b1620] group-hover:bg-[#112231] shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.5)]">
                                                            {activeTab === 'weight'
                                                                ? (rowTotal > 0 ? `-${rowTotal.toFixed(1)}` : `+${Math.abs(rowTotal).toFixed(1)}`)
                                                                : rowTotal.toFixed(1).replace('.0', '')}
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            {/* Team Footer/Total Row */}
                                            <tr className="bg-white/5 font-bold border-t border-white/10">
                                                <td className="p-3 pl-6 text-xs text-right text-tongan uppercase tracking-wider sticky left-0 bg-[#162a3b]">
                                                    {teamName} Totals
                                                </td>
                                                {teamWeekTotals.map((total: number, idx: number) => {
                                                    // Formatting for Totals
                                                    let displayTotal: any = total.toFixed(1).replace('.0', '');

                                                    if (activeTab === 'weight') {
                                                        // Week 1 is absolute sum, so just show number
                                                        if (idx === 0) {
                                                            displayTotal = total.toFixed(1);
                                                        } else {
                                                            // Subsequent weeks are Sum of Deltas
                                                            // Display with sign and color?
                                                            const isLoss = total < 0;
                                                            displayTotal = (
                                                                <span className={cn(
                                                                    isLoss ? "text-green-400" : (total > 0 ? "text-red-400" : "text-tongan-100")
                                                                )}>
                                                                    {total > 0 ? '+' : ''}{total.toFixed(1)}
                                                                </span>
                                                            )
                                                        }
                                                    }

                                                    return (
                                                        <td key={idx} className="p-3 text-sm text-tongan-100 text-center">
                                                            {displayTotal}
                                                        </td>
                                                    )
                                                })}
                                                <td className="p-3 text-sm text-tongan text-center sticky right-0 bg-[#162a3b]">
                                                    {activeTab === 'weight' && teamGrandTotal > 0
                                                        ? `-${teamGrandTotal.toFixed(1)}`
                                                        : teamGrandTotal.toFixed(1).replace('.0', '')}
                                                </td>
                                            </tr>
                                        </Fragment>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </PremiumCard>
        </div>
    );
}
