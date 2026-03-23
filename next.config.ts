import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
    ],
    // Use our proxy route for Google Places photos
    domains: [],
  },
};

export default nextConfig;
