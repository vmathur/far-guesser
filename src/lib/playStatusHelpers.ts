/**
 * Helper functions for checking player status
 */
import { Guess } from '../components/types/LocationGuesserTypes';
import { getUserName } from './analytics';

/**
 * Checks if the user has played the current round and retrieves their guess if they have
 * @param fid - The Farcaster user ID
 * @returns An object with hasPlayed status and the user's guess if available
 */
export async function checkUserPlayStatus(fid: number | null): Promise<{
  hasPlayed: boolean;
  userGuess: any | null;
  error: string | null;
  timeUntilNextRound?: number;
}> {
  try {
    if (!fid) {
      console.log('No FID provided');
      return { 
        hasPlayed: false, 
        userGuess: null,
        error: null 
      };
    }

    console.log(`Checking if user ${fid} has played`);
    
    // Add the FID to the headers for the API call
    const headers = new Headers();
    headers.append('X-Farcaster-User-FID', fid.toString());
    
    // Check if the user has already played this round
    const response = await fetch('/api/check-play-status', {
      headers
    });
    const data = await response.json();
    console.log('data', data);
    
    // Extract timeUntilNextRound and userGuess from API response
    const { timeUntilNextRound, userGuess } = data;
    
    if (!data.hasPlayed) {
      console.log(`User ${fid} has not played today`);
      return { 
        hasPlayed: false, 
        userGuess: null,
        error: null,
        timeUntilNextRound
      };
    }
    
    console.log(`User ${fid} has already played today, guess data received:`, userGuess);
    
    return { 
      hasPlayed: true, 
      userGuess,
      error: null,
      timeUntilNextRound
    };
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
 * @param fid - The Farcaster user ID
 * @param username - The Farcaster username
 * @param pfpUrl - The Farcaster profile picture URL
 * @param guess - The user's guess with distance
 * @returns An object with success status and error message if any
 */
export async function submitUserGuess(
  fid: number | null,
  username: string | null,
  pfpUrl: string | null,
  guess: Guess
): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log('Submitting score to leaderboard with FID:', fid, 'and username:', username);
    
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
    } else if (fid) {
      // Fall back to FID-based name if no username is available
      userName = `User ${fid.toString().slice(0, 15)}`;
      // Further truncate if still too long
      if (userName.length > 30) {
        userName = userName.slice(0, 30);
      }
    }
    
    // Prepare data for the leaderboard submission
    const leaderboardData = {
      name: userName,
      distance: guess.distance,
      fid: fid ? fid.toString() : undefined, // Ensure fid is undefined if null or empty
      position: guess.position, // Include the position of the guess
      pfpUrl: pfpUrl // Include the user's profile picture URL
    };
    
    // Create headers for API calls
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    if (fid) {
      headers.append('X-Farcaster-User-FID', fid.toString());
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
    if (fid && leaderboardResponse.status !== 403) {
      try {
        await fetch('/api/record-play', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            fid: fid.toString(),
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