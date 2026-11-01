"use client";

import { useMemo, useState } from "react";
import Markdown from "react-markdown";
import { Check, Copy } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TaskMessageVM } from "@/lib/meshwork/types";

/**
 * zcode assistant message — full-width markdown answer (no bubble), with a
 * hover copy action and timestamp. Tables are rendered by a tiny built-in
 * fallback (remark-gfm is not part of the stack), everything else by
 * react-markdown with the workspace's dark prose styling.
 */

/* ---------- tiny markdown table support (no gfm plugin installed) ---------- */

type MdBlock = { type: "md"; text: string } | { type: "table"; header: string[]; rows: string[][] };

function parseRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function splitBlocks(text: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  let md: string[] = [];
  let table: string[] = [];

  const flushMd = () => {
    if (md.length > 0) {
      blocks.push({ type: "md", text: md.join("\n") });
      md = [];
    }
  };
  const flushTable = () => {
    if (table.length > 0) {
      const rows = table.map(parseRow).filter((r) => r.length > 1 || r[0] !== "");
      const hasSeparator =
        rows.length > 1 && rows[1].every((cell) => /^:?-{3,}:?$/.test(cell));
      blocks.push({
        type: "table",
        header: rows[0] ?? [],
        rows: hasSeparator ? rows.slice(2) : rows.slice(1),
      });
      table = [];
    }
  };

  for (const line of text.split("\n")) {
    if (/^\s*\|.*\|\s*$/.test(line)) {
      table.push(line);
    } else {
      flushTable();
      md.push(line);
    }
  }
  flushTable();
  flushMd();
  return blocks;
}

/** inline **bold** / `code` renderer for table cells */
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={key} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code key={key} className="rounded bg-mesh-dock px-1.5 py-0.5 font-mono text-[11.5px] text-[#d6d8dc]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

function MarkdownTable({ header, rows }: { header: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-mesh-line">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-mesh-line bg-mesh-panel-2/70">
            {header.map((cell, i) => (
              <th key={i} scope="col" className="px-3 py-2 text-left font-medium text-[#d6d8dc]">
                {renderInline(cell, `h-${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-mesh-line/50 last:border-0">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 align-top leading-relaxed text-[#c4c6ca]">
                  {renderInline(cell, `c-${ri}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- markdown component styling (dark meshwork prose) ---------- */

const MD_COMPONENTS = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mt-4 mb-1.5 text-[14px] font-semibold text-[#e5e6e8] first:mt-0">{children}</h3>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mt-4 mb-1.5 text-[14px] font-semibold text-[#e5e6e8] first:mt-0">{children}</h3>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="mt-3 mb-1 text-[13px] font-semibold text-[#d6d8dc] first:mt-0">{children}</h4>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="mt-3 mb-1 text-[13px] font-semibold text-[#d6d8dc] first:mt-0">{children}</h4>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="leading-relaxed text-[#d6d8dc]">{children}</p>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a href={href} className="text-mesh-blue underline underline-offset-2">
      {children}
    </a>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-mesh-line pl-3 text-mesh-quiet">{children}</blockquote>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc space-y-1 pl-5 marker:text-mesh-quiet">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal space-y-1 pl-5 marker:text-mesh-quiet">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed text-[#d6d8dc]">{children}</li>
  ),
  hr: () => <hr className="border-mesh-line" />,
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const text = String(children ?? "");
    /* fenced blocks (language- class or multiline) live inside <pre> styling */
    if (className?.includes("language-") || text.includes("\n")) {
      return <code className="font-mono text-[12px] text-[#d6d8dc]">{children}</code>;
    }
    return (
      <code className="rounded bg-mesh-dock px-1.5 py-0.5 font-mono text-[12px] text-[#d6d8dc]">
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="overflow-x-auto rounded-lg border border-mesh-line bg-mesh-dock p-3 font-mono text-[12px] leading-relaxed">
      {children}
    </pre>
  ),
};

export function AssistantMessage({ message }: { message: TaskMessageVM }) {
  const [copied, setCopied] = useState(false);
  const blocks = useMemo(() => splitBlocks(message.text), [message.text]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  return (
    <div className="group w-full text-[13.5px]">
      <div className="space-y-2.5">
        {blocks.map((block, i) =>
          block.type === "table" ? (
            <MarkdownTable key={i} header={block.header} rows={block.rows} />
          ) : (
            <Markdown key={i} components={MD_COMPONENTS}>
              {block.text}
            </Markdown>
          )
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy answer"}
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-md text-mesh-quiet transition-opacity hover:bg-mesh-panel-3 hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue",
            copied ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-mesh-green" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
        </button>
        <span className="text-[11px] text-mesh-quiet" title={message.createdAt}>
          {format(new Date(message.createdAt), "HH:mm")}
        </span>
      </div>
    </div>
  );
}
