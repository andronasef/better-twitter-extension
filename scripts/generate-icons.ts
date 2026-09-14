import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const svgPath = 'assets/better-twitter-logo.svg';
  const svgContent = fs.readFileSync(svgPath);

  fs.mkdirSync('public/icon', { recursive: true });

  const sizes = [16, 32, 48, 96, 128];
  for (const size of sizes) {
    const outPath = path.join('public/icon', `${size}.png`);
    await sharp(svgContent).resize(size, size).png().toFile(outPath);
    console.log(`Generated ${outPath}`);
  }

  await sharp(svgContent).resize(128, 128).png().toFile('assets/icon.png');
  console.log('Generated assets/icon.png');

  fs.writeFileSync('public/better-twitter-logo.svg', svgContent);
  fs.writeFileSync('public/icon.svg', svgContent);
  fs.writeFileSync('public/wxt.svg', svgContent);
  console.log('Copied SVGs to public/better-twitter-logo.svg, public/icon.svg, public/wxt.svg');
}

main().catch(console.error);
