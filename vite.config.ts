/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: { "@": path.resolve(import.meta.dirname, "src") },
    },
    // The launch race fix (r145). Vite optimizes dependencies asynchronously
    // some time AFTER the server starts listening; a browser that connects in
    // that window (Launch.bat opens one the moment the port answers) can beat
    // the optimizer, and on a slow machine the page then stalls on stale dep
    // URLs — a permanently blank editor (Zeis's grey screen, twice). Two
    // belts:
    //   1. every runtime dependency is declared here, so the startup scan
    //      never misses one for the browser to discover mid-session (the
    //      documented mitigation for the mid-session re-optimize race), and
    //   2. the dev script runs `vite optimize` to completion BEFORE `vite`
    //      starts listening (see package.json), so a browser cannot connect
    //      until the deps are bundled — the window is closed by construction.
    // A new dependency imported only dynamically must be added to this list.
    optimizeDeps: {
        include: [
            "react",
            "react-dom",
            "react-dom/client",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "@xyflow/react",
            "zustand",
            "immer",
            "zod",
            "nanoid",
            "clsx",
            "jszip",
            "prismjs",
            "prettier/standalone",
            "prettier/plugins/html",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-dialog",
            "@radix-ui/react-popover",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
        ],
    },
    server: {
        host: "0.0.0.0",
        port: 5173,
        strictPort: false,
        allowedHosts: true,
    },
    preview: {
        host: "0.0.0.0",
        port: 4173,
        allowedHosts: true,
    },
    build: {
        target: "es2022",
        sourcemap: true,
        // A single-bundle desktop-class editor: React + React Flow + Radix come to
        // ~670 kB (~205 kB gzipped), loaded once from the user's own machine, so
        // code-splitting would buy nothing but a warning here.
        chunkSizeWarningLimit: 1000,
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./vitest.setup.ts"],
        include: ["src/**/*.test.{ts,tsx}"],
        css: false,
    },
});
