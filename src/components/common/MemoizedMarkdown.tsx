import { marked } from "marked";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        components={{
          code(props) {
            const { children, className, node } = props;
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <SyntaxHighlighter
                style={{}}
                customStyle={{}}
                PreTag={Codeblock}
                language={match[1]}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className="prismjs-theme">{children}</code>
            );
          },
          table(props) {
            return (
              <div className="flex w-full overflow-auto rounded-md mb-4 border border-border">
                <table>{props.children}</table>
              </div>
            );
          },
        }}
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  },
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(({ content }: { content: string }) => {
  const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

  return blocks.map((block, index) => (
    <MemoizedMarkdownBlock content={block} key={`block_${index}`} />
  ));
});

type PreTagProps = {
  children: React.ReactNode;
};

const Codeblock = ({ children }: PreTagProps) => {
  return (
    <div className="prismjs-theme bg-muted p-2 rounded-md overflow-auto text-sm mb-4 w-full">
      {children}
    </div>
  );
};

MemoizedMarkdown.displayName = "MemoizedMarkdown";
