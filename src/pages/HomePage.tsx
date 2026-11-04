import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowDown,
  ArrowRight,
  Braces,
  Check,
  Code2,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { toolRegistry, searchTools, getToolsByCategory } from "@/registry";
import {
  CATEGORY_ORDER,
  CATEGORY_ICONS,
  type Category,
} from "@toolbox/types/tool";
import { getIconComponent } from "@/utils/icons";
import { ToolCard } from "@/components/ui/ToolCard";
import { useAppStore } from "@/store/app";

const popularIds = [
  "json-formatter",
  "base64",
  "timestamp",
  "uuid-generator",
  "hash-calculator",
  "regex-tester",
  "url-encode",
  "color-picker",
];

export function HomePage() {
  const { t, i18n } = useTranslation();
  const en = i18n.language.startsWith("en");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState<Category | "all">("all");
  const [showAll, setShowAll] = useState(false);
  const recentIds = useAppStore((s) => s.recentTools);
  const popular = popularIds.flatMap(
    (id) => toolRegistry.find((tool) => tool.id === id) ?? [],
  );
  const recent = recentIds
    .slice(0, 3)
    .flatMap((id) => toolRegistry.find((tool) => tool.id === id) ?? []);
  const results = useMemo(() => {
    const found = deferredQuery.trim()
      ? searchTools(deferredQuery)
      : toolRegistry;
    return category === "all"
      ? found
      : found.filter((tool) => tool.category === category);
  }, [deferredQuery, category]);
  const filtered = Boolean(query.trim()) || category !== "all" || showAll;
  const displayed = filtered ? results : popular;
  const browse = () => {
    setShowAll(true);
    document
      .getElementById("discover-tools")
      ?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    document.getElementById("tool-search")?.focus({ preventScroll: true });
  };
  return (
    <div className="workspace-home">
      <div className="workspace-intro">
        <div>
          <p className="eyebrow">YOUR EVERYDAY DEV COMPANION</p>
          <p className="workspace-greeting">
            {en
              ? "A little less busywork. A lot more building."
              : "少一点重复，多一点创造。"}
          </p>
        </div>
        <span className="workspace-badge">
          <span />
          {en ? "Free & open source" : "免费使用 · 开源共建"}
        </span>
      </div>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <span className="hero-label">
            <Zap size={13} />
            {en ? "SMALL TOOLS. BIG POSSIBILITIES." : "小工具，大效率"}
          </span>
          <h1 id="home-title">
            {en ? (
              <>
                Your next great idea.
                <br />
                <span>Less busywork away.</span>
              </>
            ) : (
              <>
                开发小事，
                <br />
                <span>一站搞定。</span>
              </>
            )}
          </h1>
          <p className="hero-description">
            {en
              ? `${toolRegistry.length} useful tools for the things between your lines of code. Format, convert, debug — and get back to creating.`
              : `${toolRegistry.length} 个趁手工具，接住开发中的每一件小事。格式化、编解码、调试与转换，让思路不被打断。`}
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={browse}>
              {en ? "Explore the toolbox" : "探索全部工具"}
              <ArrowRight size={16} />
            </button>
            <span>
              <ShieldCheck size={15} />
              {en ? "No account needed" : "无需注册，即开即用"}
            </span>
          </div>
          <div className="hero-stats">
            <span>
              <strong>{toolRegistry.length}</strong>
              {en ? "useful tools" : "实用工具"}
            </span>
            <i />
            <span>
              <strong>{CATEGORY_ORDER.length}</strong>
              {en ? "categories" : "工具分类"}
            </span>
            <i />
            <span>
              <strong>MIT</strong>
              {en ? "open source" : "开源许可"}
            </span>
          </div>
        </div>
        <div
          className="hero-preview"
          aria-label={en ? "JSON formatter preview" : "JSON 格式化预览"}
        >
          <div className="preview-window">
            <div className="preview-toolbar">
              <div className="window-dots">
                <i />
                <i />
                <i />
              </div>
              <span>
                <Braces size={13} />
                hello-world.json
              </span>
              <Code2 size={14} />
            </div>
            <div className="preview-code">
              <div className="code-numbers">
                1<br />2<br />3<br />4<br />5<br />6<br />7
              </div>
              <pre>
                <span>{"{"}</span>
                {"\n"} <b>"name"</b>: <em>"IT Toolbox"</em>,{"\n"}{" "}
                <b>"tools"</b>:{" "}
                <span className="code-number">{toolRegistry.length}</span>,
                {"\n"} <b>"madeFor"</b>: <em>"developers"</em>,{"\n"}{" "}
                <b>"lessBusywork"</b>: <span className="code-bool">true</span>,
                {"\n"} <b>"moreCreating"</b>:{" "}
                <span className="code-bool">true</span>
                {"\n"}
                <span>{"}"}</span>
              </pre>
            </div>
            <div className="preview-status">
              <span>
                <span />
                JSON
              </span>
              <span>UTF-8 · 2 spaces</span>
              <span>
                <Check size={12} />
                {en ? "Looking good" : "格式正确"}
              </span>
            </div>
          </div>
          <Link
            to="/tool/$id"
            params={{ id: "json-formatter" }}
            className="preview-floating"
          >
            <div>
              <Braces size={20} />
            </div>
            <span>
              <strong>
                {en ? "A little order. Instantly." : "把杂乱，一键理顺。"}
              </strong>
              <small>{en ? "Try JSON Formatter" : "试试 JSON 格式化"}</small>
            </span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      {recent.length > 0 && (
        <section
          className="recent-strip"
          aria-label={en ? "Recently used" : "最近使用"}
        >
          <span>{en ? "Pick up where you left off" : "继续上次的工作"}</span>
          {recent.map((tool) => (
            <Link key={tool.id} to="/tool/$id" params={{ id: tool.id }}>
              {en ? tool.nameEn : tool.name}
              <ArrowRight size={12} />
            </Link>
          ))}
        </section>
      )}
      <section
        id="discover-tools"
        className="discover-section"
        aria-labelledby="discover-title"
      >
        <div className="section-heading">
          <div>
            <span className="section-kicker">
              <Sparkles size={14} />
              {en ? "THE RIGHT TOOL, RIGHT HERE" : "找到你的得力助手"}
            </span>
            <h2 id="discover-title">
              {query.trim()
                ? en
                  ? "Search results"
                  : "搜索结果"
                : category !== "all"
                  ? t(`categories.${category}`)
                  : showAll
                    ? en
                      ? "All tools"
                      : "全部工具"
                    : en
                      ? "Everyday essentials"
                      : "常用工具"}
            </h2>
          </div>
          <button className="text-action" onClick={() => setShowAll((s) => !s)}>
            {showAll
              ? en
                ? "Show essentials"
                : "查看常用"
              : en
                ? `View all ${toolRegistry.length} tools`
                : `查看全部 ${toolRegistry.length} 个工具`}
            <ArrowRight size={15} />
          </button>
        </div>
        <div className="home-search">
          <Search size={19} />
          <label className="sr-only" htmlFor="tool-search">
            {en ? "Search tools" : "搜索工具"}
          </label>
          <input
            id="tool-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              en
                ? "What are you working on? Try JSON, Base64, UUID…"
                : "今天需要什么工具？搜索 JSON、Base64、时间戳…"
            }
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              aria-label={en ? "Clear search" : "清空搜索"}
            >
              <X size={17} />
            </button>
          ) : (
            <kbd className="hidden sm:block">⌘ K</kbd>
          )}
        </div>
        <div
          className="category-filters"
          aria-label={en ? "Filter tools by category" : "按分类筛选工具"}
        >
          <button
            aria-pressed={category === "all"}
            className={category === "all" ? "active" : ""}
            onClick={() => setCategory("all")}
          >
            {en ? "All categories" : "全部分类"}
          </button>
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              aria-pressed={category === cat}
              className={category === cat ? "active" : ""}
              onClick={() => setCategory(cat)}
            >
              {t(`categories.${cat}`)}
            </button>
          ))}
        </div>
        <div aria-live="polite" className="sr-only">
          {displayed.length} {en ? "tools" : "个工具"}
        </div>
        {displayed.length ? (
          <div className="tools-grid">
            {displayed.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="empty-search">
            <Search size={30} />
            <h3>{en ? "No tools found" : "暂时没有找到相关工具"}</h3>
            <p>
              {en
                ? "Try another keyword or choose a different category."
                : "换个关键词，或试试其他分类。"}
            </p>
            <button
              className="btn-secondary"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
            >
              {en ? "Reset filters" : "重置筛选"}
            </button>
          </div>
        )}
        {!filtered && (
          <button className="browse-more" onClick={browse}>
            {en ? "There’s more in your toolbox" : "工具箱里，还有更多可能"}
            <ArrowDown size={15} />
          </button>
        )}
      </section>
      <section className="category-directory" aria-labelledby="category-title">
        <div className="section-heading">
          <div>
            <span className="section-kicker">A PLACE FOR EVERYTHING</span>
            <h2 id="category-title">
              {en ? "Explore by category" : "按场景，找工具"}
            </h2>
          </div>
          <span className="text-sm text-text-secondary">
            {CATEGORY_ORDER.length}{" "}
            {en ? "categories, neatly organized" : "个分类，井井有条"}
          </span>
        </div>
        <div className="category-directory-grid">
          {CATEGORY_ORDER.map((cat) => {
            const Icon = getIconComponent(CATEGORY_ICONS[cat]);
            return (
              <Link
                key={cat}
                to="/category/$name"
                params={{ name: cat }}
                className={`category-directory-item tone-${cat}`}
              >
                <span className="tool-icon">{Icon && <Icon size={20} />}</span>
                <span>
                  <strong>{t(`categories.${cat}`)}</strong>
                  <small>
                    {getToolsByCategory(cat).length} {en ? "tools" : "个工具"}
                  </small>
                </span>
                <ArrowRight size={15} />
              </Link>
            );
          })}
        </div>
      </section>
      <footer className="workspace-footer">
        <span>
          IT Toolbox <i>·</i>{" "}
          {en ? "Built for your flow." : "让开发，顺手一点。"}
        </span>
        <a
          href="https://github.com/Zoroaaa/it-toolbox"
          target="_blank"
          rel="noreferrer"
        >
          {en
            ? "Based on Zoroaaa/it-toolbox · MIT"
            : "基于 Zoroaaa/it-toolbox · MIT 开源"}
        </a>
      </footer>
    </div>
  );
}
