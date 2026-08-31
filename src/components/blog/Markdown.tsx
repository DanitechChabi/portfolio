import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Rendu Markdown (GFM) avec la typographie du thème (voir .prose-site). */
export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-site">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
