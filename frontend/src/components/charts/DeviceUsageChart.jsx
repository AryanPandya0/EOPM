import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
} from 'recharts';

const COLORS = ['#338dff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
        <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg px-3 py-2 text-xs">
            <p className="font-medium text-surface-700 dark:text-surface-300">{d.name}</p>
            <p style={{ color: d.payload.fill }} className="mt-1">
                {d.value.toFixed(2)} kWh ({d.payload.percentage}%)
            </p>
        </div>
    );
};

export default function DeviceUsageChart({ data, height = 300 }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-sm text-surface-400">
                No device data available
            </div>
        );
    }

    const chartData = data.map((d, i) => ({
        name: d.device,
        value: d.total_kwh,
        percentage: d.percentage,
        fill: COLORS[i % COLORS.length],
    }));

    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                >
                    {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                        <span className="text-xs text-surface-600 dark:text-surface-400">{value}</span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
