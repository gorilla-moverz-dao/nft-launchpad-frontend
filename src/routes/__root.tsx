import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Toaster } from "sonner";
import Header from "../components/Header";

import TanstackQueryLayout from "../integrations/tanstack-query/layout";

import type { QueryClient } from "@tanstack/react-query";
import AnimatedGradientBackground from "@/components/AnimatedGradientBackground";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-4 relative z-10">
        <Outlet />
        <Toaster richColors position="bottom-right" />
      </div>
      <AnimatedGradientBackground />
      <TanStackRouterDevtools />

      <TanstackQueryLayout />
    </>
  ),
});
