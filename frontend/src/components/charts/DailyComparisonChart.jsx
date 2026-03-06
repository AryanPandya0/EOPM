import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg px-3 py-2 text-xs">
            <p className="font-medium text-surface-700 dark:text-surface-300">{label}</p>
            <p className="text-primary-600 dark:text-primary-400 mt-1">
                {payload[0].value.toFixed(2)} kWh
            </p>
        </div>
    );
};

export default function DailyComparisonChart({ data, height = 300 }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-sm text-surface-400">
                No daily data available
            </div>
        );
    }

    const formatted = data.map((d) => ({
        ...d,
        label: d.timestamp?.slice(5) || d.timestamp,
    }));

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-200 dark:text-surface-700" />
                <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    interval="preserveStartEnd"
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                    dataKey="energy_kwh"
                    fill="#338dff"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
