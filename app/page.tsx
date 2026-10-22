import { getAllPosts } from "@/lib/posts";
import PostFeed from "@/components/PostFeed";

export const revalidate = 1800;

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Tech Blog Feed
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Latest posts from OpenAI, Anthropic, Google, and Meta.
          </p>
        </header>
        <PostFeed initialPosts={posts} />
      </main>
    </div>
  );
}
