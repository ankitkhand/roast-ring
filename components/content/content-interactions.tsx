"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { track } from "@/lib/analytics";

export function ContentPageAnalytics({ slug }: { slug: string }) {
  useEffect(() => track("content_page_view", { page: slug }), [slug]);
  return null;
}

export function TrackedContentLink({ href, page, location, className, children }: {
  href: string;
  page: string;
  location: string;
  className?: string;
  children: ReactNode;
}) {
  return <Link href={href} className={className} onClick={() => track("content_battle_cta_clicked", { page, location })}>{children}</Link>;
}

export async function copyJokeText(text: string) {
  if (!navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function JokeCopyButton({ jokeId, text, page }: { jokeId: string; text: string; page: string }) {
  const [copied, setCopied] = useState(false);

  async function copyJoke() {
    if (!await copyJokeText(text)) return;
    setCopied(true);
    track("joke_copied", { page, jokeId });
    window.setTimeout(() => setCopied(false), 1_600);
  }

  return (
    <button className="joke-copy" type="button" onClick={copyJoke} aria-label={`Copy joke ${jokeId}`}>
      {copied ? "COPIED" : "COPY"}
    </button>
  );
}
