export type LiveFragranceResult = {
  id: string;
  brand: string;
  name: string;
  year?: number | null;
  image_url?: string | null;
  gender?: string | null;
};

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const pageCache = new Map<string, { ts: number; data: LiveFragranceResult[] }>();
const inflight = new Map<string, Promise<LiveFragranceResult[]>>();

const cacheKey = (q: string, limit: number, offset: number) =>
  `${q.trim().toLowerCase()}|${limit}|${offset}`;

export const searchLiveFragrances = async (
  query: string,
  limit = 50,
  offset = 0,
): Promise<LiveFragranceResult[]> => {
  const q = query.trim();
  if (q.length < 2) return [];

  const key = cacheKey(q, limit, offset);
  const cached = pageCache.get(key);
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.data;
  const pending = inflight.get(key);
  if (pending) return pending;

  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const url = `${baseUrl}/functions/v1/fragrance-search-live?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`;

  const promise = (async () => {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, apikey: apiKey },
    });
    if (!response.ok) throw new Error(`Live fragrance search failed: ${response.status}`);
    const json = await response.json();
    const data = (json.results ?? []) as LiveFragranceResult[];
    pageCache.set(key, { ts: Date.now(), data });
    return data;
  })().finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
};

export const searchLiveFragrancesPaged = async (
  query: string,
  pages = 4,
  pageSize = 50,
): Promise<LiveFragranceResult[]> => {
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      searchLiveFragrances(query, pageSize, i * pageSize).catch(() => [] as LiveFragranceResult[]),
    ),
  );
  return results.flat();
};

export const clearFragranceSearchCache = () => {
  pageCache.clear();
  inflight.clear();
};

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export const mergeFragranceResults = <T extends { id?: string; brand: string; name: string }>(
  ...groups: T[][]
) => {
  const seen = new Set<string>();
  return groups.flat().filter((item) => {
    if (!item || !item.brand || !item.name) return false;
    // Always dedupe by normalized brand|name so the same fragrance from
    // different sources (local DB vs live API) collapses into one entry.
    const key = `${norm(item.brand)}|${norm(item.name)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
