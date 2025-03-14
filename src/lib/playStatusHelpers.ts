/**
 * Helper functions for checking player status
 */
import { Guess } from '../components/types/LocationGuesserTypes';
import { getUserName } from './analytics';

/**
 * Checks if the user has played the current round and retrieves their guess if they have
 * @param sdkContext - The Farcaster SDK context containing user information
 * @returns An object with hasPlayed status and the user's guess if available
 */
export async function checkUserPlayStatus(sdkContext: any): Promise<{
  hasPlayed: boolean;
  userGuess: any | null;
  error: string | null;
  timeUntilNextRound?: number;
}> {
  try {
    // Get FID from SDK context
    const userFid = sdkContext?.user?.fid;
    
    if (!userFid) {
      console.log('No FID available from SDK context');
      return { 
        hasPlayed: false, 
        userGuess: null,
        error: null 
      };
    }

    console.log(`Checking if user ${userFid} has played using SDK context`);
    
    // Add the FID to the headers for the API call
    const headers = new Headers();
    headers.append('X-Farcaster-User-FID', userFid.toString());
    
    // Check if the user has already played this round
    const response = await fetch('/api/check-play-status', {
      headers
    });
    const data = await response.json();
    
    // Extract timeUntilNextRound from API response
    const timeUntilNextRound = data.timeUntilNextRound;
    
    if (!data.hasPlayed) {
      console.log(`User ${userFid} has not played today`);
      return { 
        hasPlayed: false, 
        userGuess: null,
        error: null,
        timeUntilNextRound
      };
    }
    
    console.log(`User ${userFid} has already played today, fetching previous guess`);
    
    // User has already played today, fetch their previous guess
    const userGuessResponse = await fetch('/api/user-guess', {
      headers
    });
    const guessData = await userGuessResponse.json();
    
    if (guessData.guess) {
      console.log('Found previous guess');
      return { 
        hasPlayed: true, 
        userGuess: guessData.guess,
        error: null,
        timeUntilNextRound
      };
    } else {
      console.log('No previous guess found despite hasPlayed=true');
      return { 
        hasPlayed: true, 
        userGuess: null,
        error: 'Could not retrieve previous guess',
        timeUntilNextRound
      };
    }
  } catch (error) {
    console.error('Error checking play status:', error);
    return { 
      hasPlayed: false, 
      userGuess: null,
      error: error instanceof Error ? error.message : 'Unknown error checking play status'
    };
  }
}

/**
 * Submits a guess to the leaderboard and records the user's play
 * @param sdkContext - The Farcaster SDK context
 * @param guess - The user's guess with distance
 * @returns An object with success status and error message if any
 */
export async function submitUserGuess(
  sdkContext: any, 
  guess: Guess
): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    // Get FID from SDK context
    const userFid = sdkContext?.user?.fid;
    const username = getUserName() || sdkContext?.user?.username || sdkContext?.user?.displayName;
    const pfpUrl = sdkContext?.user?.pfpUrl;
    
    console.log('Submitting score to leaderboard with FID from SDK:', userFid, 'and username:', username);
    
    // Create a valid name that doesn't exceed characters limit
    let userName = "Anonymous";
    
    // Use Farcaster username if available, fall back to FID-based name
    if (username) {
      // Use the actual Farcaster username
      userName = username;
      // Truncate if necessary
      if (userName.length > 30) {
        userName = userName.slice(0, 30);
      }
    } else if (userFid) {
      // Fall back to FID-based name if no username is available
      userName = `User ${userFid.toString().slice(0, 15)}`;
      // Further truncate if still too long
      if (userName.length > 30) {
        userName = userName.slice(0, 30);
      }
    }
    
    // Prepare data for the leaderboard submission
    const leaderboardData = {
      name: userName,
      distance: guess.distance,
      fid: userFid ? userFid.toString() : undefined, // Ensure fid is undefined if null or empty
      position: guess.position, // Include the position of the guess
      pfpUrl: pfpUrl // Include the user's profile picture URL
    };
    
    // Create headers for API calls
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    if (userFid) {
      headers.append('X-Farcaster-User-FID', userFid.toString());
    }
    
    // Submit to leaderboard
    const leaderboardResponse = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(leaderboardData),
    });
    
    const data = await leaderboardResponse.json();
    
    if (!data.success) {
      console.error('Failed to submit score to leaderboard:', data.error);
      
      // Check if this is a duplicate submission error
      if (leaderboardResponse.status === 403) {
        return {
          success: false, 
          error: data.error || "You've already played today. Your score was not saved."
        };
      }
      
      return {
        success: false,
        error: data.error || "Failed to submit score to leaderboard"
      };
    }
    
    // Store the user's guess data along with their play record
    // This is separate from leaderboard submission and should happen even if the leaderboard submission fails
    // except in the case of a duplicate submission
    if (userFid && leaderboardResponse.status !== 403) {
      try {
        await fetch('/api/record-play', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            fid: userFid.toString(),
            guessData: guess
          }),
        });
      } catch (recordError) {
        console.error('Error recording play details:', recordError);
        // Don't block the user flow if this fails
      }
    }
    
    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error('Error submitting guess:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred while submitting your score."
    };
  }
} 