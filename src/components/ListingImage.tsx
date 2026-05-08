import { AlertTriangle, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getImageVerification } from "@/lib/imageVerification";
import { cn } from "@/lib/utils";

export type DBVerification = {
  status: "pending" | "verified" | "rejected" | "needs_reupload";
  reason?: string | null;
  source?: string | null;
} | null | undefined;

interface ListingImageProps {
  url?: string | null;
  alt: string;
  className?: string;
  /** Optional DB-stored verification row. Takes precedence over URL heuristic. */
  verification?: DBVerification;
}

/**
 * Renders a listing photo only if it's been admin-verified OR comes from the
 * uploads bucket. Anything else shows a clear placeholder. Uses the DB
 * verification row when available, falling back to URL heuristics.
 */
export const ListingImage = ({ url, alt, className, verification }: ListingImageProps) => {
  const trusted = isTrusted(url, verification);

  if (trusted && url) {
    return (
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className={cn("w-full h-full object-cover", className)}
      />
    );
  }

  const status = effectiveStatus(url, verification);
  const isMissing = status === "missing";
  return (
    <div
      className={cn(
        "w-full h-full flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground p-4 text-center",
        className,
      )}
      role="img"
      aria-label={isMissing ? `No verified photo for ${alt}` : `Unverified photo for ${alt}`}
    >
      {isMissing ? (
        <ImageOff className="w-8 h-8" />
      ) : (
        <AlertTriangle className="w-8 h-8 text-amber-500" />
      )}
      <p className="text-xs font-medium">
        {status === "missing"
          ? "Photo pending"
          : status === "rejected"
          ? "Photo rejected"
          : status === "needs_reupload"
          ? "Awaiting new photo"
          : "Photo not verified"}
      </p>
      <Badge variant="outline" className="text-[10px]">
        Awaiting verified image
      </Badge>
    </div>
  );
};

function effectiveStatus(
  url?: string | null,
  v?: DBVerification,
): "verified" | "missing" | "pending" | "rejected" | "needs_reupload" {
  if (v) {
    if (v.status === "verified") return "verified";
    if (v.status === "rejected") return "rejected";
    if (v.status === "needs_reupload") return "needs_reupload";
    if (!url) return "missing";
    return "pending";
  }
  const heur = getImageVerification(url);
  if (heur.status === "verified" || heur.status === "uploaded") return "verified";
  if (heur.status === "none") return "missing";
  return "pending";
}

function isTrusted(url?: string | null, v?: DBVerification): boolean {
  if (!url) return false;
  if (v) return v.status === "verified";
  const heur = getImageVerification(url);
  return heur.status === "verified" || heur.status === "uploaded";
}

/** True when a listing has the metadata + a trustworthy image required to display. */
export const isListingDisplayable = (listing: {
  brand?: string | null;
  name?: string | null;
  size?: string | null;
  image_url?: string | null;
  image_verification?: DBVerification | DBVerification[];
}) => {
  if (!listing.brand?.trim() || !listing.name?.trim() || !listing.size?.trim()) return false;
  const v = Array.isArray(listing.image_verification)
    ? listing.image_verification[0]
    : listing.image_verification;
  return isTrusted(listing.image_url, v);
};

/** Helper to derive a short status label for badges/toolbars. */
export const verificationLabel = (
  url?: string | null,
  v?: DBVerification,
): { label: string; tone: "ok" | "warn" | "bad" | "muted" } => {
  const s = effectiveStatus(url, v);
  if (s === "verified") return { label: "Verified", tone: "ok" };
  if (s === "rejected") return { label: "Rejected", tone: "bad" };
  if (s === "needs_reupload") return { label: "Re-upload requested", tone: "warn" };
  if (s === "missing") return { label: "Photo pending", tone: "muted" };
  return { label: "Photo not verified", tone: "warn" };
};

