import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/db"],

  experimental: {
    // The logo upload posts the file through a Server Action, and the default
    // request cap is 1MB — below the 2MB the settings form accepts. Raised
    // just past it so a file at the limit is not rejected by multipart
    // overhead before uploadLogo() can report a size error itself.
    serverActions: { bodySizeLimit: "3mb" },
  },

  async headers() {
    return [
      {
        // The worker script itself must never be served from a cache, or a
        // released fix cannot reach a device that already installed the app.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ]
  },
}

export default nextConfig
