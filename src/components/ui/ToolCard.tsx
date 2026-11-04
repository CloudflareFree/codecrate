import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Star } from "lucide-react";
import type { ToolMeta } from "@toolbox/types/tool";
import { useAppStore } from "@/store/app";
import { getIconComponent } from "@/utils/icons";
import { usePreloadTool } from "@/hooks/usePreloadTool";

export function ToolCard({ tool }: { tool: ToolMeta }) {
  const { t, i18n } = useTranslation();
  const en = i18n.language.startsWith("en");
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const favorited = useAppStore((s) => s.favorites.includes(tool.id));
  const Icon = getIconComponent(tool.icon);
  const { preload } = usePreloadTool(tool.id);
  return (
    <article
      className={`tool-card tone-${tool.category}`}
      onMouseEnter={preload}
    >
      <div className="tool-card-top">
        <span className="tool-icon">
          {Icon && <Icon size={22} strokeWidth={1.8} />}
        </span>
        <button
          className={`favorite-button ${favorited ? "is-favorite" : ""}`}
          onClick={() => toggleFavorite(tool.id)}
          aria-label={`${favorited ? (en ? "Unfavorite" : "取消收藏") : en ? "Favorite" : "收藏"} ${en ? tool.nameEn : tool.name}`}
          aria-pressed={favorited}
        >
          <Star size={17} fill={favorited ? "currentColor" : "none"} />
        </button>
      </div>
      <Link
        to="/tool/$id"
        params={{ id: tool.id }}
        onFocus={preload}
        className="tool-card-link"
      >
        <h3>
          {en ? tool.nameEn : tool.name}
          <ArrowUpRight size={17} />
        </h3>
        <p>{tool.description}</p>
      </Link>
      <div className="tool-card-bottom">
        <span>{t(`categories.${tool.category}`)}</span>
        <span className={tool.requiresApi ? "mode-network" : "mode-local"}>
          <i />
          {tool.requiresApi
            ? en
              ? "Online"
              : "联网工具"
            : en
              ? "In your browser"
              : "浏览器运行"}
        </span>
      </div>
    </article>
  );
}
