import React from "react";

/**
 * Gives the Quill editing surface the same paragraph/heading rhythm as the
 * rendered contract (Quill zeroes these margins by default, which makes sections
 * look cramped). Scoped to .contract-quill so no other editor is affected.
 */
const ContractEditorStyles = () => (
  <style>{`
    .contract-quill .ql-container { font-size: 14px; }
    .contract-quill .ql-editor { line-height: 1.7; min-height: 440px; }
    .contract-quill .ql-editor p { margin: 0 0 10px; }
    .contract-quill .ql-editor h1 { font-size: 24px; font-weight: 700; margin: 20px 0 10px; }
    .contract-quill .ql-editor h2 { font-size: 20px; font-weight: 700; margin: 22px 0 8px; }
    .contract-quill .ql-editor h3 { font-size: 17px; font-weight: 700; margin: 18px 0 6px; }
    .contract-quill .ql-editor h4 { font-size: 15px; font-weight: 700; margin: 14px 0 6px; }
    .contract-quill .ql-editor ul,
    .contract-quill .ql-editor ol { margin: 0 0 10px; }
    .contract-quill .ql-editor li { margin: 3px 0; }
    .contract-quill .ql-editor hr { margin: 18px 0; }
    .contract-quill .ql-editor > *:first-child { margin-top: 0; }
  `}</style>
);

export default ContractEditorStyles;
