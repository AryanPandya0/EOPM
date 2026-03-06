import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg px-3 py-2 text-xs">
            <p className="font-medium text-surface-700 dark:text-surface-300">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="mt-0.5">
                    {p.name}: {p.value.toFixed(3)} kWh
                </p>
            ))}
        </div>
    );
};

export default function PredictionChart({ predictions, height = 350 }) {
    if (!predictions || predictions.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-sm text-surface-400">
                No prediction data — train a model first
            </div>
        );
    }

    const formatted = predictions.map((d) => ({
        ...d,
        label: d.timestamp?.slice(5, 16) || d.timestamp,
    }));

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
                <Legend
                    formatter={(value) => (
                        <span className="text-xs text-surface-600 dark:text-surface-400">{value}</span>
                    )}
                />
                <Line
                    type="monotone"
                    name="Predicted (kWh)"
                    dataKey="predicted_kwh"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={false}
                    activeDot={{ r: 4, fill: '#8b5cf6' }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
