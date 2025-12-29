export async function parseGoogleAds(page: any) {
  const ads: string[] = await page.$$eval(
    'creative-preview',
    (nodes: Element[]) =>
      nodes.map((node: Element) =>
        (node.textContent || '')
          .replace(/\s+/g, ' ')
          .trim()
      )
  );

  return ads
    .filter((text: string) => text.length > 40)
    .map((text: string) => ({
      advertiser: 'Google Advertiser',
      creative: text.slice(0, 300)
    }));
}
