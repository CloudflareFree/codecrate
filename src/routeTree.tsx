import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { HomePage } from "@/pages/HomePage";
import { ToolPage } from "@/pages/ToolPage";
import { FavoritesPage } from "@/pages/FavoritesPage";
import { CategoryPage } from "@/pages/CategoryPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { PageMetadata } from "@/components/layout/PageMetadata";

const rootRoute = createRootRoute({
  component: () => (
    <div className="flex h-dvh bg-bg-base overflow-hidden">
      <PageMetadata />
      <a href="#main-content" className="skip-link">
        跳到主要内容
      </a>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-0">
        <Header />
        <main
          id="main-content"
          tabIndex={-1}
          className="workspace-main flex-1 overflow-y-auto"
        >
          <Outlet />
        </main>
      </div>
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const toolRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tool/$id",
  component: ToolPage,
});

const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/favorites",
  component: FavoritesPage,
});

const categoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/category/$name",
  component: CategoryPage,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: HistoryPage,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  toolRoute,
  favoritesRoute,
  categoryRoute,
  historyRoute,
]);
