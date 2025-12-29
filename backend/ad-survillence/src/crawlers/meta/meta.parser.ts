export async function parseMetaAds(
  page: any,
  keywords: string[] = []
) {
  const texts = await page.$$eval(
    'div',
    (nodes: Element[]) =>
      nodes
        .map(n =>
          (n.textContent || '')
            .replace(/\s+/g, ' ')
            .trim()
        )
        .filter(t => t.length > 50)
  );

  const uniqueAds = new Map<string, string>();

  for (const text of texts) {
    // 🔥 keyword filter
    if (
      keywords.length > 0 &&
      !keywords.some(k =>
        text.toLowerCase().includes(k.toLowerCase())
      )
    ) {
      continue;
    }

    const fingerprint = text.slice(0, 120);
    uniqueAds.set(fingerprint, text.slice(0, 300));
  }

  return Array.from(uniqueAds.values()).map(creative => ({
    advertiser: 'Meta Advertiser',
    creative
  }));
}
