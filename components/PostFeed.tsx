"use client";

import { useMemo, useState } from "react";
import { SOURCES, type SourceId } from "@/lib/sources";
import type { Post } from "@/lib/posts";
import { AGE_FILTERS, matchesAgeFilter, type AgeFilterId } from "@/lib/topics";
import PostCard from "./PostCard";

const TOP_TOPICS_COUNT = 8;

export default function PostFeed({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [activeSources, setActiveSources] = useState<Set<SourceId>>(
    new Set(SOURCES.map((s) => s.id)),
  );
  const [ageFilter, setAgeFilter] = useState<AgeFilterId>("all");
  const [activeTopics, setActiveTopics] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Company + age filters apply first; topic chips are derived from what's
  // left so they stay relevant to the currently visible posts.
  const byCompanyAndAge = useMemo(
    () =>
      posts.filter(
        (p) => activeSources.has(p.sourceId) && matchesAgeFilter(p.publishedAt, ageFilter),
      ),
    [posts, activeSources, ageFilter],
  );

  const topTopics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of byCompanyAndAge) {
      for (const topic of post.topics) {
        counts.set(topic, (counts.get(topic) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_TOPICS_COUNT)
      .map(([topic]) => topic);
  }, [byCompanyAndAge]);

  const filteredPosts = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    return byCompanyAndAge.filter((post) => {
      if (activeTopics.size > 0 && !post.topics.some((t) => activeTopics.has(t))) {
        return false;
      }
      if (!trimmedQuery) return true;
      const haystack = `${post.title} ${post.summary ?? ""} ${post.topics.join(" ")}`.toLowerCase();
      return haystack.includes(trimmedQuery);
    });
  }, [byCompanyAndAge, activeTopics, query]);

  function toggleSource(id: SourceId) {
    setActiveSources((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTopic(topic: string) {
    setActiveTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  }

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/posts", { cache: "no-store" });
      const data = await res.json();
      setPosts(data.posts ?? []);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {SOURCES.map((source) => {
          const active = activeSources.has(source.id);
          return (
            <button
              key={source.id}
              type="button"
              onClick={() => toggleSource(source.id)}
              className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              style={
                active
                  ? { backgroundColor: source.color, borderColor: source.color, color: "white" }
                  : { borderColor: "#d4d4d8", color: "#71717a" }
              }
            >
              {source.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="ml-auto rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {AGE_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setAgeFilter(filter.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              ageFilter === filter.id
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search posts…"
        className="mb-3 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      />

      {topTopics.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-zinc-500 dark:text-zinc-500">Top topics:</span>
          {topTopics.map((topic) => {
            const active = activeTopics.has(topic);
            return (
              <button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                className={`rounded border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-400"
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>
      )}

      {filteredPosts.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-500">No posts to show.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
