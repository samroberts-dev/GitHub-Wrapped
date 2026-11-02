import type { NextConfig } from "next";

const config: NextConfig = {
  distDir: process.env.PLAYWRIGHT_TEST === "1" ? ".next-test" : ".next",
};
export default config;
