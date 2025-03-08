// Game configuration settings
export const gameConfig = {
  /**
   * Duration of each game round in minutes
   * Examples: 
   * - 5 = 5 minutes
   * - 60 = 1 hour
   * - 1440 = 24 hours (1 day)
   * 
   * Users can only play once per round.
   */
  ROUND_DURATION_MINUTES: 60,
  
  /**
   * Time in milliseconds that a player can view the street view
   * before they need to make a guess
   * Examples:
   * - 10000 = 10 seconds
   * - 30000 = 30 seconds
   * - 60000 = 1 minute
   */
  VIEWING_TIME_MS: 15000,
  
  // Add other game configuration parameters here as needed
};

// Convenience conversions
export const ROUND_DURATION_MS = gameConfig.ROUND_DURATION_MINUTES * 60 * 1000; 