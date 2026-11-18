const { withAppBuildGradle } = require("expo/config-plugins");

module.exports = ({ config }) => {
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON?.trim();
  const appConfig = {
    ...config,
    ...(projectId && { extra: { ...config.extra, eas: { ...config.extra?.eas, projectId } } }),
    ...(googleServicesFile && { android: { ...config.android, googleServicesFile } }),
  };

  if (process.platform !== "win32") return appConfig;

  return withAppBuildGradle(appConfig, (androidConfig) => {
    const gradle = androidConfig.modResults;
    const cmakeArgument = "-DCMAKE_OBJECT_PATH_MAX=240";
    if (gradle.contents.includes(cmakeArgument)) return androidConfig;

    // Force CMake to hash object paths before reaching the Windows Ninja limit.
    const defaultConfig = /^ {4}defaultConfig \{/m;
    if (!defaultConfig.test(gradle.contents)) {
      throw new Error("Could not locate Android defaultConfig to set the CMake object path limit.");
    }
    gradle.contents = gradle.contents.replace(defaultConfig, `$&
        externalNativeBuild {
            cmake { arguments "${cmakeArgument}" }
        }`);
    return androidConfig;
  });
};
