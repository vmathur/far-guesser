"use client";

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import sdk from '@farcaster/frame-sdk';
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { useConnect, useSendTransaction } from "wagmi";
import { useGameAnalytics } from '../lib/analytics';

interface ActionButtonsProps {
  distance: number;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ distance }) => {
  const analytics = useGameAnalytics();
  const { sendTransaction } = useSendTransaction();
  const { connect } = useConnect();

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

  // Handle minting NFT
  const handleMint = useCallback(() => {
    connect({connector: farcasterFrame()})
    sendTransaction(
      {
        // call mint() on Yoink contract
        to: "0x247757adefbf623b7762102da57ec881de308eea",
        data: '0x1249c58b', // Function selector for mint()
        value: BigInt("10000000000000")
      },
      {
        onSuccess: (hash) => {
          console.log('minted '+hash)
        },
      }
    );
  }, [sendTransaction, connect]);

  return (
    <div style={{ marginBottom: '20px' }}>
      <div>
        <motion.button
          onClick={handleMint}
          className="bg-gray-200 text-black font-bold py-3 px-8 rounded-lg text-lg mr-10 select-none touch-none"
          initial={{ 
            boxShadow: "0px 5px 0px rgba(0, 0, 0, 0.5), 0px 5px 10px rgba(0, 0, 0, 0.5)" 
          }}
          whileTap={{ 
            y: 5,
            boxShadow: "0px 0px 0px rgba(0, 0, 0, 0.5), 0px 0px 0px rgba(0, 0, 0, 0.5)",
            transition: { duration: 0.1 }
          }}
        >
          Mint
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