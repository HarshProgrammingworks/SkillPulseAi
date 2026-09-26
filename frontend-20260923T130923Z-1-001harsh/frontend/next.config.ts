import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/SkillPulseAi",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
