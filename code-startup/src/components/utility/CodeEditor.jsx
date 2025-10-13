import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { cpp } from "@codemirror/lang-cpp"; // C도 cpp 하이라이트를 재사용

export default function CodeEditor({ value, onChange, height = "420px" }) {
  return (
    <CodeMirror
      value={value}
      height={height}
      theme={oneDark}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        autocompletion: true,
        foldGutter: true,
        indentOnInput: true,   // 입력 시 자동 들여쓰기
      }}
      extensions={[cpp()]}
      onChange={(val) => onChange?.(val)}
    />
  );
}
