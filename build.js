const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const isWatch = process.argv.includes('--watch');

const baseConfig = {
  bundle: true,
  format: 'esm',
  target: 'chrome108',
  logLevel: 'info',
  sourcemap: false,
};

const entryPoints = [
  // Background service worker (stays ESM, MV3 supports this)
  {
    entryPoints: ['src/background/service-worker.js'],
    outfile: 'dist/background/service-worker.js',
    format: 'esm',
  },
  // Content script (must be IIFE — no ESM support in declared content scripts)
  {
    entryPoints: ['src/content/content-main.js'],
    outfile: 'dist/content/content-main.js',
    format: 'iife',
    globalName: '__KSM_CONTENT__',
  },
  // Popup
  {
    entryPoints: ['src/popup/popup.js'],
    outfile: 'dist/popup/popup.js',
    format: 'esm',
  },
  // Options
  {
    entryPoints: ['src/options/options.js'],
    outfile: 'dist/options/options.js',
    format: 'esm',
  },
];

async function build() {
  // Ensure dist dirs exist
  const dirs = ['dist/background', 'dist/content', 'dist/popup', 'dist/options'];
  dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

  // Copy CSS files to dist
  copyDir('src/styles', 'dist/styles');

  // Copy HTML files with updated script paths
  copyPopupHtml();
  copyOptionsHtml();

  // Copy icons
  copyDir('icons', 'dist/icons');

  // Copy locales
  copyDir('_locales', 'dist/_locales');

  // Write dist manifest
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  manifest.background.service_worker = 'background/service-worker.js';
  manifest.content_scripts[0].js = ['content/content-main.js'];
  manifest.content_scripts[0].css = ['styles/overlay.css'];
  manifest.action.default_popup = 'popup/popup.html';
  manifest.options_ui.page = 'options/options.html';
  manifest.action.default_icon = { '16': 'icons/icon-16.png', '32': 'icons/icon-32.png', '48': 'icons/icon-48.png' };
  manifest.icons = { '16': 'icons/icon-16.png', '32': 'icons/icon-32.png', '48': 'icons/icon-48.png', '128': 'icons/icon-128.png' };
  fs.writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));

  // Build all JS
  const contexts = [];
  for (const entry of entryPoints) {
    const config = { ...baseConfig, ...entry };
    if (isWatch) {
      const ctx = await esbuild.context(config);
      await ctx.watch();
      contexts.push(ctx);
      console.log(`Watching ${entry.entryPoints[0]}…`);
    } else {
      await esbuild.build(config);
    }
  }

  if (!isWatch) {
    console.log('\n✓ Build complete → load the dist/ folder as an unpacked extension in Chrome');
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function copyPopupHtml() {
  const html = fs.readFileSync('src/popup/popup.html', 'utf8')
    .replace('../styles/popup.css', '../styles/popup.css')
    .replace('popup.js', 'popup.js');
  fs.mkdirSync('dist/popup', { recursive: true });
  fs.writeFileSync('dist/popup/popup.html', html);
}

function copyOptionsHtml() {
  const html = fs.readFileSync('src/options/options.html', 'utf8')
    .replace('../styles/options.css', '../styles/options.css')
    .replace('options.js', 'options.js');
  fs.mkdirSync('dist/options', { recursive: true });
  fs.writeFileSync('dist/options/options.html', html);
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
