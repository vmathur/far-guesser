"use client";

import dynamic from "next/dynamic";
import { AnalyticsProvider } from "~/lib/AnalyticsContext";

const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider>
      <AnalyticsProvider>
        {children}
      </AnalyticsProvider>
    </WagmiProvider>
  );
}
