import { build } from "esbuild";
build({
    entryPoints: ["src/index.ts"],
    outfile: "dist/mod.js",
    format: "cjs",
    platform: "neutral",
    target: "es2020",
    external: ["@hotbunny/hackhub-content-sdk"],
});
