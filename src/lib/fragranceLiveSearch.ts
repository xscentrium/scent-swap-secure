export type LiveFragranceResult = {
  id: string;
  brand: string;
  name: string;
  year?: number | null;
  image_url?: string | null;
  gender?: string | null;
};

export const searchLiveFragrances = async (query: string, limit = 50): Promise<LiveFragranceResult[]> => {
  const q = query.trim();
  if (q.length < 2) return [];

  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const url = `${baseUrl}/functions/v1/fragrance-search-live?q=${encodeURIComponent(q)}&limit=${limit}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
  });

  if (!response.ok) {
    throw new Error(`Live fragrance search failed: ${response.status}`);
  }

  const json = await response.json();
  return (json.results ?? []) as LiveFragranceResult[];
};

export const mergeFragranceResults = <T extends { id?: string; brand: string; name: string }>(
  ...groups: T[][]
) => {
  const seen = new Set<string>();
  return groups.flat().filter((item) => {
    const key = item.id || `${item.brand.toLowerCase()}|${item.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};