import "./index.css";

import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { transform } from "./lib/transformer";
import {rosePineDawn} from "thememirror"

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
  let extensions = [
    rosePineDawn,
    basicSetup,
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
      debouncedCreateSource(innerDoc, code);
    }),
  ];

  const sandbox = document.getElementById("sandbox");
  const innerDoc = sandbox.contentDocument || sandbox.contentWindow.document;
  const rootElem = innerDoc.createElement("div");
  rootElem.id = "root";
  innerDoc.body.appendChild(rootElem);

  createSourceScript(innerDoc, defaultCode);

  let editor = new EditorView({
    doc: defaultCode,
    extensions: extensions,
    
    parent: document.querySelector("#editor"),
  });


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
    source.src = "data:application/javascript;base64," + btoa(validSourceCode);
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
