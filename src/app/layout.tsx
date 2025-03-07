import type { Metadata } from "next";
import { Patrick_Hand } from 'next/font/google';
import { getSession } from "~/auth"
import "~/app/globals.css";
import { Providers } from "~/app/providers";

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession()
  
  return (
    <html lang="en" className={patrickHand.className}>
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
