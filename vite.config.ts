import { URL, fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import Vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import UnoCSS from "unocss/vite";
import Legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  base: "/sticker",
  plugins: [
    Vue(),
    AutoImport({
      imports: [
        "vue",
        "@vueuse/core",
      ],
      resolvers: [ElementPlusResolver()],
      dts: "src/auto-imports.d.ts",
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: "src/components.d.ts",
    }),
    UnoCSS(),
    Legacy({
      targets: ["defaults", "IE 11"],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
