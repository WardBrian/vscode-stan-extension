import * as esbuild from "esbuild";
import { polyfillNode } from "esbuild-plugin-polyfill-node";


const production = process.argv.includes("--production");


async function main() {
  const ctx = await esbuild.context({
    entryPoints: ["src/extension.ts", "src/server.ts"],
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "node",
    outdir: "dist",
    external: ["vscode"],
    logLevel: "silent",
    plugins: [
      esbuildProblemMatcherPlugin /* add to the end of plugins array */,
    ],
  });

  const webctx = await esbuild.context({
    entryPoints: ["src/web/extension.ts", "src/web/server.ts"],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'browser',
    outdir: 'dist/web',
    external: ['vscode'],
    logLevel: 'warning',
    // Node.js global to browser globalThis
    define: {
      global: 'globalThis',
    },
    plugins: [
      polyfillNode({
        globals: true,
        process: true,
      }),
      esbuildProblemMatcherPlugin /* add to the end of plugins array */
    ]
  });

  await Promise.all([ctx.rebuild(), webctx.rebuild()]);
  await Promise.all([ctx.dispose(), webctx.dispose()]);
}

/**
 * This plugin hooks into the build process to print errors in a format that the problem matcher in
 * Visual Studio Code can understand.
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",

  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd(result => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(
          `    ${location.file}:${location.line}:${location.column}:`,
        );
      });
      console.log("[watch] build finished");
    });
  },
};

main().catch(e => {
  console.error(e);
  process.exit(1);
});
