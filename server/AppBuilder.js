
const fs = require("fs");
const path = require("path");
const os = require("os");
const esbuild = require("esbuild");
const JavaScriptObfuscator = require("javascript-obfuscator");


let do2 = false;

if(do2) {
    const candidates = [
  path.join(process.cwd(), "game"),
  path.join(process.cwd(), "public", "game"),
  path.join(__dirname, "..", "game"),
  path.join(__dirname, "..", "public", "game"),
  path.join(__dirname, "..", "..", "game"),
  path.join(__dirname, "..", "..", "public", "game"),
];

function findGameDir() {
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isDirectory()) return path.resolve(c);
  }
  return null;
}

function gatherJsFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      results.push(...gatherJsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      results.push(full);
    }
  }
  return results;
}

(async () => {
  console.log(
    "Detecting game directory — candidates:\n" +
      candidates.map((c) => "  - " + c).join("\n")
  );

  const SRC_DIR = findGameDir();
  if (!SRC_DIR) {
    console.error("❌ No valid game directory found.");
    process.exit(1);
  }

  console.log(`\nUsing game directory: ${SRC_DIR}`);

  const files = gatherJsFiles(SRC_DIR);
  if (files.length === 0) {
    console.warn("No .js files found in", SRC_DIR);
    process.exit(0);
  }

  console.log(
    `Found ${files.length} JS files (showing up to 12):\n` +
      files
        .slice(0, 12)
        .map((f) => "  - " + path.relative(SRC_DIR, f))
        .join("\n")
  );

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "game-bundle-"));
  const entryFile = path.join(tmpDir, "entry.mjs");

  // BUG FIX use absolute import paths for esbuild to resolve correctly
  const importLines = files.map((f) => `import "${path.resolve(f).replace(/\\/g, "/")}";`);
  fs.writeFileSync(entryFile, importLines.join("\n"), "utf8");

  const tmpBundle = path.join(tmpDir, "bundle.tmp.js");
  const outFile = path.join(SRC_DIR, "build1.js");

  console.log("⚙️  Bundling with esbuild (this resolves imports/exports)...");

  try {
    await esbuild.build({
      entryPoints: [entryFile],
      bundle: true,
      format: "iife",
      globalName: "GameBundle",
      platform: "browser",
      target: ["es2018"],
      outfile: tmpBundle,
      minify: true,
      sourcemap: false,
      logLevel: "silent",
    });
  } catch (err) {
    console.error("❌ esbuild failed:", err);
    process.exit(1);
  }

  console.log("Bundle created:", tmpBundle);
  console.log("Obfuscating bundle...");

  try {
    const MINIMAL_OBFUSCATOR_OPTIONS = {
      compact: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      debugProtection: false,
      debugProtectionInterval: 0,
      disableConsoleOutput: false,
      rotateStringArray: false,
      stringArray: false,
      numbersToExpressions: false,
      simplify: true,
      selfDefending: false,
      transformObjectKeys: false,
      unicodeEscapeSequence: false,
      renameGlobals: false
    };

    // Read bundle
    const code = fs.readFileSync(tmpBundle, "utf8");
    const obf = JavaScriptObfuscator.obfuscate(code, MINIMAL_OBFUSCATOR_OPTIONS);
    const obfuscatedCode = obf.getObfuscatedCode();

    const coreCredits = [
      "Credits",
      "----------------",
      "Socket.IO — https://socket.io (MIT)",
      "three.js — https://threejs.org (MIT)",
      "Cloudflare — services used",
      "",
      "authors and maintainers of the libraries above."
    ].join("\n");

    const commentBlock = `\n/*\n${coreCredits}\n*/\n`;

    // Write obfuscated bundle + comment
    fs.writeFileSync(outFile, obfuscatedCode + commentBlock, "utf8");
    console.log(`✅ Obfuscated bundle written to: ${outFile}`);
  } catch (err) {
    console.error("❌ Obfuscation failed:", err);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

})();

}