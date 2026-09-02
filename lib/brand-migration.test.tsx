import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { metadata } from "@/app/layout";
import HomePage from "@/app/page";
import YoMamaBattlePage from "@/app/yo-mama-battle/page";
import YoMamaJokesPage from "@/app/yo-mama-jokes/page";
import { Brand } from "@/components/brand";
import { siteConfig } from "@/lib/config";

function titleDefault() {
  return typeof metadata.title === "object" && metadata.title && "default" in metadata.title
    ? metadata.title.default
    : metadata.title;
}

describe("Roast Clash brand migration", () => {
  it("uses the final public brand in shared configuration and root metadata", () => {
    expect(siteConfig.name).toBe("Roast Clash");
    expect(siteConfig.shortName).toBe("RC");
    expect(titleDefault()).toBe("Yo Mama Battle | Roast Clash");
    expect(metadata.applicationName).toBe("Roast Clash");
    expect(metadata.openGraph?.siteName).toBe("Roast Clash");
  });

  it("renders the RC brand mark and accessible home label", () => {
    const markup = renderToStaticMarkup(<Brand />);
    expect(markup).toContain(">RC<");
    expect(markup).toContain('aria-label="Roast Clash home"');
  });

  it("contains no old public brand in key static pages", () => {
    const markup = [<HomePage key="home" />, <YoMamaJokesPage key="jokes" />, <YoMamaBattlePage key="battle" />]
      .map((page) => renderToStaticMarkup(page))
      .join("\n");

    expect(markup).toContain("Roast Clash");
    expect(markup).not.toContain(["Roast", "Arena"].join(" "));
  });
});
