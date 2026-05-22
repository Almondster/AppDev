export const ServiceSkeleton = () => (
    <div className="cm-service-card" style={{ pointerEvents: 'none' }}>
        <div className="cm-service-thumb skeleton" style={{ position: 'relative' }}>
            <div className="skeleton-badge" style={{ position: 'absolute', top: 12, right: 12, width: 72 }}></div>
        </div>
        <div className="cm-service-info">
            <div className="skeleton-row" style={{ marginBottom: 8 }}>
                <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 8 }}></div>
                <div className="skeleton" style={{ width: 100, height: 16 }}></div>
            </div>
            <div className="skeleton" style={{ width: '92%', height: 18, marginBottom: 6 }}></div>
            <div className="skeleton" style={{ width: '70%', height: 16, marginBottom: 14 }}></div>
            <div className="skeleton-divider"></div>
            <div className="skeleton-row" style={{ justifyContent: 'space-between' }}>
                <div className="skeleton" style={{ width: 80, height: 16 }}></div>
                <div className="skeleton" style={{ width: 65, height: 22, borderRadius: 6 }}></div>
            </div>
        </div>
    </div>
);

export const CreatorSkeleton = () => (
    <div className="cm-creator-card" style={{ pointerEvents: 'none' }}>
        <div className="cm-creator-header">
            <div className="skeleton skeleton-avatar--lg"></div>
            <div className="skeleton-col" style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '55%', height: 18 }}></div>
                <div className="skeleton" style={{ width: '80%', height: 14 }}></div>
                <div className="skeleton" style={{ width: '35%', height: 14 }}></div>
            </div>
            <div className="skeleton-col" style={{ flex: 0, alignItems: 'flex-end' }}>
                <div className="skeleton" style={{ width: 55, height: 18 }}></div>
                <div className="skeleton" style={{ width: 75, height: 14 }}></div>
            </div>
        </div>
        <div className="skeleton" style={{ width: '92%', height: 16, marginTop: 6 }}></div>
        <div className="skeleton" style={{ width: '70%', height: 16 }}></div>
        <div className="skeleton-row" style={{ gap: 6, marginTop: 6 }}>
            <div className="skeleton" style={{ width: 90, height: 26, borderRadius: 6 }}></div>
            <div className="skeleton" style={{ width: 110, height: 26, borderRadius: 6 }}></div>
            <div className="skeleton" style={{ width: 80, height: 26, borderRadius: 6 }}></div>
        </div>
        <div className="skeleton-divider" style={{ margin: '14px 0' }}></div>
        <div className="skeleton-row" style={{ justifyContent: 'space-between' }}>
            <div className="skeleton-col" style={{ gap: 5 }}>
                <div className="skeleton" style={{ width: 70, height: 14 }}></div>
                <div className="skeleton" style={{ width: 85, height: 20, borderRadius: 4 }}></div>
            </div>
            <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 8 }}></div>
        </div>
    </div>
);
