import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { SOURCES, type Source, type SourceId } from "./sources";

export type Post = {
  id: string;
  title: string;
  url: string;
  sourceId: SourceId;
  publishedAt: string | null;
  summary: string | null;
};

const rssParser = new Parser({ timeout: 10_000 });

// RSS feeds are ordered newest-first; keep only the latest N per source so
// "latest posts" doesn't balloon into an org's entire blog archive.
const POSTS_PER_SOURCE = 20;

async function fetchRssPosts(source: Source): Promise<Post[]> {
  const feed = await rssParser.parseURL(source.feedUrl);
  return (feed.items ?? [])
    .slice(0, POSTS_PER_SOURCE)
    .filter((item) => item.link && item.title)
    .map((item) => ({
      id: `${source.id}:${item.link}`,
      title: item.title!.trim(),
      url: item.link!,
      sourceId: source.id,
      publishedAt: item.isoDate ?? item.pubDate ?? null,
      summary: item.contentSnippet?.trim().slice(0, 240) ?? null,
    }));
}

async function fetchAnthropicPosts(source: Source): Promise<Post[]> {
  const res = await fetch(source.feedUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; tech-blog-feed/1.0)" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Anthropic fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const seen = new Set<string>();
  const posts: Post[] = [];

  // Post cards are `<a href="/news/<slug>">` that wrap an `<h3>` title and
  // `<p>` summary; category tags use the same `/news/` prefix but have no h3.
  $('a[href^="/news/"]').each((_, el) => {
    const anchor = $(el);
    const titleEl = anchor.find("h3").first();
    if (titleEl.length === 0) return;

    const href = anchor.attr("href");
    if (!href) return;
    const url = new URL(href, "https://www.anthropic.com").toString();
    if (seen.has(url)) return;

    const title = titleEl.text().trim().replace(/\s+/g, " ");
    if (!title) return;

    const summary = anchor.find("p").first().text().trim().replace(/\s+/g, " ") || null;
    const timeText = anchor.closest("article").find("time").first().text().trim();
    const parsedDate = timeText ? new Date(timeText) : null;
    const publishedAt =
      parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null;

    seen.add(url);
    posts.push({
      id: `${source.id}:${url}`,
      title,
      url,
      sourceId: source.id,
      publishedAt,
      summary,
    });
  });

  return posts.slice(0, POSTS_PER_SOURCE);
}

async function fetchSourcePosts(source: Source): Promise<Post[]> {
  try {
    if (source.type === "rss") return await fetchRssPosts(source);
    if (source.type === "scrape-anthropic") return await fetchAnthropicPosts(source);
    return [];
  } catch (err) {
    console.error(`[posts] failed to fetch ${source.id}:`, err);
    return [];
  }
}

export async function getAllPosts(): Promise<Post[]> {
  const results = await Promise.all(SOURCES.map(fetchSourcePosts));
  const posts = results.flat();

  posts.sort((a, b) => {
    if (!a.publishedAt && !b.publishedAt) return 0;
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return posts;
}
