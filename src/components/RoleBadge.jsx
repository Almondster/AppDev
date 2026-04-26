import { memo } from 'react';

const RoleBadge = memo(({ role }) => {
  const getRoleStyles = (roleType) => {
    switch (roleType) {
      case 'Creator':
        return {
          backgroundColor: 'rgba(168, 85, 247, 0.15)',
          color: '#c084fc',
          borderColor: 'rgba(168, 85, 247, 0.3)'
        };
      case 'Client':
        return {
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          color: '#4ade80',
          borderColor: 'rgba(34, 197, 94, 0.3)'
        };
      case 'Admin':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          borderColor: 'rgba(239, 68, 68, 0.3)'
        };
      default:
        return {
          backgroundColor: 'rgba(161, 161, 170, 0.15)',
          color: '#a1a1aa',
          borderColor: 'rgba(161, 161, 170, 0.3)'
        };
    }
  };

  const styles = getRoleStyles(role);

  return (
    <span
      style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        border: `1px solid ${styles.borderColor}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}
    >
      {role === 'Creator' && '🎨'}
      {role === 'Client' && '💼'}
      {role === 'Admin' && '⚡'}
      {role}
    </span>
  );
});

RoleBadge.displayName = 'RoleBadge';

export default RoleBadge;