import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { db } from '../lib/db';
import type { HelpArticle } from '../types';
import { ChevronLeft } from 'lucide-react';

export default function Help() {
  const articles = useLiveQuery(() => db.help_articles.orderBy('title').toArray(), []) ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = selectedId !== null
    ? articles.find((a) => a.id === selectedId) ?? null
    : null;

  if (articles.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold text-navy mb-4">Aide</h2>
        <p className="text-sm text-gray-500">
          Aucun article d'aide. Les articles sont créés dans la section Admin.
        </p>
      </div>
    );
  }

  if (selected) {
    return <ArticleDetail article={selected} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-navy mb-4">Aide</h2>
      <div className="space-y-2">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onClick={() => setSelectedId(article.id ?? null)}
          />
        ))}
      </div>
    </div>
  );
}

function ArticleCard({
  article,
  onClick,
}: {
  article: HelpArticle;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-pt-blue transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-navy">{article.title}</span>
        {article.category && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {article.category}
          </span>
        )}
      </div>
    </button>
  );
}

function ArticleDetail({
  article,
  onBack,
}: {
  article: HelpArticle;
  onBack: () => void;
}) {
  return (
    <div className="p-6 max-w-2xl">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-navy mb-4 transition-colors"
      >
        <ChevronLeft size={14} />
        Retour
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold text-navy">{article.title}</h2>
        {article.category && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {article.category}
          </span>
        )}
      </div>

      <div className="prose prose-sm max-w-none text-gray-700">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
        >
          {article.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
