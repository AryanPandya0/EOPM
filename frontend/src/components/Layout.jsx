import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Layout({ children, darkMode, setDarkMode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-screen w-[260px] bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </aside>

            {/* Main content */}
            <div className="lg:ml-[260px]">
                {/* Header */}
                <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-800 flex items-center justify-between px-4 lg:px-6">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        id="menu-toggle"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex-1" />
                    <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-6 max-w-[1400px] mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
