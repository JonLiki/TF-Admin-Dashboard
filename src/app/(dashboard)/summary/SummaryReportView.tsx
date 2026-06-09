"use client";

import React, { useState, Fragment, useMemo } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { cn } from "@/lib/utils";
import { Scale, Activity, Heart, CalendarCheck, FileSpreadsheet, FileText, FileType } from "lucide-react";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/exportUtils";

interface WeighIn {
    date: Date | string;
    weight: number;
}

interface KmLog {
    blockWeekId: string;
    totalKm: number;
}

interface LifestyleLog {
    blockWeekId: string;
    postCount: number;
}

interface Attendance {
    sessionId: string;
    isPresent: boolean;
}

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    team?: { name: string } | null;
    weighIns: WeighIn[];
    kmLogs: KmLog[];
    lifestyleLogs: LifestyleLog[];
    attendance: Attendance[];
}

interface BlockWeek {
    id: string;
    startDate: Date | string;
    endDate: Date | string;
    weekNumber: number;
}

interface Session {
    id: string;
    date: Date | string;
}

interface Block {
    name: string;
    endDate: Date | string;
    weeks: BlockWeek[];
}

interface SummaryReportViewProps {
    block: Block;
    members: Member[];
    sessions: Session[];
}

type TabType = 'weight' | 'km' | 'lifestyle' | 'attendance';

