import { useState, useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Search, Command, Menu, ChevronRight, Code2 } from "lucide-react";
import {
  Command as Cmd,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "cmdk";
import { searchTools } from "@/registry";
import type { ToolMeta } from "@toolbox/types/tool";
import { getIconComponent } from "@/utils/icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useAppStore } from "@/store/app";
import { useDialogFocus } from "@/hooks/useDialogFocus";

export function Header() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { toggleMobileMenu, mobileMenuOpen } = useAppStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const en = i18n.language.startsWith("en");
  const dialogRef = useDialogFocus<HTMLDivElement>(open, () =>
    handleOpenChange(false),
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery("");
  };

  const handleSelect = (tool: ToolMeta) => {
    handleOpenChange(false);
    navigate({ to: "/tool/$id", params: { id: tool.id } });
  };

  return (
    <>
      <header className="workspace-header">
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden header-icon"
          aria-label={t("header.openMenu")}
          aria-expanded={mobileMenuOpen}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="header-breadcrumb">
          <span>{en ? "Workspace" : "工作空间"}</span>
          <ChevronRight size={13} />
          <strong>
            {pathname === "/favorites"
              ? t("sidebar.favorites")
              : pathname === "/history"
                ? t("sidebar.recent")
                : pathname.startsWith("/tool/")
                  ? en
                    ? "Tool workspace"
                    : "工具工作区"
                  : t("sidebar.allTools")}
          </strong>
        </div>
        <button onClick={() => setOpen(true)} className="header-search">
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left truncate">
            {t("app.searchPlaceholder")}
          </span>
          <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-bg-overlay text-xs font-mono">
            <Command className="w-3 h-3" />K
          </kbd>
        </button>

        <div className="header-actions">
          <a
            href="https://github.com/CloudflareFree/it-toolbox"
            target="_blank"
            rel="noopener noreferrer"
            className="header-icon"
            aria-label={t("header.github")}
          >
            <Code2 size={19} />
          </a>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="fixed inset-0 bg-bg-base/60 backdrop-blur-sm"
            onClick={() => handleOpenChange(false)}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("search.placeholder")}
            className="relative w-full max-w-lg bg-bg-surface border border-border-strong rounded-xl shadow-theme-lg overflow-hidden animate-slide-up"
          >
            <Cmd
              shouldFilter={false}
              className="[&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-border-base"
              label="Search tools"
            >
              <div className="flex items-center gap-2 px-4 py-3">
                <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
                <CommandInput
                  placeholder={t("search.placeholder")}
                  className="flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none text-sm"
                  aria-label={t("search.placeholder")}
                  value={query}
                  onValueChange={setQuery}
                />
              </div>
              <CommandList className="max-h-80 overflow-y-auto p-2">
                <CommandEmpty className="py-8 text-center text-text-muted text-sm">
                  {t("search.noResults")}
                </CommandEmpty>
                <SearchResults query={query} onSelect={handleSelect} />
              </CommandList>
            </Cmd>
            <div className="px-4 py-2 border-t border-border-base flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <kbd className="font-mono">↑↓</kbd>{" "}
                {t("search.shortcuts.navigate")}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="font-mono">↵</kbd> {t("search.shortcuts.open")}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="font-mono">Esc</kbd>{" "}
                {t("search.shortcuts.close")}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SearchResults({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (t: ToolMeta) => void;
}) {
  const { t } = useTranslation();
  const results = searchTools(query);

  const grouped = results.reduce<Record<string, ToolMeta[]>>((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(grouped).map(([cat, tools]) => (
        <CommandGroup
          key={cat}
          heading={t(`categories.${cat}`)}
          className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
        >
          {tools.map((tool) => {
            const IconComp = getIconComponent(tool.icon);
            return (
              <CommandItem
                key={tool.id}
                value={tool.id}
                onSelect={() => onSelect(tool)}
                className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer
                           text-text-secondary hover:text-text-primary
                           aria-selected:bg-accent/10 aria-selected:text-accent
                           transition-colors duration-100"
              >
                {IconComp && <IconComp className="w-4 h-4 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{tool.name}</span>
                  <p className="text-xs text-text-muted truncate">
                    {tool.description}
                  </p>
                </div>
                {tool.isNew && (
                  <span className="badge text-xs">{t("toolCard.new")}</span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
      ))}
    </>
  );
}
