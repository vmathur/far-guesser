"use client";

import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import sdk from '@farcaster/frame-sdk';
import { Guess, Location } from './types/LocationGuesserTypes';
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { useConnect, useSendTransaction, useAccount } from "wagmi";
import { useGameAnalytics } from '../lib/analytics';
import { encodeFunctionData } from 'viem';
import { abi } from '../contracts/abi';

interface ActionButtonsProps {
  guess: Guess;
  actualLocation: Location;
  distance: number;
}

const contractAddress = '0xf01309b71076e7b9b184ac0416ae5795ac0ad3af';
//const contractAddress = '0x247757adefbf623b7762102da57ec881de308eea';

const ActionButtons: React.FC<ActionButtonsProps> = ({ guess, actualLocation, distance }) => {
  const analytics = useGameAnalytics();
  const { sendTransaction } = useSendTransaction();
  const { connectAsync, isPending: isConnecting } = useConnect();
  const { isConnected } = useAccount();
  // Add states for tracking minting status
  const [isMinting, setIsMinting] = useState(false);
  const [isMinted, setIsMinted] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  // Handle sharing the result
  const handleShare = () => {
    analytics.shareClicked();
    
    const message = `I was ${distance.toLocaleString()} km away from today's mystery location 📍. Can you beat me?\n\n`;
    // URL encode the message, ensuring newlines are properly encoded
    const encodedMessage = encodeURIComponent(message);
    const encodedFrameUrl = encodeURIComponent(process.env.NEXT_PUBLIC_URL || '');

    // Use the Farcaster SDK to open the Warpcast compose page
    sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodedMessage}&embeds[]=${encodedFrameUrl}`);
  };

  // Separated connection and minting into two steps
  const connectWallet = useCallback(async () => {
    if (isConnected) return true;
    
    try {
      setIsConnectingWallet(true);
      await connectAsync({
        connector: farcasterFrame()
      });
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      return false;
    } finally {
      setIsConnectingWallet(false);
    }
  }, [connectAsync, isConnected]);
  
  // Mint the NFT
  const mintNFT = useCallback(async () => {
    console.log('minting')
    if (isMinted) return;
    
    setIsMinting(true);
    try {
      const guess_x_location = guess.position.lat;
      const guess_y_location = guess.position.lng;
      const actual_x_location = actualLocation.position.lat;
      const actual_y_location = actualLocation.position.lng;
      const score = Math.round(100*Math.exp(-distance/2000));

      // Encode the mint function call with all required parameters
      const data = encodeFunctionData({
        abi,
        functionName: 'mint',
        args: [
          BigInt(Math.round(guess_x_location * 10000000)), // Convert to int256, scaled by 10^7
          BigInt(Math.round(guess_y_location * 10000000)), // Convert to int256, scaled by 10^7
          BigInt(Math.round(actual_x_location * 10000000)), // Convert to int256, scaled by 10^7
          BigInt(Math.round(actual_y_location * 10000000)), // Convert to int256, scaled by 10^7
          BigInt(score), // uint256 score
          BigInt(Math.round(distance)) // uint256 distance in km
        ]
      });

      sendTransaction(
        {
          to: contractAddress,
          data: data,
          value: BigInt("10000000000000") // Mint fee
        },
        {
          onSuccess: (hash) => {
            console.log('minted '+hash);
            setIsMinting(false);
            setIsMinted(true);
          },
          onError: (error) => {
            console.error('Mint error:', error);
            setIsMinting(false);
          },
        }
      );
    } catch (error) {
      console.error('Mint error:', error);
      setIsMinting(false);
    }
  }, [guess, actualLocation, distance, sendTransaction, isMinted]);

  // Combined handler for UI
  const handleMint = useCallback(async () => {
    if (isMinted || isMinting || isConnectingWallet) return;
    console.log('trying to connect')
    // First connect wallet if needed
    if (!isConnected) {
      const connected = await connectWallet();
      console.log('connected: '+connected)
      if (!connected) return; // Stop if connection failed
    }
    console.log('wassap')
    // Then mint NFT
    await mintNFT();
  }, [isConnected, connectWallet, mintNFT, isMinted, isMinting, isConnectingWallet]);

  // Determine button text and state
  const isProcessing = isConnectingWallet || isConnecting || isMinting;
  let buttonText = "Mint";
  if (isConnectingWallet || isConnecting) buttonText = "Connecting...";
  else if (isMinting) buttonText = "Minting...";
  else if (isMinted) buttonText = "Minted ✅";

  return (
    <div style={{ marginBottom: '20px' }}>
      <div>
        <motion.button
          onClick={handleMint}
          disabled={isProcessing || isMinted} // Disable during any processing state
          className={`font-bold py-3 px-8 rounded-lg text-lg mr-10 select-none touch-none ${
            isProcessing ? 'bg-gray-400 text-gray-600' : 
            isMinted ? 'bg-gray-400 text-black' : 'bg-gray-200 text-black'
          }`}
          initial={{ 
            boxShadow: (isProcessing || isMinted) ? "none" : "0px 5px 0px rgba(0, 0, 0, 0.5), 0px 5px 10px rgba(0, 0, 0, 0.5)",
            y: (isProcessing || isMinted) ? 5 : 0
          }}
          animate={{
            boxShadow: (isProcessing || isMinted) ? "none" : "0px 5px 0px rgba(0, 0, 0, 0.5), 0px 5px 10px rgba(0, 0, 0, 0.5)",
            y: (isProcessing || isMinted) ? 5 : 0
          }}
          whileTap={(isProcessing || isMinted) ? {} : { 
            y: 5,
            boxShadow: "0px 0px 0px rgba(0, 0, 0, 0.5), 0px 0px 0px rgba(0, 0, 0, 0.5)",
            transition: { duration: 0.1 }
          }}
        >
          {buttonText}
        </motion.button>
        <motion.button
          onClick={handleShare}
          className="bg-gray-200 text-black font-bold py-3 px-8 rounded-lg text-lg select-none touch-none"
          initial={{ 
            boxShadow: "0px 5px 0px rgba(0, 0, 0, 0.5), 0px 5px 10px rgba(0, 0, 0, 0.5)" 
          }}
          whileTap={{ 
            y: 5,
            boxShadow: "0px 0px 0px rgba(0, 0, 0, 0.5), 0px 0px 0px rgba(0, 0, 0, 0.5)",
            transition: { duration: 0.1 }
          }}
        >
          Share
        </motion.button>
      </div>
    </div>
  );
};

export default ActionButtons; 