export type SourceId = "openai" | "anthropic" | "google" | "meta";

export type Source = {
  id: SourceId;
  name: string;
  homepage: string;
  color: string;
  type: "rss" | "scrape-anthropic";
  feedUrl: string;
};

export const SOURCES: Source[] = [
  {
    id: "openai",
    name: "OpenAI",
    homepage: "https://openai.com/news/",
    color: "#10a37f",
    type: "rss",
    feedUrl: "https://openai.com/news/rss.xml",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    homepage: "https://www.anthropic.com/news",
    color: "#d97757",
    type: "scrape-anthropic",
    feedUrl: "https://www.anthropic.com/news",
  },
  {
    id: "google",
    name: "Google",
    homepage: "https://blog.google/",
    color: "#4285f4",
    type: "rss",
    feedUrl: "https://blog.google/rss/",
  },
  {
    id: "meta",
    name: "Meta",
    homepage: "https://engineering.fb.com/",
    color: "#0866ff",
    type: "rss",
    feedUrl: "https://engineering.fb.com/feed/",
  },
];
