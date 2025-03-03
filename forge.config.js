const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { MakerZIP } = require('@electron-forge/maker-zip');
const { MakerDeb } = require('@electron-forge/maker-deb');
const { MakerRpm } = require('@electron-forge/maker-rpm');
const { AutoUnpackNativesPlugin } = require('@electron-forge/plugin-auto-unpack-natives');

const config = {
  packagerConfig: {
    asar: true,
    files: [
      // Include your main Electron files
      "main.js",
      "preload.js",
      "package.json",
      // Only include the browser folder from your Angular build
      "dist/buzzer-control-center/browser/**/*"
    ],
  },
  rebuildConfig: {},
  makers: [new MakerSquirrel({}), new MakerZIP({}, ['darwin']), new MakerRpm({}), new MakerDeb({})],
  plugins: [
    new AutoUnpackNativesPlugin({}),
  ],
  hooks:{
    packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
      const fs = require('fs-extra');
      const path = require('path');

      // Create a copy of assets at the path the app is looking for
      const sourcePath = path.join(buildPath, 'dist/buzzer-control-center/browser/assets');
      const destPath = path.join(buildPath, 'dist/buzzer-control-center/assets');

      if (fs.existsSync(sourcePath)) {
        await fs.copy(sourcePath, destPath);
        console.log(`Copied assets from ${sourcePath} to ${destPath}`);
      }
    }
  },
  publishers: []
};

module.exports = config;
