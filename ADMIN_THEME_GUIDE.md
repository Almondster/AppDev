# Admin Theme Guide

## Color Palette

### Primary Colors
- **Rose/Pink**: `#f43f5e` (rgb(244, 63, 94))
- **Purple**: `#a855f7` (rgb(168, 85, 247))
- **Gradient**: Rose → Purple

### Background Colors
- **Header Gradient**: `linear-gradient(135deg, rgba(244,63,94,0.08), rgba(168,85,247,0.08))`
- **Icon Container**: `rgba(244,63,94,0.1)`
- **Card Background**: `rgba(255,255,255,0.02)`
- **Border**: `rgba(255,255,255,0.05)`

### Status Colors
- **Success/Completed**: `#10b981` (Emerald)
- **Warning/Pending**: `#facc15` (Amber)
- **Error/Cancelled**: `#ef4444` (Red)
- **Info/Active**: `#38bdf8` (Sky Blue)
- **Purple/Delivered**: `#a855f7` (Purple)

## Component Styling

### Page Header
```jsx
<div className="rounded-2xl p-6 md:p-8" style={{ 
    background: 'linear-gradient(135deg, rgba(244,63,94,0.08), rgba(168,85,247,0.08))',
    border: '1px solid rgba(255,255,255,0.05)'
}}>
    <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
            background: 'rgba(244,63,94,0.1)',
            border: '1px solid rgba(244,63,94,0.2)'
        }}>
            <Icon size={22} className="text-rose-400" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Page Title</h1>
    </div>
    <p className="text-zinc-400 text-sm">Page description</p>
</div>
```

### Status Badge
```jsx
<span style={{ 
    background: 'rgba(16,185,129,0.1)', 
    color: '#10b981', 
    border: '1px solid rgba(16,185,129,0.2)',
    padding: '0.25rem 0.75rem', 
    borderRadius: '20px', 
    fontSize: '0.75rem', 
    fontWeight: '600', 
    textTransform: 'capitalize',
    boxShadow: '0 0 10px rgba(16,185,129,0.1)'
}}>
    Status Text
</span>
```

### Action Button (Success)
```jsx
<button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)]">
    <Icon size={12} className="inline mr-1" />
    Action
</button>
```

### Action Button (Danger)
```jsx
<button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all">
    <Icon size={12} className="inline mr-1" />
    Delete
</button>
```

### Table Container
```jsx
<div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
    <table className="w-full">
        <thead>
            <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Column
                </th>
            </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
            <tr className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-4 py-4 text-sm text-white font-medium">
                    Content
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

### Loading Skeleton
```jsx
<div className="h-4 rounded bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer" 
     style={{ width: '60%' }}>
</div>
```

### Toast Notification
```jsx
<div className="fixed top-6 right-6 z-50 px-6 py-4 rounded-xl backdrop-blur-md shadow-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-in fade-in slide-in-from-top-2 duration-300">
    Message text
</div>
```

## Typography

### Headings
- **H1**: `text-2xl md:text-3xl font-bold text-white`
- **H2**: `text-lg font-semibold text-white`
- **H3**: `text-xs font-semibold text-zinc-400 uppercase tracking-wider`

### Body Text
- **Primary**: `text-sm text-white`
- **Secondary**: `text-sm text-zinc-400`
- **Muted**: `text-xs text-zinc-500`

## Spacing

### Padding
- **Page Container**: `p-6 md:p-8`
- **Card**: `p-6`
- **Button**: `px-3 py-1.5` (small), `px-4 py-2.5` (medium)
- **Table Cell**: `px-4 py-4`

### Gaps
- **Header Elements**: `gap-3`
- **Button Groups**: `gap-2`
- **Grid**: `gap-4` or `gap-6`

## Animations

### Transitions
- **Default**: `transition-colors` or `transition-all`
- **Hover States**: Always include hover effects
- **Loading**: Use shimmer animation for skeletons

### Shimmer Animation (Add to CSS)
```css
@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

.animate-shimmer {
    animation: shimmer 2s infinite;
}
```

## Icons

### Sizes
- **Header**: `size={22}`
- **Button**: `size={12}` or `size={14}`
- **Table**: `size={16}`

### Colors
- **Admin Theme**: `text-rose-400`
- **Success**: `text-emerald-400`
- **Warning**: `text-amber-400`
- **Error**: `text-red-400`
- **Info**: `text-blue-400`

## Responsive Design

### Breakpoints
- **Mobile**: Default
- **Tablet**: `md:` prefix
- **Desktop**: `lg:` prefix

### Grid Layouts
```jsx
// Stats Grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// Table Columns (adjust colspan for admin)
{isAdmin ? "7" : "6"}
```

## Best Practices

1. **Always use backdrop-blur** for modals and overlays
2. **Include loading states** with shimmer animations
3. **Add confirmation modals** for destructive actions
4. **Show toast notifications** for all user actions
5. **Use consistent spacing** across all pages
6. **Maintain color consistency** with the admin theme
7. **Add hover effects** to all interactive elements
8. **Use semantic HTML** for accessibility
9. **Test responsive design** on all screen sizes
10. **Include proper ARIA labels** for screen readers

## Example: Complete Admin Page Structure

```jsx
const AdminPage = () => {
    return (
        <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto h-full pb-20">
            {/* Toast */}
            {toast && <Toast />}

            {/* Header */}
            <div className="rounded-2xl p-6 md:p-8" style={{ 
                background: 'linear-gradient(135deg, rgba(244,63,94,0.08), rgba(168,85,247,0.08))',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                        background: 'rgba(244,63,94,0.1)',
                        border: '1px solid rgba(244,63,94,0.2)'
                    }}>
                        <Icon size={22} className="text-rose-400" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Page Title</h1>
                </div>
                <p className="text-zinc-400 text-sm">Description</p>
            </div>

            {/* Stats or Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stat cards */}
            </div>

            {/* Main Content */}
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                {/* Table or content */}
            </div>

            {/* Modals */}
            {confirmModal.open && <ConfirmModal />}
        </main>
    );
};
```

## Accessibility

- Use semantic HTML elements
- Include ARIA labels for icons
- Ensure sufficient color contrast
- Support keyboard navigation
- Add focus states to interactive elements
- Provide alternative text for images
- Use proper heading hierarchy
