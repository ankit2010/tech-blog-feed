import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/posts";

export const revalidate = 1800;

export async function GET() {
  const posts = await getAllPosts();
  return NextResponse.json({ posts, fetchedAt: new Date().toISOString() });
}
