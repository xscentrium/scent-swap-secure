import { AlertTriangle, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getImageVerification } from "@/lib/imageVerification";
import { cn } from "@/lib/utils";

interface ListingImageProps {
  url?: string | null;
  alt: string;
  className?: string;
}

/**
 * Renders a listing photo only if it comes from a verified product-image
 * source or our own uploads bucket. Anything else shows a clear warning
 * placeholder instead of a wrong/random photo.
 */
export const ListingImage = ({ url, alt, className }: ListingImageProps) => {
  const v = getImageVerification(url);
  const trusted = v.status === "verified" || v.status === "uploaded";

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

  const isMissing = v.status === "none";
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
        {isMissing ? "Photo pending" : "Photo not verified"}
      </p>
      <Badge variant="outline" className="text-[10px]">
        Awaiting verified image
      </Badge>
    </div>
  );
};

/** True when a listing has the metadata + a trustworthy image required to display. */
export const isListingDisplayable = (listing: {
  brand?: string | null;
  name?: string | null;
  size?: string | null;
  image_url?: string | null;
}) => {
  if (!listing.brand?.trim() || !listing.name?.trim() || !listing.size?.trim()) return false;
  const v = getImageVerification(listing.image_url);
  return v.status === "verified" || v.status === "uploaded";
};
