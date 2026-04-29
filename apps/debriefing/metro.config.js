const path = require('path')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

// See apps/attaque-de-bots/metro.config.js for the rationale on
// disableHierarchicalLookup + workspace watchFolders. Same pattern, same
// constraints — kept identical so future RN apps can copy-paste this file.

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const defaultConfig = getDefaultConfig(projectRoot)

// Block Metro from watching node_modules at the workspace root.
// See apps/attaque-de-bots/metro.config.js for the full rationale.
const blockList = [
  new RegExp(`^${path.join(workspaceRoot, 'node_modules').replace(/\\/g, '\\\\')}`),
  new RegExp(`^${path.join(workspaceRoot, 'apps').replace(/\\/g, '\\\\')}(?!${path.sep}debriefing).*${path.sep}node_modules`),
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
