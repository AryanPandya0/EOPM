import { useState, useEffect } from 'react';
import {
    Lightbulb,
    AlertTriangle,
    Leaf,
    TrendingDown,
    DollarSign,
    Shield,
    ArrowRight,
} from 'lucide-react';
import { getRecommendations, getAnomalies, getSustainability } from '../api/client';

function SustainabilityGauge({ score, grade }) {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const color =
        score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';

    return (
        <div className="flex flex-col items-center">
            <svg width="150" height="150" viewBox="0 0 150 150">
                <circle
                    cx="75"
                    cy="75"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    className="text-surface-200 dark:text-surface-700"
                    strokeWidth="8"
                />
                <circle
                    cx="75"
                    cy="75"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    strokeLinecap="round"
                    className="score-ring"
                />
                <text x="75" y="68" textAnchor="middle" className="fill-surface-800 dark:fill-surface-100 text-2xl font-bold" fontSize="28" fontWeight="700">
                    {score}
                </text>
                <text x="75" y="90" textAnchor="middle" className="fill-surface-500 dark:fill-surface-400" fontSize="12">
                    Grade: {grade}
                </text>
            </svg>
        </div>
    );
}

export default function Recommendations() {
    const [recs, setRecs] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [sustainability, setSustainability] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState('recommendations');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [recsRes, anomRes, susRes] = await Promise.all([
                    getRecommendations(),
                    getAnomalies(),
                    getSustainability(),
                ]);
                setRecs(recsRes.data.recommendations);
                setAnomalies(anomRes.data.anomalies);
                setSustainability(susRes.data);
            } catch (err) {
                if (err.response?.status === 404) {
                    setError('No dataset loaded. Upload data first.');
                } else {
                    setError('Failed to load recommendations.');
                }
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner w-10 h-10" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3 animate-fade-in">
                <Lightbulb size={40} className="text-surface-300" />
                <p className="text-surface-500 dark:text-surface-400 text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
                    Optimization & Insights
                </h1>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    Actionable recommendations to reduce energy consumption and costs
                </p>
            </div>

            {/* Sustainability Overview */}
            {sustainability && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="card p-6 flex flex-col items-center justify-center">
                        <SustainabilityGauge score={sustainability.score} grade={sustainability.grade} />
                        <p className="text-xs text-surface-500 mt-2">Sustainability Score</p>
                    </div>
                    <div className="lg:col-span-3 card p-6">
                        <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-200 mb-4">
                            Environmental Impact Summary
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { icon: Leaf, label: 'Carbon Footprint', value: `${sustainability.carbon_footprint_kg} kg CO₂`, color: 'text-green-500' },
                                { icon: DollarSign, label: 'Energy Cost', value: `$${sustainability.estimated_cost_usd}`, color: 'text-blue-500' },
                                { icon: TrendingDown, label: 'Potential Savings', value: `${sustainability.potential_savings_kwh} kWh`, color: 'text-amber-500' },
                                { icon: Shield, label: 'Cost Savings', value: `$${sustainability.potential_cost_savings_usd}`, color: 'text-purple-500' },
                            ].map((item) => (
                                <div key={item.label} className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                                    <item.icon size={18} className={`${item.color} mb-2`} />
                                    <p className="text-[11px] text-surface-500 uppercase tracking-wider">{item.label}</p>
                                    <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 mt-1">
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-lg p-0.5 w-fit">
                {[
                    { key: 'recommendations', label: `Recommendations (${recs.length})`, icon: Lightbulb },
                    { key: 'anomalies', label: `Anomalies (${anomalies.length})`, icon: AlertTriangle },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`px-4 py-2 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${tab === key
                            ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-surface-100'
                            : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                            }`}
                    >
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Recommendations */}
            {tab === 'recommendations' && (
                <div className="space-y-3">
                    {recs.length === 0 ? (
                        <div className="card p-8 text-center">
                            <Lightbulb size={32} className="text-surface-300 mx-auto mb-2" />
                            <p className="text-sm text-surface-500">No recommendations — your energy usage looks optimal!</p>
                        </div>
                    ) : (
                        recs.map((rec, i) => (
                            <div key={i} className="card-hover p-5 animate-slide-in" style={{ animationDelay: `${i * 60}ms` }}>
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-lg ${rec.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                                        rec.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30' :
                                            'bg-green-100 dark:bg-green-900/30'
                                        }`}>
                                        <Lightbulb size={18} className={
                                            rec.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                                                rec.priority === 'medium' ? 'text-amber-600 dark:text-amber-400' :
                                                    'text-green-600 dark:text-green-400'
                                        } />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                                                {rec.title}
                                            </h3>
                                            <span className={`badge badge-${rec.priority}`}>{rec.priority}</span>
                                            <span className="badge bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400">
                                                {rec.category}
                                            </span>
                                        </div>
                                        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                                            {rec.description}
                                        </p>
                                        {rec.potential_savings_kwh > 0 && (
                                            <p className="mt-2 text-xs text-success font-medium flex items-center gap-1">
                                                <ArrowRight size={12} />
                                                Potential savings: {rec.potential_savings_kwh} kWh (${(rec.potential_savings_kwh * 0.12).toFixed(2)})
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Anomalies */}
            {tab === 'anomalies' && (
                <div className="card overflow-hidden">
                    {anomalies.length === 0 ? (
                        <div className="p-8 text-center">
                            <AlertTriangle size={32} className="text-surface-300 mx-auto mb-2" />
                            <p className="text-sm text-surface-500">No anomalies detected.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700">
                                        <th className="text-left py-2.5 px-4 text-xs font-medium text-surface-500 uppercase">Time</th>
                                        <th className="text-left py-2.5 px-4 text-xs font-medium text-surface-500 uppercase">Device</th>
                                        <th className="text-right py-2.5 px-4 text-xs font-medium text-surface-500 uppercase">Usage (kWh)</th>
                                        <th className="text-left py-2.5 px-4 text-xs font-medium text-surface-500 uppercase">Expected</th>
                                        <th className="text-center py-2.5 px-4 text-xs font-medium text-surface-500 uppercase">Severity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {anomalies.slice(0, 30).map((a, i) => (
                                        <tr key={i} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                                            <td className="py-2 px-4 text-surface-600 dark:text-surface-400 text-xs">{a.timestamp}</td>
                                            <td className="py-2 px-4 text-surface-700 dark:text-surface-300 font-medium">{a.device}</td>
                                            <td className="py-2 px-4 text-right font-semibold text-surface-800 dark:text-surface-200">{a.energy_kwh}</td>
                                            <td className="py-2 px-4 text-surface-500 text-xs">{a.expected_range}</td>
                                            <td className="py-2 px-4 text-center">
                                                <span className={`badge badge-${a.severity}`}>{a.severity}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
