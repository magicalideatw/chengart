import type { NextConfig } from "next";

function getSupabaseImagePattern() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  try {
    const hostname = new URL(url).hostname;
    return {
      protocol: "https" as const,
      hostname,
    };
  } catch {
    return null;
  }
}

const supabaseImagePattern = getSupabaseImagePattern();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
  images: {
    remotePatterns: supabaseImagePattern ? [supabaseImagePattern] : [],
  },
};

export default nextConfig;
