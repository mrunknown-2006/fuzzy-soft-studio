import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ZipArchive } from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputFileName = 'Fuzzy-Soft-Studio-Master-Code.zip';
const outputPath = path.join(__dirname, outputFileName);

if (fs.existsSync(outputPath)) {
  fs.unlinkSync(outputPath);
  console.log(`🗑️ Removed existing ${outputFileName}`);
}

console.log('📦 Starting project source code packaging...');

const output = fs.createWriteStream(outputPath);
const archive = new ZipArchive({
  zlib: { level: 9 }
});

output.on('close', () => {
  const sizeMB = (archive.pointer() / (1024 * 1024)).toFixed(2);
  console.log('====================================================');
  console.log(`✅ EXPORT COMPLETE: ${outputFileName}`);
  console.log(`📁 Package Size: ${sizeMB} MB (${archive.pointer().toLocaleString()} bytes)`);
  console.log(`📍 Location: ${outputPath}`);
  console.log('🔒 Excluded: node_modules, .git, .env files, dist, and zip archives');
  console.log('🚀 Ready to sell, backup, or deploy!');
  console.log('====================================================');
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('⚠️ Archive warning:', err.message);
  } else {
    throw err;
  }
});

archive.on('error', (err) => {
  console.error('❌ Archive creation error:', err);
  throw err;
});

archive.pipe(output);

const ignoredPatterns = [
  '**/node_modules/**',
  '**/.git/**',
  '**/.env',
  '**/.env.*',
  '**/dist/**',
  '**/*.zip',
  '**/.gemini/**',
  '**/.vscode/**',
  '**/.idea/**'
];

archive.glob('**/*', {
  cwd: __dirname,
  ignore: ignoredPatterns,
  dot: true
});

archive.finalize();
