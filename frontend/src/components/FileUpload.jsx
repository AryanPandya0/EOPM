import { useCallback, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function FileUpload({ onUpload, loading }) {
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState(null);

    const handleFile = useCallback(
        (file) => {
            if (!file) return;
            if (!file.name.endsWith('.csv')) {
                alert('Please upload a CSV file.');
                return;
            }
            setFileName(file.name);
            onUpload(file);
        },
        [onUpload]
    );

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files[0];
            handleFile(file);
        },
        [handleFile]
    );

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = () => setDragActive(false);

    const handleInputChange = (e) => {
        const file = e.target.files[0];
        handleFile(file);
    };

    return (
        <div
            className={`drop-zone cursor-pointer ${dragActive ? 'active' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('csv-file-input').click()}
        >
            <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleInputChange}
            />

            {loading ? (
                <div className="flex flex-col items-center gap-3">
                    <div className="spinner w-10 h-10" />
                    <p className="text-sm text-surface-600 dark:text-surface-400">Processing {fileName}...</p>
                </div>
            ) : fileName ? (
                <div className="flex flex-col items-center gap-3">
                    <CheckCircle size={40} className="text-success" />
                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{fileName}</p>
                    <p className="text-xs text-surface-500">Click or drop to replace</p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-surface-100 dark:bg-surface-800">
                        <Upload size={28} className="text-surface-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                            Drop your CSV file here
                        </p>
                        <p className="text-xs text-surface-500 mt-1">or click to browse</p>
                    </div>
                    <p className="text-[11px] text-surface-400 mt-2">
                        Accepted format: .csv with columns: timestamp, device, energy_kwh, temperature, occupancy
                    </p>
                </div>
            )}
        </div>
    );
}
