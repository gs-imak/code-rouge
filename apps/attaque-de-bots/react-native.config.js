// React Native CLI project config. Required because the CLI's
// auto-detection of `project.android.packageName` from the gradle
// applicationId fails inside our pnpm-monorepo layout (the workspace
// root vs. per-app cwd confuses the autolink path resolution). Setting
// it explicitly here is the documented escape hatch.
module.exports = {
  project: {
    android: {
      packageName: 'com.coderouge.attaquedebots',
    },
  },
}
