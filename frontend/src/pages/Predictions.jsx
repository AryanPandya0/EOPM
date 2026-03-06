import { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Clock } from 'lucide-react';
import PredictionChart from '../components/charts/PredictionChart';
import { getForecast, getModelMetrics } from '../api/client';

export default function Predictions() {
    const [predictions, setPredictions] = useState([]);
    const [dailyForecast, setDailyForecast] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [totalPredicted, setTotalPredicted] = useState(0);
    const [hours, setHours] = useState(48);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPredictions = async () => {
        setLoading(true);
        setError(null);
        try {
            const [forecastRes, metricsRes] = await Promise.all([
                getForecast(hours),
                getModelMetrics().catch(() => null),
            ]);
            setPredictions(forecastRes.data.hourly);
            setDailyForecast(forecastRes.data.daily);
            setTotalPredicted(forecastRes.data.total_predicted_kwh);
            if (metricsRes) setMetrics(metricsRes.data);
        } catch (err) {
            if (err.response?.status === 400) {
                setError('No model trained yet. Go to Upload & Train first.');
            } else if (err.response?.status === 404) {
                setError('No dataset loaded. Upload data first.');
            } else {
                setError('Failed to load predictions.');
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPredictions();
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3 animate-fade-in">
                <TrendingUp size={40} className="text-surface-300" />
                <p className="text-surface-500 dark:text-surface-400 text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
                        Energy Predictions
                    </h1>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                        ML-powered forecasts of future energy consumption
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-surface-500">Forecast:</label>
                    <select
                        value={hours}
                        onChange={(e) => setHours(Number(e.target.value))}
                        className="text-sm border border-surface-300 dark:border-surface-600 rounded-lg px-3 py-1.5 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300"
                        id="forecast-hours-select"
                    >
                        <option value={24}>24 hours</option>
                        <option value={48}>48 hours</option>
                        <option value={72}>72 hours</option>
                        <option value={168}>7 days</option>
                    </select>
                    <button
                        onClick={fetchPredictions}
                        disabled={loading}
                        className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
                        id="run-forecast-btn"
                    >
                        {loading ? 'Loading...' : 'Forecast'}
                    </button>
                </div>
            </div>

            {/* Model Metrics */}
            {metrics && (
                <div className="card p-5">
                    <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-200 mb-3 flex items-center gap-2">
                        <BarChart3 size={16} />
                        Model Performance
                        <span className="badge badge-low ml-1">{metrics.best_model}</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {Object.entries(metrics.models).map(([name, m]) => (
                            <div
                                key={name}
                                className={`p-4 rounded-lg border ${name === metrics.best_model
                                    ? 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/20'
                                    : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50'
                                    }`}
                            >
                                <p className="text-xs font-medium text-surface-600 dark:text-surface-400 mb-2">
                                    {name} {name === metrics.best_model && '⭐'}
                                </p>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-surface-500">RMSE</span>
                                        <span className="font-medium text-surface-700 dark:text-surface-300">{m.rmse}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-surface-500">MAE</span>
                                        <span className="font-medium text-surface-700 dark:text-surface-300">{m.mae}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-surface-500">R² Score</span>
                                        <span className="font-medium text-surface-700 dark:text-surface-300">{m.r2}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Prediction Chart */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="spinner w-10 h-10" />
                </div>
            ) : (
                <>
                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                                Hourly Forecast
                            </h2>
                            <span className="text-xs text-surface-500">
                                Total: <span className="font-semibold">{totalPredicted.toFixed(2)} kWh</span>
                            </span>
                        </div>
                        <PredictionChart predictions={predictions} height={320} />
                    </div>

                    {/* Daily Summary Table */}
                    {dailyForecast.length > 0 && (
                        <div className="card p-5">
                            <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-200 mb-4 flex items-center gap-2">
                                <Clock size={16} />
                                Daily Forecast Summary
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-surface-200 dark:border-surface-700">
                                            <th className="text-left py-2 px-3 text-xs font-medium text-surface-500 uppercase">Date</th>
                                            <th className="text-right py-2 px-3 text-xs font-medium text-surface-500 uppercase">Predicted kWh</th>
                                            <th className="text-right py-2 px-3 text-xs font-medium text-surface-500 uppercase">Est. Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dailyForecast.map((d) => (
                                            <tr key={d.date} className="border-b border-surface-100 dark:border-surface-800">
                                                <td className="py-2.5 px-3 text-surface-700 dark:text-surface-300">{d.date}</td>
                                                <td className="py-2.5 px-3 text-right font-medium text-surface-800 dark:text-surface-200">
                                                    {d.predicted_kwh.toFixed(2)}
                                                </td>
                                                <td className="py-2.5 px-3 text-right text-surface-600 dark:text-surface-400">
                                                    ₹{(d.predicted_kwh * 8.0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
