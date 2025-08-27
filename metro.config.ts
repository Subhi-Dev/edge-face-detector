/* eslint-disable @typescript-eslint/no-require-imports */
const { getDefaultConfig } = require('expo/metro-config');

const { withNativeWind } = require('nativewind/metro')
const {
  wrapWithReanimatedMetroConfig
} = require('react-native-reanimated/metro-config')

// Find the project and workspace directories
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('tflite')
module.exports = withNativeWind(wrapWithReanimatedMetroConfig(config), {
  input: './assets/global.css'
})
