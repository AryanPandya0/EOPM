import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Predictions from './pages/Predictions';
import Recommendations from './pages/Recommendations';

function App() {
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('eopm-theme');
        return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        localStorage.setItem('eopm-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    return (
        <Router>
            <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/predictions" element={<Predictions />} />
                    <Route path="/recommendations" element={<Recommendations />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
