import React from "react";

/**
 * Renders authored contract HTML with a professional, legal-document look.
 * Body HTML is produced by admins/executives in the editor (trusted) and any
 * merged variable values are escaped, so dangerouslySetInnerHTML is safe here.
 */
const ContractDocument = ({ html, className = "" }) => (
  <div className={`contract-document ${className}`}>
    <style>{`
      .contract-document {
        font-family: Georgia, 'Times New Roman', serif;
        color: #1e293b;
        line-height: 1.75;
        font-size: 15px;
        word-break: break-word;
      }
      .contract-document p { margin: 0 0 12px; }
      .contract-document h1 { font-size: 26px; font-weight: 700; margin: 0 0 14px; color:#0f172a; }
      .contract-document h2 { font-size: 21px; font-weight: 700; margin: 20px 0 10px; color:#0f172a; }
      .contract-document h3 { font-size: 18px; font-weight: 700; margin: 16px 0 8px; color:#0f172a; }
      .contract-document h4 { font-size: 16px; font-weight: 700; margin: 14px 0 8px; color:#0f172a; }
      .contract-document ul, .contract-document ol { margin: 0 0 12px 22px; padding: 0; }
      .contract-document li { margin: 4px 0; }
      .contract-document a { color: #4f46e5; text-decoration: underline; }
      .contract-document strong, .contract-document b { font-weight: 700; }
      .contract-document em, .contract-document i { font-style: italic; }
      .contract-document blockquote {
        border-left: 4px solid #cbd5e1; margin: 0 0 12px; padding: 4px 0 4px 16px; color: #475569;
      }
      .contract-document .ql-align-center { text-align: center; }
      .contract-document .ql-align-right { text-align: right; }
      .contract-document .ql-align-justify { text-align: justify; }
      .contract-document img { max-width: 100%; height: auto; }
      .contract-document hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
    `}</style>
    <div dangerouslySetInnerHTML={{ __html: html || "" }} />
  </div>
);

export default ContractDocument;
