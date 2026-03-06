export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
    return (
        <div className="stat-card p-5" data-color={color}>
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                        {title}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-surface-900 dark:text-surface-100 truncate">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                            {subtitle}
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className={`p-2.5 rounded-lg bg-surface-100 dark:bg-surface-700/50`}>
                        <Icon size={20} className="text-surface-500 dark:text-surface-400" />
                    </div>
                )}
            </div>
        </div>
    );
}
