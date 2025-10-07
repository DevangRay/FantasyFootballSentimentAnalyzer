import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      // new URL('https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/**')]
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        pathname: '/combiner/i',
        // The query parameter is handled by the image loader, not the remotePatterns
      }
    ]
  },
};

export default nextConfig;
