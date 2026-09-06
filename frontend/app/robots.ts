import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://polisync-app.onrender.com").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/super-admin/",
          "/settings/",
          "/profile",
          "/results",
          "/submit-result",
          "/electionos/",
          "/war-room/",
          "/command-center",
          "/party/",
          "/observer/",
          "/personal/",
          "/presidential-candidate/",
          "/parliamentary-candidate/",
          "/login",
          "/register",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
