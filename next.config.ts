import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "eu-images.contentstack.com",
      },
      {
        protocol: "https",
        hostname: "images.contentstack.io",
      },
      {
        protocol: "https",
        hostname: "**.contentstack.com",
      },
    ],
  },
};

export default nextConfig;
