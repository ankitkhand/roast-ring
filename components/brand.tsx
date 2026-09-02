import Link from "next/link";
import { siteConfig } from "@/lib/config";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label={`${siteConfig.name} home`}>
      <span className="brand-mark" aria-hidden="true">{siteConfig.shortName}</span>
      {!compact && <span>{siteConfig.name}</span>}
    </Link>
  );
}
