import type { Metadata } from "next";
import { Patrick_Hand } from 'next/font/google';
import "~/app/globals.css";
import { Providers } from "~/app/providers";
import { Analytics } from '@vercel/analytics/react';

// Initialize Patrick Hand font
const patrickHand = Patrick_Hand({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "FarGuessser",
  description: "Guess the location from the map",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={patrickHand.className}>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
