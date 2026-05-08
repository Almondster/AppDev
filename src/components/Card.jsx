import { memo } from 'react';

const Card = memo(({ title, children, status, onClick, clickable = false }) => {
  return (
    <article
      className={`card${clickable ? ' card--clickable' : ''}`}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <div className="card__header">
        <h3 className="card__title">{title}</h3>
        {status && (
          <span className={`badge badge--${status.toLowerCase().replace(' ', '-')}`}>
            {status}
          </span>
        )}
      </div>
      <div className="card__body">
        {children}
      </div>
    </article>
  );
});

Card.displayName = 'Card';

export default Card;
