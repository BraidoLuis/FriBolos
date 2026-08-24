import vinext from "vinext";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";

const isCodexSeatbeltSandbox =
  process.env.CODEX_SANDBOX === "seatbelt";

export default defineConfig({
  server: {
    host: "0.0.0.0",

    allowedHosts: [
      "terminal.local",
    ],

    ...(isCodexSeatbeltSandbox
      ? {
          watch: {
            useFsEvents: false,
            usePolling: true,
          },
        }
      : {}),
  },

  plugins: [
    tailwindcss(),
    vinext(),
    nitro(),
  ],
});