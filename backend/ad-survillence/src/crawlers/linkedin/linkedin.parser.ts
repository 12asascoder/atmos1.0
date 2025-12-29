export async function parseLinkedInAds(page: any) {
  const texts: string[] = await page.$$eval(
    'div',
    (nodes: Element[]) =>
      nodes
        .map(n =>
          (n.textContent || '')
            .replace(/\s+/g, ' ')
            .trim()
        )
        // keep only meaningful blocks
        .filter(t => t.length > 120 && t.length < 1000)
  );

  console.log('LinkedIn text blocks:', texts.length);

  // 🔑 Deduplicate using fingerprints
  const uniqueAds = new Map<string, string>();

  for (const text of texts) {
    const fingerprint = text.slice(0, 150);

    if (!uniqueAds.has(fingerprint)) {
      uniqueAds.set(fingerprint, text.slice(0, 300));
    }
  }

  const results = Array.from(uniqueAds.values());

  console.log('LinkedIn ads after dedupe:', results.length);

  return results.map(creative => ({
    advertiser: 'LinkedIn Advertiser',
    creative
  }));
}