export default function SummaryReportView({ block, members, sessions }: SummaryReportViewProps) {
    const [activeTab, setActiveTab] = useState<TabType>('weight');

    const precomputedTeams = useMemo(() => {
        const weekDates = block.weeks.map(week => {
            const start = startOfDay(new Date(week.startDate));
            const endObj = new Date(week.endDate);
            endObj.setDate(endObj.getDate() + 1);
            const end = endOfDay(endObj);
            return { start, end, id: week.id };
        });

        const blockEndDateStart = startOfDay(new Date(block.endDate));
        const blockEndDateEnd = endOfDay(new Date(block.endDate));

        const precomputed: PrecomputedTeamData[] = [];

        const teamsMap = new Map<string, Member[]>();
        members.forEach(member => {
            const teamName = member.team?.name || 'Unassigned';
            if (!teamsMap.has(teamName)) {
                teamsMap.set(teamName, []);
            }
            teamsMap.get(teamName)?.push(member);
        });

        const sortedTeamNames = Array.from(teamsMap.keys()).sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true })
        );

        sortedTeamNames.forEach(teamName => {
            const teamMembers = teamsMap.get(teamName) || [];
            
            const membersData: PrecomputedMemberData[] = teamMembers.map(member => {
                const parsedWeighIns = member.weighIns.map(w => ({
                    ...w,
                    parsedDate: new Date(w.date)
                }));

                const weighInsByWeek = weekDates.map(wd => {
                    return parsedWeighIns.find(w => w.parsedDate >= wd.start && w.parsedDate <= wd.end);
                });

                const finalWeighIn = parsedWeighIns.find(w => w.parsedDate >= blockEndDateStart && w.parsedDate <= blockEndDateEnd);

                const kmByWeekId: Record<string, KmLog | undefined> = {};
                member.kmLogs.forEach(log => {
                    kmByWeekId[log.blockWeekId] = log;
                });

                const lifestyleByWeekId: Record<string, LifestyleLog | undefined> = {};
                member.lifestyleLogs.forEach(log => {
                    lifestyleByWeekId[log.blockWeekId] = log;
                });

                const attendanceByWeekId: Record<string, { present: number; total: number }> = {};
                const parsedSessions = sessions.map(s => ({
                    ...s,
                    parsedDate: new Date(s.date)
                }));

                weekDates.forEach((wd, weekIdx) => {
                    const weekStart = wd.start;
                    const weekEndRaw = block.weeks[weekIdx].endDate;
                    const weekEnd = new Date(weekEndRaw);

                    const weekSessions = parsedSessions.filter(s => {
                        return s.parsedDate >= weekStart && s.parsedDate < weekEnd;
                    });

                    const presentCount = weekSessions.reduce((acc, session) => {
                        const isPresent = member.attendance.some((a: Attendance) => a.sessionId === session.id && a.isPresent);
                        return acc + (isPresent ? 1 : 0);
                    }, 0);

                    attendanceByWeekId[wd.id] = { present: presentCount, total: weekSessions.length };
                });

                const firstW = weighInsByWeek[0];
                const lastW = finalWeighIn;
                let rowTotalWeightLoss = 0;
                if (firstW && firstW.weight > 0 && lastW && lastW.weight > 0) {
                    rowTotalWeightLoss = firstW.weight - lastW.weight;
                }

                const rowTotalKm = member.kmLogs.reduce((s, k) => s + k.totalKm, 0);
                const rowTotalLifestyle = member.lifestyleLogs.reduce((s, l) => s + l.postCount, 0);
                const rowTotalAttendance = member.attendance.filter(a => a.isPresent).length;

                return {
                    member,
                    weighInsByWeek,
                    finalWeighIn,
                    kmByWeekId,
                    lifestyleByWeekId,
                    attendanceByWeekId,
                    rowTotalWeightLoss,
                    rowTotalKm,
                    rowTotalLifestyle,
                    rowTotalAttendance
                };
            });

            const weekTotalsWeightLoss = weekDates.map((wd, weekIndex) => {
                let sum = 0;
                membersData.forEach(md => {
                    const w = md.weighInsByWeek[weekIndex];
                    let nextW: WeighIn | undefined = undefined;
                    if (weekIndex + 1 < block.weeks.length) {
                        nextW = md.weighInsByWeek[weekIndex + 1];
                    } else {
                        nextW = md.finalWeighIn;
                    }

                    if (w && w.weight > 0 && nextW && nextW.weight > 0) {
                        const delta = w.weight - nextW.weight;
                        if (delta > 0) {
                            sum -= delta;
                        }
                    }
                });
                return sum;
            });

            const weekTotalsKm = weekDates.map(wd => {
                return membersData.reduce((sum, md) => {
                    const k = md.kmByWeekId[wd.id];
                    return sum + (k ? k.totalKm : 0);
                }, 0);
            });

            const weekTotalsLifestyle = weekDates.map(wd => {
                return membersData.reduce((sum, md) => {
                    const l = md.lifestyleByWeekId[wd.id];
                    return sum + (l ? l.postCount : 0);
                }, 0);
            });

            const weekTotalsAttendance = weekDates.map(wd => {
                return membersData.reduce((sum, md) => {
                    const att = md.attendanceByWeekId[wd.id];
                    return sum + att.present;
                }, 0);
            });

            const grandTotalWeightLoss = membersData.reduce((acc, md) => {
                if (md.rowTotalWeightLoss > 0) return acc + md.rowTotalWeightLoss;
                return acc;
            }, 0);

            const grandTotalKm = membersData.reduce((acc, md) => acc + md.rowTotalKm, 0);
            const grandTotalLifestyle = membersData.reduce((acc, md) => acc + md.rowTotalLifestyle, 0);
            const grandTotalAttendance = membersData.reduce((acc, md) => acc + md.rowTotalAttendance, 0);

            precomputed.push({
                teamName,
                members: membersData,
                weekTotalsWeightLoss,
                weekTotalsKm,
                weekTotalsLifestyle,
                weekTotalsAttendance,
                grandTotalWeightLoss,
                grandTotalKm,
                grandTotalLifestyle,
                grandTotalAttendance
            });
        });

        return precomputed;
    }, [block, members, sessions]);

    const tabs = [
        { id: 'weight', label: 'Weight Loss', icon: Scale },
        { id: 'km', label: 'KM Tracker', icon: Activity },
        { id: 'lifestyle', label: 'Lifestyle', icon: Heart },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    ];

    const handleExport = (type: 'pdf' | 'csv' | 'excel') => {
        const headers = ['Member'];
        if (activeTab === 'weight') {
            headers.push('Initial');
        }
        block.weeks.forEach((week: BlockWeek, i: number) => {
            headers.push(`Week ${i + 1} (${format(new Date(week.startDate), 'MMM d')})`);
        });
        if (activeTab === 'weight') {
            headers.push('Final');
        }
        headers.push('Total');

        const rows: (string | number)[][] = [];

        precomputedTeams.forEach((team) => {
            rows.push([`${team.teamName} (Team)`, ...Array(headers.length - 1).fill('')]);

            team.members.forEach((md) => {
                const rowData: (string | number)[] = [`${md.member.firstName} ${md.member.lastName}`];
                
                if (activeTab === 'weight') {
                    const firstW = md.weighInsByWeek[0];
                    rowData.push(firstW ? firstW.weight.toFixed(1) : '-');
                }

                block.weeks.forEach((week, weekIndex) => {
                    let cellValue: string | number = '-';

                    if (activeTab === 'weight') {
                        const w = md.weighInsByWeek[weekIndex];
                        let nextW: WeighIn | undefined = undefined;
                        if (weekIndex + 1 < block.weeks.length) {
                            nextW = md.weighInsByWeek[weekIndex + 1];
                        } else {
                            nextW = md.finalWeighIn;
                        }

                        if (w && w.weight > 0 && nextW && nextW.weight > 0) {
                            const delta = w.weight - nextW.weight;
                            cellValue = (delta > 0 ? '-' : '+') + Math.abs(delta).toFixed(1);
                        } else {
                            cellValue = '-';
                        }
                    } else if (activeTab === 'km') {
                        const k = md.kmByWeekId[week.id];
                        cellValue = k ? k.totalKm.toFixed(2) : '-';
                    } else if (activeTab === 'lifestyle') {
                        const l = md.lifestyleByWeekId[week.id];
                        cellValue = l ? l.postCount : '-';
                    } else if (activeTab === 'attendance') {
                        const a = md.attendanceByWeekId[week.id];
                        cellValue = `${a.present}/${a.total}`;
                    }
                    rowData.push(cellValue);
                });

                if (activeTab === 'weight') {
                    const lastW = md.finalWeighIn;
                    rowData.push(lastW ? lastW.weight.toFixed(1) : '-');
                }

                let totalStr = '-';
                if (activeTab === 'weight') {
                    const rowTotal = md.rowTotalWeightLoss;
                    totalStr = rowTotal > 0 ? `-${rowTotal.toFixed(1)}` : `+${Math.abs(rowTotal).toFixed(1)}`;
                } else if (activeTab === 'km') {
                    totalStr = md.rowTotalKm.toFixed(1).replace('.0', '');
                } else if (activeTab === 'lifestyle') {
                    totalStr = md.rowTotalLifestyle.toFixed(1).replace('.0', '');
                } else if (activeTab === 'attendance') {
                    totalStr = md.rowTotalAttendance.toFixed(1).replace('.0', '');
                }
                rowData.push(totalStr);
                rows.push(rowData);
            });

            const teamFooterRow = [`${team.teamName} Totals`];
            if (activeTab === 'weight') {
                const firstWeights = team.members.map(m => m.weighInsByWeek[0]?.weight || 0).filter(w => w > 0);
                const firstAvg = firstWeights.length > 0 ? (firstWeights.reduce((a, b) => a + b, 0) / firstWeights.length).toFixed(1) : '-';
                teamFooterRow.push(firstAvg);
            }
            
            block.weeks.forEach((week, weekIndex) => {
                let total = 0;
                if (activeTab === 'weight') {
                    total = team.weekTotalsWeightLoss[weekIndex];
                } else if (activeTab === 'km') {
                    total = team.weekTotalsKm[weekIndex];
                } else if (activeTab === 'lifestyle') {
                    total = team.weekTotalsLifestyle[weekIndex];
                } else if (activeTab === 'attendance') {
                    total = team.weekTotalsAttendance[weekIndex];
                }

                let displayTotal = total.toFixed(1).replace('.0', '');
                if (activeTab === 'weight') {
                    displayTotal = (total > 0 ? '+' : '') + total.toFixed(1);
                }
                teamFooterRow.push(displayTotal);
            });

            if (activeTab === 'weight') {
                const lastWeights = team.members.map(m => m.finalWeighIn?.weight || 0).filter(w => w > 0);
                const lastAvg = lastWeights.length > 0 ? (lastWeights.reduce((a, b) => a + b, 0) / lastWeights.length).toFixed(1) : '-';
                teamFooterRow.push(lastAvg);
            }

            let grandTotal = 0;
            if (activeTab === 'weight') {
                grandTotal = team.grandTotalWeightLoss;
            } else if (activeTab === 'km') {
                grandTotal = team.grandTotalKm;
            } else if (activeTab === 'lifestyle') {
                grandTotal = team.grandTotalLifestyle;
            } else if (activeTab === 'attendance') {
                grandTotal = team.grandTotalAttendance;
            }

            let grandTotalStr = '';
            if (activeTab === 'weight' && grandTotal > 0) {
                grandTotalStr = `-${grandTotal.toFixed(1)}`;
            } else {
                grandTotalStr = grandTotal.toFixed(1).replace('.0', '');
            }
            teamFooterRow.push(grandTotalStr);
            rows.push(teamFooterRow);

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
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-black/20 backdrop-blur-sm rounded-xl border border-white/5 p-2">
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

            <PremiumCard className="p-0 overflow-hidden bg-ocean-deep/80 backdrop-blur-md border border-white/10">
                <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-ocean-deep/90 to-transparent z-10 pointer-events-none opacity-0 md:opacity-100" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-ocean-deep/90 to-transparent z-10 pointer-events-none" />
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20">
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider sticky left-0 z-20 bg-table-header">
                                        Member
                                    </th>
                                    {block.weeks.map((week: BlockWeek, i: number) => (
                                        <th key={week.id} className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center min-w-[100px]">
                                            W{i + 1}<br />
                                            <span className="text-[9px] opacity-50 lowercase font-normal">
                                                {format(new Date(week.startDate), 'MMM d')}
                                            </span>
                                        </th>
                                    ))}
                                    <th className="p-4 text-xs font-bold text-lagoon-100 uppercase tracking-wider text-center sticky right-0 z-20 bg-table-header shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.5)]">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {precomputedTeams.map((team) => {
                                        return (
                                            <Fragment key={team.teamName}>
                                                <tr className="bg-ocean/10">
                                                    <td colSpan={block.weeks.length + 2} className="p-3 pl-4 text-xs font-bold text-tongan uppercase tracking-widest border-l-4 border-tongan">
                                                        {team.teamName}
                                                    </td>
                                                </tr>

                                                {team.members.map((md) => {
                                                    let rowTotal = 0;
                                                    if (activeTab === 'weight') {
                                                        rowTotal = md.rowTotalWeightLoss;
                                                    } else if (activeTab === 'km') {
                                                        rowTotal = md.rowTotalKm;
                                                    } else if (activeTab === 'lifestyle') {
                                                        rowTotal = md.rowTotalLifestyle;
                                                    } else if (activeTab === 'attendance') {
                                                        rowTotal = md.rowTotalAttendance;
                                                    }

                                                    return (
                                                        <tr key={md.member.id} className="hover:bg-white/5 transition-colors group">
                                                            <td className="p-3 pl-6 text-sm font-medium text-white sticky left-0 bg-table-row group-hover:bg-table-row-hover transition-colors border-r border-white/5">
                                                                {md.member.firstName} {md.member.lastName}
                                                            </td>
                                                            {block.weeks.map((week, weekIndex) => {
                                                                let content: React.ReactNode = '-';
                                                                if (activeTab === 'weight') {
                                                                    const w = md.weighInsByWeek[weekIndex];
                                                                    let nextW: WeighIn | undefined = undefined;
                                                                    if (weekIndex + 1 < block.weeks.length) {
                                                                        nextW = md.weighInsByWeek[weekIndex + 1];
                                                                    } else {
                                                                        nextW = md.finalWeighIn;
                                                                    }

                                                                    if (w && w.weight > 0 && nextW && nextW.weight > 0) {
                                                                        const delta = w.weight - nextW.weight;
                                                                        const isLoss = delta > 0;
                                                                        content = (
                                                                            <span className={cn(
                                                                                "font-medium",
                                                                                isLoss ? "text-green-400" : (delta < 0 ? "text-red-400" : "text-slate-400")
                                                                            )}>
                                                                                {delta > 0 ? '-' : '+'}{Math.abs(delta).toFixed(1)}
                                                                            </span>
                                                                        );
                                                                    } else {
                                                                        content = '-';
                                                                    }
                                                                } else if (activeTab === 'km') {
                                                                    const k = md.kmByWeekId[week.id];
                                                                    content = k ? k.totalKm.toFixed(2) : '-';
                                                                } else if (activeTab === 'lifestyle') {
                                                                    const l = md.lifestyleByWeekId[week.id];
                                                                    content = l ? l.postCount : '-';
                                                                } else if (activeTab === 'attendance') {
                                                                    const a = md.attendanceByWeekId[week.id];
                                                                    content = <span className={cn(a.present === a.total ? "text-green-400" : "text-white")}>{a.present}/{a.total}</span>;
                                                                }

                                                                return (
                                                                    <td key={week.id} className="p-3 text-sm text-slate-300 text-center border-r border-dashed border-white/5">
                                                                        {content}
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="p-3 text-sm font-bold text-lagoon-100 text-center sticky right-0 bg-table-row group-hover:bg-table-row-hover shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.5)]">
                                                                {activeTab === 'weight'
                                                                    ? (rowTotal > 0 ? `-${rowTotal.toFixed(1)}` : `+${Math.abs(rowTotal).toFixed(1)}`)
                                                                    : rowTotal.toFixed(1).replace('.0', '')}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}

                                                <tr className="bg-white/5 font-bold border-t border-white/10">
                                                    <td className="p-3 pl-6 text-xs text-right text-tongan uppercase tracking-wider sticky left-0 bg-table-totals">
                                                        {team.teamName} Totals
                                                    </td>
                                                    {block.weeks.map((week, idx) => {
                                                        let total = 0;
                                                        if (activeTab === 'weight') {
                                                            total = team.weekTotalsWeightLoss[idx];
                                                        } else if (activeTab === 'km') {
                                                            total = team.weekTotalsKm[idx];
                                                        } else if (activeTab === 'lifestyle') {
                                                            total = team.weekTotalsLifestyle[idx];
                                                        } else if (activeTab === 'attendance') {
                                                            total = team.weekTotalsAttendance[idx];
                                                        }

                                                        let displayTotal: React.ReactNode = total.toFixed(1).replace('.0', '');

                                                        if (activeTab === 'weight') {
                                                            const isLoss = total < 0;
                                                            displayTotal = (
                                                                <span className={cn(
                                                                    isLoss ? "text-green-400" : (total > 0 ? "text-red-400" : "text-tongan-100")
                                                                )}>
                                                                    {total > 0 ? '+' : ''}{total.toFixed(1)}
                                                                </span>
                                                            );
                                                        }

                                                        return (
                                                            <td key={idx} className="p-3 text-sm text-tongan-100 text-center">
                                                                {displayTotal}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="p-3 text-sm text-tongan text-center sticky right-0 bg-table-totals">
                                                        {activeTab === 'weight'
                                                            ? (team.grandTotalWeightLoss > 0 ? `-${team.grandTotalWeightLoss.toFixed(1)}` : '0.0')
                                                            : (activeTab === 'km' ? team.grandTotalKm : activeTab === 'lifestyle' ? team.grandTotalLifestyle : team.grandTotalAttendance).toFixed(1).replace('.0', '')}
                                                    </td>
                                                </tr>
                                            </Fragment>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PremiumCard>
        </div>
    );
}

interface PrecomputedMemberData {
    member: Member;
    weighInsByWeek: (WeighIn | undefined)[];
    finalWeighIn: WeighIn | undefined;
    kmByWeekId: Record<string, KmLog | undefined>;
    lifestyleByWeekId: Record<string, LifestyleLog | undefined>;
    attendanceByWeekId: Record<string, { present: number; total: number }>;
    rowTotalWeightLoss: number;
    rowTotalKm: number;
    rowTotalLifestyle: number;
    rowTotalAttendance: number;
}

interface PrecomputedTeamData {
    teamName: string;
    members: PrecomputedMemberData[];
    weekTotalsWeightLoss: number[];
    weekTotalsKm: number[];
    weekTotalsLifestyle: number[];
    weekTotalsAttendance: number[];
    grandTotalWeightLoss: number;
    grandTotalKm: number;
    grandTotalLifestyle: number;
    grandTotalAttendance: number;
}
