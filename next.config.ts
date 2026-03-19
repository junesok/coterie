import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // 홈 디렉토리에 다른 package-lock.json이 있어 발생하는 workspace root 오감지 방지
    root: path.resolve(__dirname),
  },
  // cloudinary는 Node.js 네이티브 HTTP를 사용하므로 Turbopack 번들링에서 제외
  serverExternalPackages: ["cloudinary"],
};

export default nextConfig;
