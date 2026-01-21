/** @type {import('next').NextConfig} */
const nextConfig = {
    // Turbopack configuration (Next.js 16+)
    turbopack: {
        // Empty config to acknowledge Turbopack usage
    },
    // Webpack configuration (fallback for --webpack flag)
    webpack: (config) => {
        // Handle PDF parsing on server side
        config.resolve.alias.canvas = false;
        return config;
    },
};

export default nextConfig;
