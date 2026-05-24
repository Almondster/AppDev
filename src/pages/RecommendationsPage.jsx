import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, Heart, Users, Lightbulb } from 'lucide-react';
import { fetchServices } from '../api';
import { readCollection } from '../utils/collections';
import {
  getTrendingServices,
  getPersonalizedRecommendations,
  trackServiceView,
} from '../utils/recommendations';
import RecommendationsSection from '../components/RecommendationsSection';
import './RecommendationsPage.css';

const RecommendationsPage = () => {
  const [services, setServices] = useState([]);
  const [trendingServices, setTrendingServices] = useState([]);
  const [personalizedServices, setPersonalizedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteServices, setFavoriteServices] = useState([]);

  useEffect(() => {
    // Load favorites from localStorage
    const favorites = localStorage.getItem('createch_favorite_services');
    if (favorites) {
      setFavoriteServices(JSON.parse(favorites));
    }

    // Load services
    (async () => {
      try {
        const res = await fetchServices();
        if (res.ok) {
          const items = readCollection(res);
          setServices(items);

          // Generate recommendations
          setTrendingServices(getTrendingServices(items));
          setPersonalizedServices(getPersonalizedRecommendations(items));
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleFavorite = (serviceId) => {
    const updated = favoriteServices.includes(serviceId)
      ? favoriteServices.filter((id) => id !== serviceId)
      : [...favoriteServices, serviceId];
    setFavoriteServices(updated);
    localStorage.setItem('createch_favorite_services', JSON.stringify(updated));
  };

  if (loading) {
    return (
      <div className="rec-loading">
        <div className="rec-spinner"></div>
        <p>Loading recommendations...</p>
      </div>
    );
  }

  return (
    <div className="recommendations-page">
      <div className="rec-page-header">
        <h1>Discover What's Perfect for You</h1>
        <p>Personalized recommendations based on your interests and activity</p>
      </div>

      <div className="rec-page-content">
        {/* Personalized Recommendations */}
        {personalizedServices.length > 0 && (
          <RecommendationsSection
            title="Recommended For You"
            subtitle="Services tailored to your interests based on your search history and favorites"
            icon={Lightbulb}
            services={personalizedServices}
            favoriteServices={favoriteServices}
            onFavoriteToggle={toggleFavorite}
            variant="personalized"
          />
        )}

        {/* Trending Services */}
        {trendingServices.length > 0 && (
          <RecommendationsSection
            title="Trending Now"
            subtitle="Most popular services this week"
            icon={TrendingUp}
            services={trendingServices}
            favoriteServices={favoriteServices}
            onFavoriteToggle={toggleFavorite}
            variant="trending"
          />
        )}

        {/* No Recommendations */}
        {personalizedServices.length === 0 && trendingServices.length === 0 && (
          <div className="rec-empty-state">
            <Lightbulb size={48} />
            <h3>No recommendations yet</h3>
            <p>Start by exploring the marketplace to get personalized recommendations</p>
            <a href="/marketplace" className="rec-explore-btn">
              Explore Marketplace
            </a>
          </div>
        )}

        {/* Info Section */}
        <div className="rec-info-section">
          <div className="rec-info-card">
            <Zap size={24} />
            <h3>Smart Recommendations</h3>
            <p>We analyze your search history, saved services, and preferences to recommend the best services for you.</p>
          </div>
          <div className="rec-info-card">
            <Heart size={24} />
            <h3>Save Your Favorites</h3>
            <p>Heart a service to add it to your favorites. Your saved services help us improve recommendations.</p>
          </div>
          <div className="rec-info-card">
            <TrendingUp size={24} />
            <h3>Trending Services</h3>
            <p>Discover what's hot right now. Trending services are based on views, ratings, and orders.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsPage;
