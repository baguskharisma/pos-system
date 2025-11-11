import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Vercel Blob Storage
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
      // Midtrans payment gateway
      {
        protocol: "https",
        hostname: "app.midtrans.com",
      },
      // Allow other HTTPS images (for backward compatibility)
      // Remove this if you want to restrict to only Vercel Blob
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
