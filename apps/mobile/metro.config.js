const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/**
 * Metro configuration for the mobile app inside the npm workspace.
 *
 * `watchFolders` reaches up to the workspace root so edits to
 * `packages/core` trigger a rebuild; without it the bundler never sees them
 * and a change to the shared API client appears to do nothing.
 *
 * `nodeModulesPaths` lists this app's own `node_modules` FIRST, and that order
 * is load-bearing. The workspace deliberately runs two different React
 * majors: the web app is on 18.3.1 and this app is on 19.2.3, which React
 * Native 0.86 requires. Resolving `react` from the workspace root would hand
 * the native bundle React 18 and fail at runtime rather than at build time.
 * `packages/core` is framework-free, so nothing outside this directory pulls
 * React into the graph and the nearest-first order is sufficient.
 *
 * Two overrides were removed for SDK 57, both flagged by `expo-doctor`:
 *
 *   * `resolver.unstable_enableSymlinks` is gone. Symlink resolution is
 *     standard in Metro now, and the `unstable_` prefix was a standing
 *     invitation for a silent breakage on upgrade.
 *   * `resolver.disableHierarchicalLookup` is gone. It was set to stop Metro
 *     walking up into the root `node_modules`, which mattered when this app
 *     had no `node_modules` of its own. It now does, and the explicit
 *     `nodeModulesPaths` order above already decides which React wins, so
 *     disabling the standard lookup only removed a fallback.
 */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// require.context powers expo-router's file-based route discovery.
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = config;
