import { SOURCES } from "@/lib/sources";
import type { Post } from "@/lib/posts";

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

export default function PostCard({ post }: { post: Post }) {
  const source = SOURCES.find((s) => s.id === post.sourceId);

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
    >
      <div className="flex items-center gap-2 text-xs">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 font-medium text-white"
          style={{ backgroundColor: source?.color ?? "#71717a" }}
        >
          {source?.name ?? post.sourceId}
        </span>
        {post.publishedAt && (
          <span className="text-zinc-500 dark:text-zinc-500">
            {relativeTime(post.publishedAt)}
          </span>
        )}
      </div>
      <h2 className="mt-2 text-sm font-medium text-zinc-900 group-hover:underline dark:text-zinc-100">
        {post.title}
      </h2>
      {post.summary && (
        <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {post.summary}
        </p>
      )}
      {post.topics.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {post.topics.map((topic) => (
            <span
              key={topic}
              className="rounded border border-zinc-200 px-1.5 py-0.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
            >
              {topic}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}
