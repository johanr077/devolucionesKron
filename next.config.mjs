/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["googleapis", "nodemailer"],
  },
};
export default nextConfig;
