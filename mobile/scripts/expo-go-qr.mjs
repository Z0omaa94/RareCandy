// Prints the Expo Go QR code for a URL in the terminal, and optionally saves it as a PNG.
// Usage: node scripts/expo-go-qr.mjs exp://host [out.png]
import QRCode from 'qrcode';

const [url, out] = process.argv.slice(2);
if (!url) {
  console.error('Usage: node scripts/expo-go-qr.mjs <url> [out.png]');
  process.exit(1);
}

console.log(await QRCode.toString(url, { type: 'terminal', small: true }));
if (out) {
  await QRCode.toFile(out, url, {
    width: 560,
    margin: 2,
    color: { dark: '#0B3D91', light: '#FFFFFF' },
  });
  console.log(`QR code saved to ${out}`);
}
