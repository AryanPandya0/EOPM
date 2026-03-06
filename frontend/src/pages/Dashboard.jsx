import { useState, useEffect } from 'react';
import { Zap, TrendingUp, Clock, Cpu, Leaf, DollarSign } from 'lucide-react';
import StatCard from '../components/StatCard';
import EnergyTrendChart from '../components/charts/EnergyTrendChart';
import DeviceUsageChart from '../components/charts/DeviceUsageChart';
import DailyComparisonChart from '../components/charts/DailyComparisonChart';
import { getDashboardOverview, getTrends, getDeviceBreakdown, getPeakHours } from '../api/client';

export default function Dashboard() {
    const [overview, setOverview] = useState(null);
    const [trends, setTrends] = useState([]);
    const [dailyTrends, setDailyTrends] = useState([]);
    const [devices, setDevices] = useState([]);
    const [peakHours, setPeakHours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trendView, setTrendView] = useState('hourly');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [ov, hr, daily, dev, peak] = await Promise.all([
                getDashboardOverview(),
                getTrends('hourly'),
                getTrends('daily'),
                getDeviceBreakdown(),
                getPeakHours(),
            ]);
            setOverview(ov.data);
            setTrends(hr.data.data);
            setDailyTrends(daily.data.data);
            setDevices(dev.data.devices);
            setPeakHours(peak.data.data);
        } catch (err) {
            if (err.response?.status === 404) {
                setError('No dataset loaded. Go to Upload to load data.');
            } else {
                setError('Failed to load dashboard data.');
            }
        }
        setLoading(false);
    };

    useEffect(() => {
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
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Zap size={40} className="text-surface-300" />
                <p className="text-surface-500 dark:text-surface-400 text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
                    Energy Dashboard
                </h1>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    Overview of your energy consumption and optimization insights
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Usage"
                    value={`${overview?.total_kwh?.toLocaleString()} kWh`}
                    icon={Zap}
                    trend={-2.4}
                />
                <StatCard
                    title="Avg Daily Usage"
                    value={`${overview?.avg_daily_kwh?.toFixed(1)} kWh`}
                    icon={TrendingUp}
                    trend={1.2}
                    color="blue"
                />
                <StatCard
                    title="Est. Monthly Cost"
                    value={`₹${(overview?.avg_daily_kwh * 30 * 8.00).toFixed(0)}`}
                    icon={DollarSign}
                    color="emerald"
                />
                <StatCard
                    title="Sustainability"
                    value={`Grade ${overview?.sustainability_grade}`}
                    icon={Leaf}
                    color="green"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Energy Trends */}
                <div className="lg:col-span-2 card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                            Energy Consumption Trends
                        </h2>
                        <div className="flex gap-1 bg-surface-100 dark:bg-surface-700 rounded-lg p-0.5">
                            <button
                                onClick={() => setTrendView('hourly')}
                                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${trendView === 'hourly'
                                    ? 'bg-white dark:bg-surface-600 shadow-sm text-surface-900 dark:text-surface-100'
                                    : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                                    }`}
                            >
                                Hourly
                            </button>
                            <button
                                onClick={() => setTrendView('daily')}
                                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${trendView === 'daily'
                                    ? 'bg-white dark:bg-surface-600 shadow-sm text-surface-900 dark:text-surface-100'
                                    : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                                    }`}
                            >
                                Daily
                            </button>
                        </div>
                    </div>
                    {trendView === 'hourly' ? (
                        <EnergyTrendChart data={trends} height={280} />
                    ) : (
                        <DailyComparisonChart data={dailyTrends} height={280} />
                    )}
                </div>

                {/* Device Breakdown */}
                <div className="card p-5">
                    <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-200 mb-4">
                        Device Breakdown
                    </h2>
                    <DeviceUsageChart data={devices} height={280} />
                </div>
            </div>

            {/* Charts Row 2 — Peak Hours */}
            <div className="card p-5">
                <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-200 mb-4">
                    Hourly Consumption Analysis
                </h2>
                <DailyComparisonChart
                    data={peakHours.map((h) => ({
                        timestamp: h.label,
                        energy_kwh: h.total_kwh,
                    }))}
                    height={250}
                />
            </div>
        </div>
    );
}
