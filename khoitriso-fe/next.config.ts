import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        unoptimized: true, // Disable optimization to fix image loading issues
        formats: ["image/webp", "image/avif"],
        qualities: [50, 75, 90, 100],
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
            },
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
};

export default nextConfig;
