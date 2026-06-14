import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const outputDir = "dist";
const defaultSiteUrl = "https://submitready.pages.dev";
const siteUrl = normalizeSiteUrl(process.env.SITE_URL || process.env.CF_PAGES_URL || defaultSiteUrl);
const staticEntries = [
  "assets",
  "js",
  "about.html",
  "app.js",
  "contact.html",
  "features.html",
  "index.html",
  "privacy.html",
  "robots.txt",
  "styles.css",
];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await Promise.all(
  staticEntries.map((entry) =>
    cp(entry, `${outputDir}/${entry}`, {
      recursive: true,
    }),
  ),
);

const pages = [
  {
    file: "index.html",
    path: "/",
    title: "SubmitReady - Free Local Image, PDF, and File Submission Tools",
    description:
      "SubmitReady helps you resize images, convert JPG and PNG files to PDF, crop photos, mask private details, merge PDFs, and rename files locally in your browser.",
    priority: "1.0",
  },
  {
    file: "about.html",
    path: "/about.html",
    title: "About SubmitReady - Local Submission File Tools",
    description:
      "Learn about SubmitReady, a static browser-based service for preparing upload-ready images, PDFs, screenshots, and renamed file sets.",
    priority: "0.7",
  },
  {
    file: "features.html",
    path: "/features.html",
    title: "SubmitReady Features - Image, PDF, Privacy, Crop, and Rename Tools",
    description:
      "Review SubmitReady features including image optimization, image to PDF conversion, PDF merge and split, photo crop, privacy masking, and batch rename tools.",
    priority: "0.8",
  },
  {
    file: "privacy.html",
    path: "/privacy.html",
    title: "Privacy Policy - SubmitReady",
    description:
      "Read the SubmitReady privacy policy for local file processing, browser storage, third-party resources, advertising cookies, and contact requests.",
    priority: "0.5",
  },
  {
    file: "contact.html",
    path: "/contact.html",
    title: "Contact SubmitReady",
    description:
      "Contact SubmitReady for privacy questions, correction requests, advertising compliance inquiries, and site feedback.",
    priority: "0.5",
  },
];

await Promise.all(pages.map((page) => enhanceHtml(page)));
await writeFile(`${outputDir}/sitemap.xml`, buildSitemap(pages));
await writeFile(
  `${outputDir}/robots.txt`,
  `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`,
);

function normalizeSiteUrl(value) {
  return String(value || defaultSiteUrl).replace(/\/+$/, "");
}

function pageUrl(path) {
  return `${siteUrl}${path}`;
}

async function enhanceHtml(page) {
  const filePath = `${outputDir}/${page.file}`;
  let html = await readFile(filePath, "utf8");
  const canonicalUrl = pageUrl(page.path);
  const imageUrl = pageUrl("/assets/submitready-icon.png");
  const seoTags = [
    `<link rel="canonical" href="${canonicalUrl}" />`,
    `<meta property="og:url" content="${canonicalUrl}" />`,
    `<meta property="og:image" content="${imageUrl}" />`,
    `<meta name="twitter:image" content="${imageUrl}" />`,
  ].join("\n    ");

  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(page.title)}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/s,
    `<meta\n      name="description"\n      content="${escapeHtml(page.description)}"\n    />`,
  );
  html = html.replace(/\s*<meta property="og:image" content="[^"]*" \/>\n?/g, "\n");
  html = html.replace(/\s*<meta name="twitter:image" content="[^"]*" \/>\n?/g, "\n");
  html = html.replace("</head>", `    ${seoTags}\n  </head>`);

  if (page.file === "index.html") {
    html = html.replace('"privacyPolicy": "privacy.html"', `"privacyPolicy": "${pageUrl("/privacy.html")}"`);
    html = html.replace(
      '"description": "SubmitReady is a privacy-first browser tool for preparing images, PDFs, screenshots, and renamed file sets for online submission portals."',
      `"description": "${escapeJson(page.description)}"`,
    );
    html = html.replace(
      '"contactType": "site support"',
      `"contactType": "site support",\n          "url": "${pageUrl("/contact.html")}"`,
    );
  }

  await writeFile(filePath, html);
}

function buildSitemap(pageList) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = pageList
    .map(
      (page) => `  <url>
    <loc>${pageUrl(page.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function escapeJson(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
