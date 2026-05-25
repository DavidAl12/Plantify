const { withAppBuildGradle } = require("@expo/config-plugins");

const SNIPPET = `
    // @generated begin custom-apk-name
    applicationVariants.all { variant ->
        variant.outputs.all { output ->
            outputFileName = variant.buildType.name == "release" ? "Perflora.apk" : "Perflora-\${variant.name}.apk"
        }
    }
    // @generated end custom-apk-name
`;

module.exports = function withCustomApkName(config) {
  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults;

    if (buildGradle.language !== "groovy" || buildGradle.contents.includes("@generated begin custom-apk-name")) {
      return config;
    }

    const anchor = "\n}\n\n// Apply static values from `gradle.properties`";
    if (!buildGradle.contents.includes(anchor)) {
      return config;
    }

    buildGradle.contents = buildGradle.contents.replace(anchor, `${SNIPPET}${anchor}`);
    return config;
  });
};
