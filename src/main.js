import "./index.css";

import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { EditorView, keymap } from "@codemirror/view";

import { minimalSetup } from "codemirror";

import {
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { lintKeymap } from "@codemirror/lint";
import { searchKeymap } from "@codemirror/search";

import { rosePineDawn } from "thememirror";
import { toast } from "./lib/toast";
import { transform } from "./lib/transformer";
import { createURLPersistanceStore, cssStore, jsStore } from "./lib/store";
import { copyToClipboard, debounce } from "./lib/utils";

let activeView;

const defaultCode = `import React from "https://esm.sh/react";
import {createRoot} from "https://esm.sh/react-dom/client";

const root = createRoot(document.getElementById("root"))

function App(){
 return <h1>Hello</h1>
}

root.render(<App/>)`;

const defaultStyles = `
  body {
    font-family: sans-serif;
  }
`;

const debouncedCreateSource = debounce(createSourceScript, 250);

init();

function init() {
  const persistJS = createURLPersistanceStore("js");
  const persistCSS = createURLPersistanceStore("css");

  jsStore.load("jsCode", persistJS);
  cssStore.load("cssCode", persistCSS);
  jsStore.persist("jsCode", persistJS);
  cssStore.persist("cssCode", persistCSS);

  createRootElement();
  initMenuBar();
  initContextSwitch();

  createSourceScript(getSandboxDocument(), jsStore.data || defaultCode);
  createSourceStyle(getSandboxDocument(), cssStore.data || defaultStyles);

  getJsSwitcher().classList.add("active");
  activeView = showJSView();
}

function createRootElement() {
  const sandbox = document.getElementById("sandbox");
  const innerDoc = sandbox.contentDocument || sandbox.contentWindow.document;
  const rootElem = innerDoc.createElement("div");
  rootElem.id = "root";
  innerDoc.body.appendChild(rootElem);
}

function createSourceStyle(innerDoc, sourceCode) {
  const existingSource = innerDoc.getElementById("sandbox_style");
  if (existingSource) {
    innerDoc.head.removeChild(existingSource);
  }
  try {
    const styleLinik = innerDoc.createElement("link");
    styleLinik.id = "sandbox_style";
    const blob = new Blob([sourceCode], {
      type: "text/css",
    });
    styleLinik.rel = "stylesheet";
    styleLinik.href = URL.createObjectURL(blob);
    innerDoc.head.appendChild(styleLinik);
  } catch (err) {
    console.error(err);
  }
}

function createSourceScript(innerDoc, sourceCode) {
  const rootElem = innerDoc.getElementById("root");
  rootElem.innerHTML = "";
  const existingSource = innerDoc.getElementById("sandbox_src");
  if (existingSource) {
    innerDoc.body.removeChild(existingSource);
  }
  try {
    const validSourceCode = transform(sourceCode);
    const source = innerDoc.createElement("script");
    source.id = "sandbox_src";
    source.type = "module";
    const blob = new Blob([validSourceCode], {
      type: "application/javascript",
    });
    source.src = URL.createObjectURL(blob);
    innerDoc.body.appendChild(source);
  } catch (err) {
    console.error(err);
  }
}

function initMenuBar() {
  const menuBar = document.querySelector("#menu-bar");
  const shareButton = menuBar.querySelector("#share-button");
  shareButton.addEventListener("click", () => {
    copyToClipboard(window.location.href);
    toast.success("Copied");
  });
}

function getSwitcher() {
  return document.getElementById("context-switch");
}
function getCssSwitcher() {
  return getSwitcher().querySelector("#switch-css");
}

function getJsSwitcher() {
  return getSwitcher().querySelector("#switch-js");
}

("#switch-css");
function initContextSwitch() {
  const jsView = getJsSwitcher();
  const cssView = getCssSwitcher();
  jsView.addEventListener("click", () => {
    activeView = showJSView(activeView);
    cssView.classList.remove("active");
    jsView.classList.add("active");
  });
  cssView.addEventListener("click", () => {
    activeView = showCSSView(activeView);
    jsView.classList.remove("active");
    cssView.classList.add("active");
  });
}

function showJSView(currentView) {
  let extensions = [
    rosePineDawn,
    minimalSetup,
    history(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...completionKeymap,
      ...lintKeymap,
    ]),
    keymap.of([indentWithTab]),
    javascript({
      typescript: true,
      jsx: true,
    }),
    EditorView.updateListener.of((d) => {
      if (!d.docChanged) return;
      const code = d.state.doc.text.join("\n");
      jsStore.data = code;
      debouncedCreateSource(getSandboxDocument(), code);
    }),
  ];

  currentView?.destroy();
  let view = new EditorView({
    doc: jsStore.data || defaultCode,
    extensions: extensions,
    lineNumbers: false,
    parent: document.querySelector("#editor"),
  });

  createSourceScript(getSandboxDocument(), jsStore.data || defaultCode);

  return view;
}

function getSandboxDocument() {
  const sandbox = document.getElementById("sandbox");
  const innerDoc = sandbox.contentDocument || sandbox.contentWindow.document;
  return innerDoc;
}

function showCSSView(currentView) {
  let extensions = [
    rosePineDawn,
    minimalSetup,
    history(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...completionKeymap,
      ...lintKeymap,
    ]),
    keymap.of([indentWithTab]),
    css(),
    EditorView.updateListener.of((d) => {
      if (!d.docChanged) return;
      const code = d.state.doc.text.join("\n");
      cssStore.data = code;
      createSourceStyle(getSandboxDocument(), code);
    }),
  ];

  currentView?.destroy();
  let view = new EditorView({
    doc: cssStore.data || defaultStyles,
    extensions: extensions,
    lineNumbers: false,
    parent: document.querySelector("#editor"),
  });

  createSourceStyle(getSandboxDocument(), cssStore.data || defaultStyles);

  return view;
}
