/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Allow builds to succeed even with ESLint warnings
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Allow builds to succeed even with TS warnings (handled in CI)
        ignoreBuildErrors: false,
    },
};

export default nextConfig;
