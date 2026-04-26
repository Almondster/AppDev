import { memo } from 'react';

const ServiceCard = memo(({ services = [] }) => {
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
      {services.map((service, index) => (
        <span
          key={index}
          style={{
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '0.7rem',
            fontWeight: '500',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            color: '#60a5fa',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}
        >
          {service}
        </span>
      ))}
    </div>
  );
});

ServiceCard.displayName = 'ServiceCard';

export default ServiceCard;