import { defineConfig, presetIcons, presetUno } from "unocss";
import presetRemToPx from "@unocss/preset-rem-to-px";

export default defineConfig({
  presets: [
    presetUno(),
    presetRemToPx(),
    presetIcons(),
  ],
});
