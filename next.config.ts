import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      /** Run after `public/` so real files (e.g. driver `.html`) are served; API fills missing `.svg`. */
      afterFiles: [
        {
          source: "/assets/:path*",
          destination: "/api/recovered-static/assets/:path*",
        },
        {
          source: "/private-investor/:path*",
          destination: "/api/recovered-static/private-investor/:path*",
        },
        {
          source: "/private-investor-plan/:path*",
          destination: "/api/recovered-static/private-investor-plan/:path*",
        },
        {
          source: "/customer-portal/:path*",
          destination: "/api/recovered-static/customer-portal/:path*",
        },
        {
          source: "/business-operations/:path*",
          destination: "/api/recovered-static/business-operations/:path*",
        },
        {
          source: "/operational-intelligence/:path*",
          destination: "/api/recovered-static/operational-intelligence/:path*",
        },
        {
          source: "/capacity-intelligence/:path*",
          destination: "/api/recovered-static/capacity-intelligence/:path*",
        },
        {
          source: "/generated/:path*",
          destination: "/api/bof-generated/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
