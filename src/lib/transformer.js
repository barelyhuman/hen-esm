import * as babelStandalone from "@babel/standalone";

export const transform = (code) => {
  //   debugger;
  return babelStandalone.transform(code, {
    filename: "index.ts",
    sourceType: "module",
    plugins: [babelStandalone.availablePlugins["syntax-jsx"]],
    presets: [
    //   babelStandalone.availablePresets["typescript"],
      babelStandalone.availablePresets["react"],
    ],
  }).code;
};
