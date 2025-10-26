import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        unoptimized: false, // Enable optimization but allow unoptimized when needed
        formats: ["image/webp", "image/avif"], // Modern formats
    },
    async rewrites() {
        // Proxy BE to avoid CORS in local dev
        const backend = process.env.BACKEND_ORIGIN || "http://127.0.0.1:8000";
        const forum = process.env.FORUM_ORIGIN || "http://127.0.0.1:9000";
        return [
            {
                source: "/api/:path*",
                destination: `${backend}/api/:path*`,
            },
            {
                source: "/forum-api/:path*",
                destination: `${forum}/:path*`,
            },
        ];
    },
};

export default nextConfig;
