'use client';

import { motion } from 'framer-motion';
import { MetricAreaChart, MetricBarChart, AttendanceSessionChart, MetricDataPoint, AttendanceDataPoint } from './Charts';
import { MetricType } from './DashboardAnalytics';

interface AnalyticsChartsProps {
    activeMetric: MetricType;
    chartData: MetricDataPoint[];
    attendanceData?: AttendanceDataPoint[];
}

export function AnalyticsCharts({ activeMetric, chartData, attendanceData }: AnalyticsChartsProps) {
    return (
        <motion.div
            key={activeMetric}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
        >
            <div className="h-[350px] w-full mb-8">
                {activeMetric === 'weight' && (
                    <MetricAreaChart
                        data={chartData}
                        title="Cumulative Weight Loss"
                        color="#C8102E" // Tongan Red
                        unit="kg"
                    />
                )}
                {activeMetric === 'lifestyle' && (
                    <MetricBarChart
                        data={chartData}
                        title="Total Lifestyle Posts"
                        color="#2A9D8F" // Teal-ish for lifestyle
                        unit="posts"
                    />
                )}
                {activeMetric === 'km' && (
                    <MetricBarChart
                        data={chartData}
                        title="Total Distance"
                        color="#0B3C5D" // Ocean
                        unit="km"
                    />
                )}
                {activeMetric === 'attendance' && (
                    <AttendanceSessionChart data={attendanceData || []} />
                )}
            </div>
        </motion.div>
    );
}
