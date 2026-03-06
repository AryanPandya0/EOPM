import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 30000,
});

// Dataset
export const uploadDataset = (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/dataset/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
export const loadSampleDataset = () => api.post('/dataset/load-sample');
export const getDatasetSummary = () => api.get('/dataset/summary');
export const getDatasetRecords = (limit = 100, offset = 0) =>
    api.get(`/dataset/records?limit=${limit}&offset=${offset}`);

// Prediction
export const trainModel = () => api.post('/predict/train');
export const getForecast = (hours = 24) => api.get(`/predict/forecast?hours=${hours}`);
export const getModelMetrics = () => api.get('/predict/metrics');

// Dashboard
export const getDashboardOverview = () => api.get('/dashboard/overview');
export const getTrends = (granularity = 'hourly') =>
    api.get(`/dashboard/trends?granularity=${granularity}`);
export const getDeviceBreakdown = () => api.get('/dashboard/devices');
export const getPeakHours = () => api.get('/dashboard/peak-hours');

// Optimization
export const getRecommendations = () => api.get('/optimize/recommendations');
export const getAnomalies = () => api.get('/optimize/anomalies');
export const getSustainability = () => api.get('/optimize/sustainability');

export default api;
