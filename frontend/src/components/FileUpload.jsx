import { useCallback, useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
const ACCEPT_STRING = '.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';

function isValidFile(file) {
    if (!file) return false;
    const name = file.name.toLowerCase();
    return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export default function FileUpload({ onUpload, loading }) {
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState(null);
    const fileInputRef = useRef(null);

    const handleFile = useCallback(
        (file) => {
            if (!file) return;
            if (!isValidFile(file)) {
                alert('Please upload a CSV or Excel (.xlsx) file.');
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
        // Reset input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const openFilePicker = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div
            className={`drop-zone cursor-pointer ${dragActive ? 'active' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFilePicker}
        >
            <input
                ref={fileInputRef}
                id="dataset-file-input"
                type="file"
                accept={ACCEPT_STRING}
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
                    <p className="text-xs text-surface-500">Tap or drop to replace</p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-surface-100 dark:bg-surface-800">
                        <Upload size={28} className="text-surface-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                            Tap to select a file
                        </p>
                        <p className="text-xs text-surface-500 mt-1">or drag & drop on desktop</p>
                    </div>
                    <p className="text-[11px] text-surface-400 mt-2">
                        Accepted: .csv, .xlsx, .xls
                    </p>
                </div>
            )}
        </div>
    );
}
