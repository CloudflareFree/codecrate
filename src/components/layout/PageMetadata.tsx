import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { getToolById, toolRegistry } from "@/registry";
import { CATEGORY_LABELS, type Category } from "@toolbox/types/tool";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
const origin = "https://it-toolbox.137101.xyz";

export function PageMetadata() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  useEffect(() => {
    const tool = pathname.startsWith("/tool/")
      ? getToolById(decodeURIComponent(pathname.slice(6)))
      : undefined;
    const category = pathname.startsWith("/category/")
      ? CATEGORY_LABELS[pathname.slice(10) as Category]
      : undefined;
    const personal = pathname === "/favorites" || pathname === "/history";
    const known = pathname === "/" || Boolean(tool || category || personal);
    const title = tool
      ? `${tool.name} — IT Toolbox`
      : category
        ? `${category}工具 — IT Toolbox`
        : personal
          ? `${pathname === "/favorites" ? "我的收藏" : "最近使用"} — IT Toolbox`
          : `IT Toolbox — ${toolRegistry.length} 个开发者工具，一站搞定`;
    const description = tool
      ? tool.description
      : category
        ? `在线使用 IT Toolbox 的${category}工具，快速完成开发中的常见任务。`
        : `${toolRegistry.length} 个开发者工具，覆盖格式化、编解码、加密哈希、网络查询与 AI 增强。无需注册，即开即用。`;
    document.title = title;
    const canonical = `${origin}${pathname === "/" ? "/" : pathname.replace(/\/$/, "")}`;
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", canonical);
    for (const [selector, value] of [
      ['meta[name="description"]', description],
      [
        'meta[name="robots"]',
        personal || !known
          ? "noindex, follow"
          : "index, follow, max-image-preview:large",
      ],
      ['meta[property="og:title"]', title],
      ['meta[property="og:description"]', description],
      ['meta[property="og:url"]', canonical],
      ['meta[name="twitter:title"]', title],
      ['meta[name="twitter:description"]', description],
    ])
      document.querySelector(selector)?.setAttribute("content", value);
    const structured = document.getElementById("page-structured-data");
    if (structured)
      structured.textContent = JSON.stringify(
        tool
          ? {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: tool.name,
              description,
              url: canonical,
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any",
              isAccessibleForFree: true,
            }
          : {
              "@context": "https://schema.org",
              "@type": pathname === "/" ? "WebSite" : "CollectionPage",
              name: title,
              description,
              url: canonical,
            },
      );
    window.gtag?.("event", "page_view", {
      page_location: canonical,
      page_title: title,
    });
  }, [pathname]);
  return null;
}
