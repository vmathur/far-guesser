"use client";

import dynamic from "next/dynamic";
import { Location } from "../components/types/LocationGuesserTypes";

interface AppProps {
  dailyLocation: Location;
}

const Game = dynamic(() => import("~/components/Game"), {
  ssr: false,
});

export default function App({ dailyLocation }: AppProps) {
  return <Game dailyLocation={dailyLocation} />;
}
