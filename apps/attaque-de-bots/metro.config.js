const path = require('path')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

// Monorepo-aware Metro config. Without watchFolders + nodeModulesPaths
// pointing at the repo root, RN can't resolve workspace packages
// (@code-rouge/shared-types, etc.) under pnpm's hoisted layout.
//
// `disableHierarchicalLookup: true` is REQUIRED for pnpm — Metro's default
// hoisted lookup walks up the tree and would conflict with pnpm's
// node_modules layout. See:
// https://github.com/pnpm/pnpm/issues/4664#issuecomment-1158648068

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const defaultConfig = getDefaultConfig(projectRoot)

// Block Metro from watching node_modules at the workspace root.
// We still declare watchFolders so that Metro can *resolve* workspace
// packages (packages/shared-types, etc.) via nodeModulesPaths, but we
// don't want Metro's file-watcher to index ~600 packages it will never
// bundle directly. Without this blockList, cold Metro start is ~20 s and
// HMR latency is +200–500 ms per save.
const blockList = [
  // workspace-root node_modules (the large one)
  new RegExp(`^${path.join(workspaceRoot, 'node_modules').replace(/\\/g, '\\\\')}`),
  // Also block any nested node_modules that aren't this app's own
  new RegExp(`^${path.join(workspaceRoot, 'apps').replace(/\\/g, '\\\\')}(?!${path.sep}attaque-de-bots).*${path.sep}node_modules`),
]

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    disableHierarchicalLookup: true,
    blockList,
  },
}

module.exports = mergeConfig(defaultConfig, config)
