import { defineConfig } from "vite";

// The web app lives in /web. We build into /docs so the site can be served
// directly by GitHub Pages (Settings → Pages → branch /docs).
// `base: "./"` keeps asset paths relative so it works from any sub-path.
export default defineConfig({
  root: "web",
  base: "./",
  server: {
    // Allow importing the engine source which lives outside the web/ root.
    fs: { allow: [".."] },
  },
  build: {
    outDir: "../docs",
    emptyOutDir: true,
  },
});
