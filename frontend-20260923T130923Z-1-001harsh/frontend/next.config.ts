import type { NextConfig } from "next";

const isVercel = process.env.VERCEL === "1" || !!process.env.NEXT_PUBLIC_VERCEL_ENV;
// On Vercel, serve directly at domain root ("/"). On GitHub Pages, serve under "/SkillPulseAi".
const basePath = isVercel
  ? ""
  : (process.env.NEXT_PUBLIC_BASE_PATH ?? "/SkillPulseAi");

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
