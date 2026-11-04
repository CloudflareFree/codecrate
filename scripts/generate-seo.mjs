import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import ts from "typescript";

const origin = "https://it-toolbox.137101.xyz";
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
async function loadTypescript(path) {
  let source = ts.transpileModule(await readFile(path, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText;
  source = source.replace(
    "from 'fuse.js'",
    `from '${import.meta.resolve("fuse.js")}'`,
  );
  return import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  );
}
const { toolRegistry } = await loadTypescript("src/registry.ts");
const { CATEGORY_LABELS, CATEGORY_ORDER } = await loadTypescript(
  "packages/types/tool.ts",
);
for (const tool of toolRegistry) await access(`src/tools/${tool.id}/index.tsx`);
const template = await readFile("dist/index.html", "utf8");
const link = (tool) =>
  `<a href="/tool/${escape(tool.id)}">${escape(tool.name)}</a>`;
const routes = [
  {
    path: "/",
    title: `IT Toolbox — ${toolRegistry.length} 个开发者工具，一站搞定`,
    description: `${toolRegistry.length} 个开发者工具，覆盖格式化、编解码、加密哈希、网络查询与 AI 增强。无需注册，即开即用。`,
    heading: "开发者工具箱：开发小事，一站搞定。",
    body: CATEGORY_ORDER.map(
      (category) =>
        `<section><h2><a href="/category/${category}">${escape(CATEGORY_LABELS[category])}</a></h2><ul>${toolRegistry
          .filter((tool) => tool.category === category)
          .map((tool) => `<li>${link(tool)} — ${escape(tool.description)}</li>`)
          .join("")}</ul></section>`,
    ).join(""),
  },
  ...CATEGORY_ORDER.map((category) => ({
    path: `/category/${category}`,
    title: `${CATEGORY_LABELS[category]}工具 — IT Toolbox`,
    heading: `${CATEGORY_LABELS[category]}工具`,
    description: `在线使用 IT Toolbox 的${CATEGORY_LABELS[category]}工具，快速完成开发中的常见任务。`,
    body: `<ul>${toolRegistry
      .filter((tool) => tool.category === category)
      .map((tool) => `<li>${link(tool)}<p>${escape(tool.description)}</p></li>`)
      .join("")}</ul>`,
  })),
  ...toolRegistry.map((tool) => ({
    path: `/tool/${tool.id}`,
    title: `${tool.name} — IT Toolbox`,
    heading: tool.name,
    description: tool.description,
    tool,
    body: `<p>此工具支持${escape(tool.description)}。启用 JavaScript 后，可使用完整的工具操作界面。</p><h2>同类工具</h2><ul>${toolRegistry
      .filter(
        (other) => other.category === tool.category && other.id !== tool.id,
      )
      .slice(0, 8)
      .map((other) => `<li>${link(other)}</li>`)
      .join(
        "",
      )}</ul><p><a href="/category/${tool.category}">浏览${escape(CATEGORY_LABELS[tool.category])}工具</a></p>`,
  })),
  ...["favorites", "history"].map((id) => ({
    path: `/${id}`,
    title: `${id === "favorites" ? "我的收藏" : "最近使用"} — IT Toolbox`,
    heading: id === "favorites" ? "我的收藏" : "最近使用",
    description: "保存在当前浏览器中的个人工具记录。",
    body: "<p>启用 JavaScript 后，可查看保存在当前浏览器中的工具记录。</p>",
    noindex: true,
  })),
];
await mkdir("dist/tool", { recursive: true });
await mkdir("dist/category", { recursive: true });
for (const route of routes) {
  const url = origin + route.path;
  let html = template
    .replace(/<title>.*?<\/title>/, `<title>${escape(route.title)}</title>`)
    .replace(
      /(<meta name="description" content=")[^"]*("\s*\/>)/,
      `$1${escape(route.description)}$2`,
    )
    .replace(/(<link rel="canonical" href=")[^"]*("\s*\/>)/, `$1${url}$2`);
  for (const property of ["og:title", "og:description", "og:url"]) {
    const value =
      property === "og:title"
        ? route.title
        : property === "og:description"
          ? route.description
          : url;
    html = html.replace(
      new RegExp(`(<meta property="${property}" content=")[^"]*("\\s*\\/>)`),
      `$1${escape(value)}$2`,
    );
  }
  for (const property of ["twitter:title", "twitter:description"])
    html = html.replace(
      new RegExp(`(<meta name="${property}" content=")[^"]*("\\s*\\/>)`),
      `$1${escape(property.endsWith("title") ? route.title : route.description)}$2`,
    );
  if (route.noindex)
    html = html.replace(
      'content="index, follow, max-image-preview:large"',
      'content="noindex, follow"',
    );
  const schema = route.tool
    ? {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: route.tool.name,
        description: route.description,
        url,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        isAccessibleForFree: true,
      }
    : {
        "@context": "https://schema.org",
        "@type": route.path === "/" ? "WebSite" : "CollectionPage",
        name: route.heading,
        description: route.description,
        url,
      };
  html = html.replace(
    "</head>",
    `<script id="page-structured-data" type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script></head>`,
  );
  const fallback = `<main class="seo-fallback" style="max-width:1040px;margin:40px auto;padding:24px;font-family:system-ui;line-height:1.8"><a href="/">IT Toolbox</a><h1>${escape(route.heading)}</h1><p>${escape(route.description)}</p>${route.body}<p>基于 <a href="https://github.com/Zoroaaa/it-toolbox">Zoroaaa/it-toolbox</a>，以 MIT 许可开源。</p></main>`;
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${fallback}</div>`,
  );
  await writeFile(
    route.path === "/" ? "dist/index.html" : `dist${route.path}.html`,
    html,
  );
}
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
    .filter((route) => !route.noindex)
    .map((route) => `  <url><loc>${origin}${route.path}</loc></url>`)
    .join("\n")}\n</urlset>\n`,
);
await writeFile(
  "dist/404.html",
  '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>页面不存在 — IT Toolbox</title><body style="font-family:system-ui;padding:10%;background:#f6f8fc;color:#18243c"><h1>这个页面不在工具箱里</h1><p>网址可能已经改变，试试从首页找到你需要的工具。</p><a href="/">返回 IT Toolbox</a></body></html>',
);
console.log(
  `SEO: ${toolRegistry.length} tools, ${CATEGORY_ORDER.length} categories; ${routes.filter((route) => !route.noindex).length} sitemap URLs. Build-time HTML includes the public tool inventory; React enhances it in the browser.`,
);
