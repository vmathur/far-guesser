"use client";

import dynamic from "next/dynamic";
import type { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"
import { AnalyticsProvider } from "~/lib/AnalyticsContext";
import { useEffect } from 'react';

const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export function Providers({ session, children }: { session: Session | null, children: React.ReactNode }) {
  return (
    <SessionProvider session={session}>
      <WagmiProvider>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
