"use client";

import { useMemo, useState } from "react";
import { SOURCES, type SourceId } from "@/lib/sources";
import type { Post } from "@/lib/posts";
import PostCard from "./PostCard";

export default function PostFeed({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [activeSources, setActiveSources] = useState<Set<SourceId>>(
    new Set(SOURCES.map((s) => s.id)),
  );
  const [refreshing, setRefreshing] = useState(false);

  const filteredPosts = useMemo(
    () => posts.filter((p) => activeSources.has(p.sourceId)),
    [posts, activeSources],
  );

  function toggleSource(id: SourceId) {
    setActiveSources((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
      <div className="mb-6 flex flex-wrap items-center gap-2">
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
