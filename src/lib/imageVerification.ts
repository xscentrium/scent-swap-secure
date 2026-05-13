// Approved/verified image sources for fragrance listings.
// Real product photo CDNs + our own Supabase storage bucket.
const APPROVED_HOSTS = [
  'fimgs.net',           // Fragrantica
  'www.fragrantica.com',
  'images.fragrantica.com',
  'cdn.shopify.com',
  'images.sephora.com',
  'www.sephora.com',
  'www.notino.com',
  'cdn.notino.com',
  'images.ulta.com',
  'www.ulta.com',
  'www.fragranceshop.com',
  'm.media-amazon.com',
  'images-na.ssl-images-amazon.com',
  'images.hernas.com',
];

// Anything stored in our own Supabase storage bucket counts as user-uploaded
// (the upload UI only writes here, so we trust it).
const SUPABASE_STORAGE_HOST_FRAGMENT = 'supabase.co/storage';

// Disallow obvious placeholder / random sources.
const BANNED_HOST_FRAGMENTS = ['picsum.photos', 'placehold', 'placeholder', 'unsplash.com/random'];

export function getImageVerification(url?: string | null): {
  status: 'verified' | 'uploaded' | 'unverified' | 'banned' | 'none';
  label: string;
} {
  if (!url) return { status: 'none', label: 'No image' };
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return { status: 'unverified', label: 'Unverified source' };
  }
  if (BANNED_HOST_FRAGMENTS.some((b) => url.toLowerCase().includes(b))) {
    return { status: 'banned', label: 'Placeholder image not allowed' };
  }
  if (url.includes(SUPABASE_STORAGE_HOST_FRAGMENT)) {
    return { status: 'uploaded', label: 'Uploaded by seller' };
  }
  if (APPROVED_HOSTS.some((h) => host === h || host.endsWith('.' + h))) {
    return { status: 'verified', label: 'Verified product image' };
  }
  return { status: 'unverified', label: 'Unverified source' };
}

export function isImageAllowed(url?: string | null): boolean {
  const { status } = getImageVerification(url);
  return status === 'verified' || status === 'uploaded';
}
