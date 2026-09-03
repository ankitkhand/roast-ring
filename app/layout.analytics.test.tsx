import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import RootLayout from "./layout";

vi.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: ({ gaId }: { gaId: string }) => <i data-ga-measurement-id={gaId} />,
}));

describe("global GA4 tag", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("renders no Google tag when the measurement ID is absent", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    const markup = renderToStaticMarkup(<RootLayout><main>Page</main></RootLayout>);

    expect(markup).not.toContain("data-ga-measurement-id");
  });

  it("renders one global Google tag when explicitly configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "configured-in-test");
    const markup = renderToStaticMarkup(<RootLayout><main>Page</main></RootLayout>);

    expect(markup.match(/data-ga-measurement-id/g)).toHaveLength(1);
    expect(markup).toContain('data-ga-measurement-id="configured-in-test"');
  });
});
