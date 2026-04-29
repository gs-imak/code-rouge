const path = require('path')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

// See apps/attaque-de-bots/metro.config.js for the rationale on
// disableHierarchicalLookup + workspace watchFolders. Same pattern, same
// constraints — kept identical so future RN apps can copy-paste this file.

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
