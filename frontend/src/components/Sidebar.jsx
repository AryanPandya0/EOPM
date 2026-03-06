import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Upload,
    TrendingUp,
    Lightbulb,
    Zap,
    X,
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/upload', icon: Upload, label: 'Upload Data' },
    { to: '/predictions', icon: TrendingUp, label: 'Predictions' },
    { to: '/recommendations', icon: Lightbulb, label: 'Recommendations' },
];

export default function Sidebar({ onClose }) {
    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-surface-200 dark:border-surface-800">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                        <Zap size={18} className="text-white" />
                    </div>
                    <div>
                        <span className="font-semibold text-sm tracking-tight">EOPM</span>
                        <p className="text-[10px] text-surface-500 dark:text-surface-400 leading-none mt-0.5">Energy Platform</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="lg:hidden p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-surface-400 dark:text-surface-500">
                    Navigation
                </p>
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                                ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400'
                                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-200'
                            }`
                        }
                        end={to === '/'}
                    >
                        <Icon size={18} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-surface-200 dark:border-surface-800">
                <p className="text-[11px] text-surface-400 dark:text-surface-500">
                    EOPM v1.0.0
                </p>
                <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-0.5">
                    Energy Optimization Platform
                </p>
            </div>
        </div>
    );
}
