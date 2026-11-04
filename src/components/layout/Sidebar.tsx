import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  Boxes,
  Clock3,
  Code2,
  LayoutGrid,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { CATEGORY_ICONS, CATEGORY_ORDER } from "@toolbox/types/tool";
import { toolRegistry } from "@/registry";
import { getIconComponent } from "@/utils/icons";
import { useAppStore } from "@/store/app";
import { useDialogFocus } from "@/hooks/useDialogFocus";

export function Sidebar() {
  const { t, i18n } = useTranslation();
  const en = i18n.language.startsWith("en");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { favorites, mobileMenuOpen, setMobileMenuOpen } = useAppStore();
  const close = () => setMobileMenuOpen(false);
  const dialogRef = useDialogFocus<HTMLElement>(mobileMenuOpen, close);
  const contents = (
    <>
      <div className="sidebar-brand">
        <Link to="/" onClick={close}>
          <span className="brand-mark">
            <Boxes size={23} />
          </span>
          <span>
            <strong>
              IT Toolbox<span>.</span>
            </strong>
            <small>MADE FOR DEVELOPERS</small>
          </span>
        </Link>
        <button
          className="lg:hidden sidebar-close"
          onClick={close}
          aria-label={en ? "Close menu" : "关闭菜单"}
        >
          <X size={20} />
        </button>
      </div>
      <nav
        className="sidebar-nav"
        aria-label={en ? "Main navigation" : "主导航"}
      >
        <p className="sidebar-section-label">
          {en ? "WORKSPACE" : "我的工作台"}
        </p>
        <Link
          to="/"
          onClick={close}
          className={`sidebar-nav-item ${pathname === "/" ? "active" : ""}`}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <LayoutGrid size={18} />
          <span>{t("sidebar.allTools")}</span>
          <small>{toolRegistry.length}</small>
        </Link>
        <Link
          to="/favorites"
          onClick={close}
          className={`sidebar-nav-item ${pathname === "/favorites" ? "active" : ""}`}
          aria-current={pathname === "/favorites" ? "page" : undefined}
        >
          <Star size={18} />
          <span>{t("sidebar.favorites")}</span>
          {favorites.length > 0 && <small>{favorites.length}</small>}
        </Link>
        <Link
          to="/history"
          onClick={close}
          className={`sidebar-nav-item ${pathname === "/history" ? "active" : ""}`}
          aria-current={pathname === "/history" ? "page" : undefined}
        >
          <Clock3 size={18} />
          <span>{t("sidebar.recent")}</span>
        </Link>
        <p className="sidebar-section-label categories-label">
          {en ? "TOOL CATEGORIES" : "工具分类"}
        </p>
        {CATEGORY_ORDER.map((cat) => {
          const Icon = getIconComponent(CATEGORY_ICONS[cat]);
          const active = pathname === `/category/${cat}`;
          return (
            <Link
              key={cat}
              to="/category/$name"
              params={{ name: cat }}
              onClick={close}
              className={`sidebar-nav-item ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {Icon && <Icon size={18} />}
              <span>{t(`categories.${cat}`)}</span>
              <small>
                {toolRegistry.filter((tool) => tool.category === cat).length}
              </small>
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-tip">
          <ShieldCheck size={18} />
          <strong>
            {en ? "Your work stays yours." : "安心处理，专注创造。"}
          </strong>
          <p>
            {en
              ? "Most tools run locally. Network & AI tools connect when needed."
              : "多数工具在本地运行，网络与 AI 工具按需联网。"}
          </p>
        </div>
        <a
          className="sidebar-source"
          href="https://github.com/CloudflareFree/it-toolbox"
          target="_blank"
          rel="noreferrer"
        >
          <Code2 size={17} />
          <span>{en ? "Open source on GitHub" : "在 GitHub 查看源码"}</span>
          <ArrowUpRight size={14} />
        </a>
        <span className="sidebar-version">
          <span />
          v1.0 <i>·</i> {en ? "Keep building." : "为每一位开发者而造"}
        </span>
      </div>
    </>
  );
  return (
    <>
      <aside className="workspace-sidebar hidden lg:flex">{contents}</aside>
      {mobileMenuOpen && (
        <div className="mobile-sidebar lg:hidden">
          <div className="sidebar-backdrop" onClick={close} />
          <aside
            className="workspace-sidebar"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={en ? "Navigation menu" : "导航菜单"}
          >
            {contents}
          </aside>
        </div>
      )}
    </>
  );
}
