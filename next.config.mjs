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
    poweredByHeader: false,
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                ],
            },
        ];
    },
};

export default nextConfig;
