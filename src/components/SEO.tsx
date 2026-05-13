import { Helmet } from "react-helmet-async";

const SITE_URL = "https://xscentrium.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article" | "product" | "profile";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noIndex?: boolean;
}

/**
 * Per-route SEO. Sets unique <title>, description, canonical, og:*, twitter:*,
 * and optional JSON-LD structured data. Overrides the static head in index.html.
 */
export const SEO = ({
  title,
  description,
  path = "",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  jsonLd,
  noIndex = false,
}: SEOProps) => {
  const url = `${SITE_URL}${path || ""}`;
  const truncatedDesc = description.length > 160 ? description.slice(0, 157) + "..." : description;
  const truncatedTitle = title.length > 60 ? title.slice(0, 57) + "..." : title;
  const absImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;
  const ldArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <title>{truncatedTitle}</title>
      <meta name="description" content={truncatedDesc} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      <meta property="og:title" content={truncatedTitle} />
      <meta property="og:description" content={truncatedDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={absImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={truncatedTitle} />
      <meta name="twitter:description" content={truncatedDesc} />
      <meta name="twitter:image" content={absImage} />

      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
};
