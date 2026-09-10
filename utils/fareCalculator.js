/**
 * Centralized Fare Calculator Utility
 */

const RIDE_PRICING = {
  Economy: {
    baseFare: 200,
    perKmRate: 50,
    description: 'Affordable, everyday rides for solo or small groups',
    icon: 'fa-car',
    seats: 4
  },
  Comfort: {
    baseFare: 300,
    perKmRate: 70,
    description: 'Newer sedans with extra legroom & top-rated drivers',
    icon: 'fa-car-side',
    seats: 4
  },
  Premium: {
    baseFare: 500,
    perKmRate: 100,
    description: 'High-end luxury vehicles and executive service',
    icon: 'fa-user-tie',
    seats: 4
  },
  SUV: {
    baseFare: 700,
    perKmRate: 130,
    description: 'Spacious full-size SUVs for large groups & extra luggage',
    icon: 'fa-truck-monster',
    seats: 6
  }
};

/**
 * Calculates fare for a specific ride type and distance
 * Formula: Base Fare + (Distance * Per KM Rate)
 */
function calculateFare(rideType, distanceKm) {
  const pricing = RIDE_PRICING[rideType] || RIDE_PRICING.Economy;
  const dist = Math.max(0.1, parseFloat(distanceKm) || 0);
  const totalFare = pricing.baseFare + (dist * pricing.perKmRate);
  return Math.round(totalFare);
}

/**
 * Generates fare estimates for all ride types for a given distance
 */
function getAllFareEstimates(distanceKm) {
  const dist = Math.max(0.1, parseFloat(distanceKm) || 0);
  const estimates = {};

  for (const [type, config] of Object.entries(RIDE_PRICING)) {
    estimates[type] = {
      rideType: type,
      baseFare: config.baseFare,
      perKmRate: config.perKmRate,
      fare: Math.round(config.baseFare + (dist * config.perKmRate)),
      description: config.description,
      icon: config.icon,
      seats: config.seats
    };
  }

  return estimates;
}

module.exports = {
  RIDE_PRICING,
  calculateFare,
  getAllFareEstimates
};
