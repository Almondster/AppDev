/**
 * Smart Recommendations Engine
 * Tracks user behavior and generates personalized recommendations
 */

const STORAGE_KEYS = {
  SEARCH_HISTORY: 'createch_search_history',
  VIEWED_SERVICES: 'createch_viewed_services',
  INTERACTION_HISTORY: 'createch_interaction_history',
};

// ============================================================================
// User Behavior Tracking
// ============================================================================

export const trackSearchQuery = (query, filters = {}) => {
  if (!query || query.trim().length === 0) return;

  const history = getSearchHistory();
  history.unshift({
    query: query.trim(),
    filters,
    timestamp: Date.now(),
    count: 1,
  });

  // Merge duplicate searches with count
  const merged = {};
  history.forEach((item) => {
    const key = `${item.query}|${JSON.stringify(item.filters)}`;
    if (merged[key]) {
      merged[key].count += 1;
      merged[key].timestamp = item.timestamp;
    } else {
      merged[key] = item;
    }
  });

  const deduped = Object.values(merged).slice(0, 100); // Keep last 100 searches
  localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(deduped));
};

export const trackServiceView = (serviceId, service = {}) => {
  if (!serviceId) return;

  const viewed = getViewedServices();
  const existing = viewed.find((s) => s.id === serviceId);

  if (existing) {
    existing.views += 1;
    existing.lastViewedAt = Date.now();
  } else {
    viewed.unshift({
      id: serviceId,
      ...service,
      views: 1,
      lastViewedAt: Date.now(),
    });
  }

  localStorage.setItem(STORAGE_KEYS.VIEWED_SERVICES, JSON.stringify(viewed.slice(0, 200)));
};

export const trackServiceInteraction = (serviceId, interactionType = 'view') => {
  if (!serviceId) return;

  const interactions = getInteractionHistory();
  interactions.unshift({
    serviceId,
    type: interactionType, // 'view', 'favorite', 'order', 'click'
    timestamp: Date.now(),
  });

  localStorage.setItem(
    STORAGE_KEYS.INTERACTION_HISTORY,
    JSON.stringify(interactions.slice(0, 500))
  );
};

// ============================================================================
// Data Retrieval
// ============================================================================

export const getSearchHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY) || '[]');
  } catch {
    return [];
  }
};

export const getViewedServices = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.VIEWED_SERVICES) || '[]');
  } catch {
    return [];
  }
};

export const getInteractionHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INTERACTION_HISTORY) || '[]');
  } catch {
    return [];
  }
};

// ============================================================================
// Recommendation Algorithms
// ============================================================================

/**
 * Get trending services based on global interaction data
 * (In real app, this would come from backend)
 */
