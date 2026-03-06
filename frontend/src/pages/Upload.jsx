import { useState, useCallback } from 'react';
import { Upload as UploadIcon, Database, PlayCircle, CheckCircle, AlertCircle } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import { uploadDataset, loadSampleDataset, trainModel } from '../api/client';

export default function Upload() {
    const [uploadStatus, setUploadStatus] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [trainStatus, setTrainStatus] = useState(null);
    const [trainLoading, setTrainLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleUpload = useCallback(async (file) => {
        setLoading(true);
        setError(null);
        setUploadStatus(null);
        try {
            const res = await uploadDataset(file);
            setUploadStatus(res.data.message);
            setStats(res.data.stats);
        } catch (err) {
            setError(err.response?.data?.detail || 'Upload failed');
        }
        setLoading(false);
    }, []);

    const handleLoadSample = async () => {
        setLoading(true);
        setError(null);
        setUploadStatus(null);
        try {
            const res = await loadSampleDataset();
            setUploadStatus(res.data.message);
            setStats(res.data.stats);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load sample dataset');
        }
        setLoading(false);
    };

    const handleTrain = async () => {
        setTrainLoading(true);
        setTrainStatus(null);
        try {
            const res = await trainModel();
            setTrainStatus(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Training failed');
        }
        setTrainLoading(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
                    Upload & Train
                </h1>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    Upload your energy consumption dataset and train the prediction model
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Section */}
                <div className="card p-6">
                    <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-200 mb-4 flex items-center gap-2">
                        <UploadIcon size={16} />
                        Upload Dataset
                    </h2>
                    <FileUpload onUpload={handleUpload} loading={loading} />
                    <div className="mt-4 flex items-center gap-3">
                        <div className="h-px flex-1 bg-surface-200 dark:bg-surface-700" />
                        <span className="text-xs text-surface-400">or</span>
                        <div className="h-px flex-1 bg-surface-200 dark:bg-surface-700" />
                    </div>
                    <button
                        onClick={handleLoadSample}
                        disabled={loading}
                        className="mt-4 w-full py-2.5 px-4 rounded-lg border border-surface-300 dark:border-surface-600 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        id="load-sample-btn"
                    >
                        <Database size={16} />
                        Load Sample Dataset
                    </button>
                </div>

                {/* Train Section */}
                <div className="card p-6">
                    <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-200 mb-4 flex items-center gap-2">
                        <PlayCircle size={16} />
                        Train ML Model
                    </h2>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                        Train prediction models on the uploaded dataset. The system will evaluate multiple algorithms
                        and select the best one.
                    </p>
                    <button
                        onClick={handleTrain}
                        disabled={trainLoading || !stats}
                        className="w-full py-2.5 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        id="train-model-btn"
                    >
                        {trainLoading ? (
                            <>
                                <div className="spinner w-4 h-4" />
                                Training Models...
                            </>
                        ) : (
                            <>
                                <PlayCircle size={16} />
                                Train Models
                            </>
                        )}
                    </button>

                    {!stats && (
                        <p className="mt-3 text-xs text-surface-400 text-center">
                            Upload or load a dataset first
                        </p>
                    )}
                </div>
            </div>

            {/* Status Messages */}
            {error && (
                <div className="card p-4 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle size={16} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                </div>
            )}

            {uploadStatus && (
                <div className="card p-4 border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">{uploadStatus}</span>
                    </div>
                </div>
            )}

            {/* Dataset Stats */}
            {stats && (
                <div className="card p-6">
                    <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-200 mb-4">
                        Dataset Summary
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Records', value: stats.record_count?.toLocaleString() },
                            { label: 'Total kWh', value: stats.total_kwh?.toFixed(1) },
                            { label: 'Avg Daily kWh', value: stats.avg_daily_kwh?.toFixed(1) },
                            { label: 'Devices', value: stats.num_devices },
                            { label: 'Days', value: stats.date_range_days },
                            { label: 'Peak Hour', value: `${stats.peak_hour}:00` },
                            { label: 'Top Device', value: stats.top_device },
                        ].map((item) => (
                            <div key={item.label} className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                                <p className="text-[11px] text-surface-500 uppercase tracking-wider">{item.label}</p>
                                <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 mt-1">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Training Results */}
            {trainStatus && (
                <div className="card p-6">
                    <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-200 mb-4 flex items-center gap-2">
                        <CheckCircle size={16} className="text-success" />
                        Training Complete
                    </h2>
                    <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                        Best model: <span className="font-semibold text-primary-600 dark:text-primary-400">{trainStatus.best_model}</span>
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-surface-200 dark:border-surface-700">
                                    <th className="text-left py-2 px-3 text-xs font-medium text-surface-500 uppercase">Model</th>
                                    <th className="text-right py-2 px-3 text-xs font-medium text-surface-500 uppercase">RMSE</th>
                                    <th className="text-right py-2 px-3 text-xs font-medium text-surface-500 uppercase">MAE</th>
                                    <th className="text-right py-2 px-3 text-xs font-medium text-surface-500 uppercase">R² Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(trainStatus.metrics).map(([name, m]) => (
                                    <tr
                                        key={name}
                                        className={`border-b border-surface-100 dark:border-surface-800 ${name === trainStatus.best_model ? 'bg-primary-50/50 dark:bg-primary-950/20' : ''
                                            }`}
                                    >
                                        <td className="py-2.5 px-3 font-medium text-surface-700 dark:text-surface-300">
                                            {name}
                                            {name === trainStatus.best_model && (
                                                <span className="ml-2 badge badge-low">Best</span>
                                            )}
                                        </td>
                                        <td className="py-2.5 px-3 text-right text-surface-600 dark:text-surface-400">{m.rmse}</td>
                                        <td className="py-2.5 px-3 text-right text-surface-600 dark:text-surface-400">{m.mae}</td>
                                        <td className="py-2.5 px-3 text-right text-surface-600 dark:text-surface-400">{m.r2}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
