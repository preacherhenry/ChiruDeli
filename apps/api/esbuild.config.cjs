/**
 * Bundles the API into a single dist/server.js with esbuild instead of
 * plain `tsc`. Reason: @chirudeli/shared-types ships as raw TypeScript
 * source (fine for the bundler-based frontends, which transpile it
 * themselves) — plain `node` can't `require()` that directly, so tsc-only
 * output broke in production. esbuild parses TS natively and inlines our
 * own workspace packages while leaving real npm dependencies (fastify,
 * @prisma/client, etc.) external so Prisma's generated client/engine still
 * resolve normally from node_modules at runtime.
 */
const { build } = require('esbuild');
const pkg = require('./package.json');

const workspaceScope = '@chirudeli/';
const external = Object.keys(pkg.dependencies || {}).filter((name) => !name.startsWith(workspaceScope));

build({
  entryPoints: ['src/server.ts'],
  outfile: 'dist/server.js',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: true,
  logLevel: 'info',
  external,
}).catch(() => process.exit(1));
