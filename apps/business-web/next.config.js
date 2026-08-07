/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@chirudeli/api-client', '@chirudeli/design-tokens', '@chirudeli/shared-types'],
  reactStrictMode: true,
};

module.exports = nextConfig;
