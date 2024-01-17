import * as babelStandalone from "@babel/standalone";

export const transform = (code) => {
  return babelStandalone.transform(code, {
    filename: "index.ts",
    sourceType: "module",
    plugins: [babelStandalone.availablePlugins["syntax-jsx"]],
    presets: [
      babelStandalone.availablePresets["es2015-no-commonjs"],
      babelStandalone.availablePresets["react"],
    ],
  }).code;
};
