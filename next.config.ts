import type { NextConfig } from "next";

// Sanitiza NEXTAUTH_URL caso venha envolvida por aspas literais do ambiente de hospedagem
const cleanNextAuthUrl = process.env.NEXTAUTH_URL?.replace(/^["']|["']$/g, "").trim();
if (cleanNextAuthUrl) {
  process.env.NEXTAUTH_URL = cleanNextAuthUrl;
  process.env.AUTH_URL = cleanNextAuthUrl;
}

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXTAUTH_URL: cleanNextAuthUrl || "",
    AUTH_URL: cleanNextAuthUrl || "",
  },
};

export default nextConfig;
