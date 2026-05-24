import React, { useState, useEffect } from 'react';
import { Star, Clock, Heart, Zap, TrendingUp, Users } from 'lucide-react';
import './RecommendationsSection.css';

const RecommendationCard = ({ service, isFavorited, onFavoriteToggle }) => {
  return (
    <div className="rec-card">
      <div className="rec-card-image">
        {service.image_url ? (
          <img src={service.image_url} alt={service.title} />
        ) : (
          <div className="rec-image-placeholder">No image</div>
        )}
        <button
          className={`rec-favorite-btn ${isFavorited ? 'active' : ''}`}
          onClick={() => onFavoriteToggle(service.id)}
        >
          <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="rec-card-content">
        <span className="rec-category-badge">{service.category}</span>
        <h4 className="rec-title">{service.title}</h4>
        <p className="rec-description">{service.description}</p>

        <div className="rec-meta">
          <div className="rec-rating">
            <Star size={14} fill="#fbbf24" color="#fbbf24" />
            <span>{(service.rating || 0).toFixed(1)}</span>
          </div>
          <div className="rec-delivery">
            <Clock size={14} />
            <span>{service.delivery_days || 7}d</span>
          </div>
        </div>

        <div className="rec-footer">
          <span className="rec-price">₱{Number(service.price || 0).toLocaleString()}</span>
          <a href={`/services/${service.id}`} className="rec-view-btn">
            View
          </a>
        </div>
      </div>
    </div>
  );
};

const RecommendationsSection = ({
  title,
  subtitle,
  icon: Icon,
  services = [],
  favoriteServices = [],
  onFavoriteToggle,
  variant = 'default',
}) => {
  if (!services || services.length === 0) return null;

  return (
    <div className={`recommendations-section rec-variant-${variant}`}>
      <div className="rec-section-header">
        {Icon && <Icon size={24} className="rec-section-icon" />}
        <div>
          <h2 className="rec-section-title">{title}</h2>
          {subtitle && <p className="rec-section-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="rec-cards-grid">
        {services.map((service) => (
          <RecommendationCard
            key={service.id}
            service={service}
            isFavorited={favoriteServices.includes(service.id)}
            onFavoriteToggle={onFavoriteToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default RecommendationsSection;
