import { useAnalytics } from './AnalyticsContext';

// Store the user's FID and username
let userFid: string | null = null;
let userName: string | null = null;

// Set the user's FID once
export const setUserFid = (fid: string | number | undefined | null) => {
  if (fid) {
    userFid = fid.toString();
  }
};

// Set the user's username
export const setUserName = (username: string | null | undefined) => {
  if (username) {
    userName = username;
  }
};

// Get the current user's FID
export const getUserFid = () => userFid;

// Get the current user's username
export const getUserName = () => userName;

export const useGameAnalytics = () => {
  const { trackEvent } = useAnalytics();

  return {
    // Page view event
    pageView: (props?: Record<string, any>) => {
      trackEvent('page_view', props);
    },

    // Game started event
    gameStarted: (props?: Record<string, any>) => {
      trackEvent('game_started', props);
    },

    // Viewing completed event
    viewingCompleted: (props?: Record<string, any>) => {
      trackEvent('viewing_completed', props);
    },

    // Guess submitted event
    guessSubmitted: (props?: Record<string, any>) => {
      trackEvent('guess_submitted', props);
    },

    // Results viewed event
    resultsViewed: (props: { distance: number } & Record<string, any>) => {
      trackEvent('results_viewed', props);
    },

    // Share clicked event
    shareClicked: (props?: Record<string, any>) => {
      trackEvent('share_clicked', props);
    },

    // Leaderboard viewed event
    leaderboardViewed: (props?: Record<string, any>) => {
      trackEvent('leaderboard_viewed', props);
    },

    // NFT minted event with score
    mintedScore: (props: { score: number, distance: number, txHash: string } & Record<string, any>) => {
      trackEvent('nft_minted', props);
    },
  };
}; 