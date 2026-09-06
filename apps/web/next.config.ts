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
}

export default nextConfig
