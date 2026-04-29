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

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    disableHierarchicalLookup: true,
  },
}

module.exports = mergeConfig(defaultConfig, config)
