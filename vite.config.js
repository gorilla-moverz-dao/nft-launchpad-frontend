import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    viteReact(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@initia/initia.js": resolve(__dirname, "./src/lib/initia-stub.ts"),
    },
  },

  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor dependencies into separate chunks
          "vendor-react": ["react", "react-dom"],
          "vendor-tanstack": ["@tanstack/react-query", "@tanstack/react-router", "@tanstack/react-form"],
          "vendor-utils": ["class-variance-authority", "clsx", "tailwind-merge", "zod"],
          "vendor-aptos": ["@aptos-labs/ts-sdk", "@aptos-labs/wallet-adapter-react", "@thalalabs/surf"],
        },
      },
    },
  },
});
