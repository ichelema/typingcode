// Screenshot leggero per l'assistente (meno token): JPEG ridotto via CDP.
// shot(page, file, { scale = 0.5, quality = 50, selector }) — selector: ritaglia su un elemento (es. '#tv-side-panel').
import { writeFileSync } from 'node:fs';

export async function shot(page, file, { scale = 0.5, quality = 50, selector } = {}) {
  let clip;
  if (selector) {
    const b = await page.locator(selector).first().boundingBox();
    if (b) clip = { x: b.x, y: b.y, width: b.width, height: b.height, scale };
  }
  if (!clip) {
    const v = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
    clip = { x: 0, y: 0, width: v.w, height: v.h, scale };
  }
  const cdp = await page.context().newCDPSession(page);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality, clip, captureBeyondViewport: false });
  await cdp.detach();
  writeFileSync(file, Buffer.from(data, 'base64'));
  return file;
}