export const getTrendingServices = (services = []) => {
  if (!services || services.length === 0) return [];

  // Score services based on recent interactions
  const scored = services.map((service) => {
    let score = 0;
    score += (Number(service.rating || 0)) * 10;
    score += (service.order_count || 0) * 2;
    score += (service.view_count || 0) * 0.5;

    // Boost recently created services slightly
    if (service.created_at) {
      const daysSinceCreation =
        (Date.now() - new Date(service.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 7) score += 20;
    }

    return { ...service, _trendScore: score };
  });

  return scored.sort((a, b) => b._trendScore - a._trendScore).slice(0, 12);
};

/**
 * Get personalized recommendations based on user behavior
 */
export const getPersonalizedRecommendations = (services = []) => {
  if (!services || services.length === 0) return [];

  const viewedServices = getViewedServices();
  const searchHistory = getSearchHistory();

  if (viewedServices.length === 0 && searchHistory.length === 0) {
    // If no history, return random diverse services
    return getRandomServices(services, 12);
  }

  // Extract user preferences from history
  const userCategories = new Set();
  const userPriceRanges = [];

  // From viewed services
  viewedServices.slice(0, 20).forEach((service) => {
    if (service.category) userCategories.add(service.category);
    if (service.price) userPriceRanges.push(Number(service.price));
  });

  // From search history
  searchHistory.slice(0, 10).forEach((search) => {
    if (search.filters?.category) userCategories.add(search.filters.category);
    if (search.filters?.minPrice || search.filters?.maxPrice) {
      userPriceRanges.push(search.filters?.minPrice || 0);
      userPriceRanges.push(search.filters?.maxPrice || 100000);
    }
  });

  const avgPrice =
    userPriceRanges.length > 0
      ? userPriceRanges.reduce((a, b) => a + b, 0) / userPriceRanges.length
      : undefined;

  // Score services based on user preferences
  const scored = services.map((service) => {
    let score = 0;

    // Category match
    if (userCategories.size > 0 && userCategories.has(service.category)) {
      score += 30;
    }

    // Price range match
    if (avgPrice && service.price) {
      const priceDiff = Math.abs(Number(service.price) - avgPrice);
      const maxDiff = avgPrice * 0.5;
      score += Math.max(0, 20 - (priceDiff / maxDiff) * 20);
    }

    // Rating boost
    score += (Number(service.rating || 0)) * 5;

    // Don't recommend recently viewed services
    const isRecent = viewedServices.some((v) => v.id === service.id);
    if (isRecent) score -= 50;

    return { ...service, _recScore: score };
  });

  return scored
    .filter((s) => s._recScore > 0)
    .sort((a, b) => b._recScore - a._recScore)
    .slice(0, 12);
};

/**
 * Get similar services based on a given service
 */
export const getSimilarServices = (service, services = [], limit = 8) => {
  if (!service || !services || services.length === 0) return [];

  const similar = services
    .filter((s) => s.id !== service.id)
    .map((s) => {
      let similarity = 0;

      // Category match (most important)
      if (s.category === service.category) similarity += 40;

      // Creator match
      if (s.creator_id === service.creator_id) similarity += 30;

      // Price similarity
      if (s.price && service.price) {
        const priceDiff = Math.abs(Number(s.price) - Number(service.price));
        const maxPrice = Math.max(Number(s.price), Number(service.price));
        similarity += Math.max(0, 20 - (priceDiff / maxPrice) * 20);
      }

      // Rating proximity
      if (s.rating && service.rating) {
        const ratingDiff = Math.abs(s.rating - service.rating);
        similarity += Math.max(0, 10 - ratingDiff * 2);
      }

      return { ...s, _similarity: similarity };
    })
    .sort((a, b) => b._similarity - a._similarity)
    .slice(0, limit);

  return similar;
};

/**
 * Get "Customers also bought" recommendations
 * In a real app, this would use purchase correlation from backend
 */
export const getCustomersAlsoBought = (serviceId, services = []) => {
  if (!serviceId || !services || services.length === 0) return [];

  const currentService = services.find((s) => s.id === serviceId);

  if (!currentService) return [];

  // Find services frequently viewed together with this one
  // or from same category
  const related = services
    .filter((s) => s.id !== serviceId)
    .map((s) => {
      let score = 0;

      // Same category
      if (s.category === currentService.category) score += 25;

      // Similar price point (within 30%)
      const priceDiff = Math.abs(Number(s.price) - Number(currentService.price));
      if (priceDiff < Number(currentService.price) * 0.3) score += 15;

      // Different creator (add variety)
      if (s.creator_id !== currentService.creator_id) score += 10;

      // High rating
      score += (Number(s.rating || 0)) * 5;

      return { ...s, _buyScore: score };
    })
    .sort((a, b) => b._buyScore - a._buyScore)
    .slice(0, 8);

  return related;
};

/**
 * Get random sample of services
 */
const getRandomServices = (services = [], limit = 12) => {
  const shuffled = [...services].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
};

/**
 * Clear all tracking data (for testing)
 */
export const clearAllRecommendationData = () => {
  localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  localStorage.removeItem(STORAGE_KEYS.VIEWED_SERVICES);
  localStorage.removeItem(STORAGE_KEYS.INTERACTION_HISTORY);
};

/**
 * Get recommendation stats (for debugging)
 */
export const getRecommendationStats = () => {
  return {
    searchHistoryCount: getSearchHistory().length,
    viewedServicesCount: getViewedServices().length,
    interactionCount: getInteractionHistory().length,
  };
};
