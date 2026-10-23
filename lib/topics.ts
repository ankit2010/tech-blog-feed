// Keyword-based topic tagging. Most of these feeds don't publish categories
// (only Google's RSS and Anthropic's scraped page do), so topics are derived
// uniformly from title/summary text to give every source the same coverage.
const TOPIC_KEYWORDS: Record<string, string[]> = {
  "AI & Models": ["ai", "artificial intelligence", "machine learning", "llm", "model", "gpt", "gemini", "claude", "chatgpt"],
  Agents: ["agent", "agentic", "automation", "workflow"],
  Research: ["research", "paper", "study", "benchmark"],
  "Safety & Policy": ["safety", "policy", "responsible", "alignment", "ethic", "governance"],
  Security: ["security", "privacy", "cyber", "vulnerability", "encryption"],
  "Developer Tools": ["api", "sdk", "developer", "cli", "integration", "plugin"],
  "Cloud & Infrastructure": ["cloud", "infrastructure", "data center", "network", "server", "compute"],
  Enterprise: ["enterprise", "business", "partnership", "customer", "industry"],
  "Product Updates": ["announc", "launch", "feature", "release", "update", "introduc"],
  "Open Source": ["open source", "open-source", "github"],
};

function normalize(text: string): string {
  return text.toLowerCase();
}

export function extractTopics(text: string, explicitTopics: string[] = []): string[] {
  const normalized = normalize(text);
  const matched = new Set<string>();

  for (const topic of explicitTopics) {
    const trimmed = topic.trim();
    if (trimmed) matched.add(trimmed);
  }

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      matched.add(topic);
    }
  }

  return Array.from(matched);
}

export type AgeFilterId = "all" | "today" | "week" | "month";

// Cumulative thresholds (e.g. "Past week" includes today), which is the more
// intuitive reading of an age filter than mutually-exclusive day buckets.
export const AGE_FILTERS: { id: AgeFilterId; label: string; maxDays: number | null }[] = [
  { id: "all", label: "Any time", maxDays: null },
  { id: "today", label: "Today", maxDays: 1 },
  { id: "week", label: "Past week", maxDays: 7 },
  { id: "month", label: "Past month", maxDays: 30 },
];

export function daysSince(publishedAt: string | null): number | null {
  if (!publishedAt) return null;
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return null;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

export function matchesAgeFilter(publishedAt: string | null, filterId: AgeFilterId): boolean {
  const filter = AGE_FILTERS.find((f) => f.id === filterId);
  if (!filter || filter.maxDays === null) return true;

  const days = daysSince(publishedAt);
  // Posts with no known date are excluded by any specific age filter, not just "Any time".
  if (days === null) return false;
  return days < filter.maxDays;
}
