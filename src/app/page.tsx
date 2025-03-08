import { Metadata } from "next";
import App from "./app";
import { getDailyLocation } from "../lib/dailyLocation";
import { locations } from "../data/gameLocations";

const appUrl = process.env.NEXT_PUBLIC_URL;

const frame = {
  version: "next",
  // imageUrl: `${appUrl}/opengraph-image`,
  imageUrl: `${appUrl}/thumbnail.png`,
  button: {
    title: "Play",
    action: {
      type: "launch_frame",
      name: "FarGuesser",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

// Set revalidation time to 1 day (in seconds)
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "FarGuesser",
    openGraph: {
      title: "FarGuesser",
      description: "Guess the daily location",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default async function Home() {
  // Get today's location
  let dailyLocation;
  try {
    dailyLocation = await getDailyLocation();
  } catch (error) {
    console.error("Error fetching daily location:", error);
    // Fallback to the first location in the list if there's an error
    dailyLocation = locations[0];
  }

  return (<App dailyLocation={dailyLocation} />);
}
