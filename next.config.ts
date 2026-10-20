import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/dashboard/sales-executive',
        destination: '/dashboard/field-agent?tab=field-agent',
        permanent: false,
      },
      {
        source: '/dashboard/company-list',
        destination: '/dashboard/field-agent?tab=field-agent',
        permanent: false,
      },
      {
        source: '/dashboard/company-list/:path*',
        destination: '/dashboard/field-agent?tab=field-agent',
        permanent: false,
      },
      {
        source: '/dashboard/meeting-schedule',
        destination: '/dashboard/field-agent?tab=field-agent',
        permanent: false,
      },
      {
        source: '/dashboard/record-conversation',
        destination: '/dashboard/field-agent?tab=field-agent',
        permanent: false,
      },
      {
        source: '/dashboard/task-of-field-agent',
        destination: '/dashboard/field-agent?tab=field-agent',
        permanent: false,
      },
      {
        source: '/dashboard/manage-field-agent',
        destination: '/dashboard/field-agent?tab=field-agent',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
