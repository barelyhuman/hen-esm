import "./index.css";

import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
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

const defaultCode = `import React from "https://esm.sh/react";
import {createRoot} from "https://esm.sh/react-dom/client";

const root = createRoot(document.getElementById("root"))

function App(){
 return <h1>Hello</h1>
}

root.render(<App/>)`;

const debouncedCreateSource = debounce(createSourceScript, 250);

init();

function init() {
  const persistJS = createURLPersistanceStore("js");
  const persistCSS = createURLPersistanceStore("css");

  jsStore.load("jsCode", persistJS);
  cssStore.load("cssCode", persistCSS);
  jsStore.persist("jsCode", persistJS);
  cssStore.persist("cssCode", persistCSS);

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
      const sandbox = document.getElementById("sandbox");
      const code = d.state.doc.text.join("\n");
      const innerDoc =
        sandbox.contentDocument || sandbox.contentWindow.document;
      jsStore.data = code;
      debouncedCreateSource(innerDoc, code);
    }),
  ];

  const sandbox = document.getElementById("sandbox");
  const innerDoc = sandbox.contentDocument || sandbox.contentWindow.document;
  const rootElem = innerDoc.createElement("div");
  rootElem.id = "root";
  innerDoc.body.appendChild(rootElem);

  const styles = innerDoc.createElement("style");
  styles.innerHTML = `
    body{
      font-family: sans-serif;
    }
  `;
  innerDoc.head.appendChild(styles);

  createSourceScript(innerDoc, defaultCode);

  let view = new EditorView({
    doc: jsStore.data || defaultCode,
    extensions: extensions,
    lineNumbers: false,
    parent: document.querySelector("#editor"),
  });

  initMenuBar();
  initContextSwitch();
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

function debounce(fn, delay) {
  let id;
  return (...args) => {
    if (id) clearTimeout(id);
    id = setTimeout(() => {
      fn(...args);
      clearTimeout(id);
    }, delay);
  };
}

function initMenuBar() {
  const menuBar = document.querySelector("#menu-bar");
  const shareButton = menuBar.querySelector("#share-button");
  shareButton.addEventListener("click", () => {
    copyToClipboard(window.location.href);
    toast.success("Copied");
  });
}

function copyToClipboard(strToCopy) {
  if (!navigator.clipboard) {
    return fallBackCopy(strToCopy);
  }
  navigator.permissions
    .query({ name: "clipboard-write" })
    .then((result) => {
      if (result.state == "granted" || result.state == "prompt") {
        navigator.clipboard.writeText(strToCopy).then(
          function () {
            // ignore and digest
          },
          function () {
            return fallBackCopy(strToCopy);
          }
        );
      } else {
        return fallBackCopy(strToCopy);
      }
    })
    .catch((err) => {
      return fallBackCopy(strToCopy);
    });
}

function fallBackCopy(strToCopy) {
  const el = document.createElement("textarea");
  el.value = strToCopy;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

function initContextSwitch() {
  const switcher = document.getElementById("context-switch");
  const jsView = switcher.querySelector("#switch-js");
  const cssView = switcher.querySelector("#switch-css");

  jsView.addEventListener("click", () => {
    showJSView();
  });
  cssView.addEventListener("click", () => {
    showCSSView();
  });
}
