import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Used for canonical + og:url. Change this when the demo domain is bought.
  site: "https://carolinaqualityair.xyz",

  vite: {
    plugins: [tailwindcss()],
  },

  build: {
    // One stylesheet, and the single interactive script inlines into the
    // HTML rather than becoming a network request.
    inlineStylesheets: "auto",
  },

  image: {
    // Sharp ships with Astro, so responsive AVIF/WebP costs no extra dependency.
    responsiveStyles: true,
  },
});
