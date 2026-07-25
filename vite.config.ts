import vinext from "vinext";
import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";

const isCodexSeatbeltSandbox =
  process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: [
    "nodejs_compat",
  ],
};

export default defineConfig(async () => {
  const isVercel =
    process.env.VERCEL === "1";

  const serverConfig = {
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
  };

  if (isVercel) {
    return {
      server: serverConfig,

      plugins: [
        tailwindcss(),
        vinext(),
        nitro(),
      ],
    };
  }

  process.env.WRANGLER_WRITE_LOGS ??=
    "false";

  process.env.WRANGLER_LOG_PATH ??=
    ".wrangler/logs";

  process.env.MINIFLARE_REGISTRY_PATH ??=
    ".wrangler/registry";

  const { cloudflare } =
    await import(
      "@cloudflare/vite-plugin"
    );

  return {
    server: serverConfig,

    plugins: [
      vinext(),
      sites(),

      cloudflare({
        viteEnvironment: {
          name: "rsc",

          childEnvironments: [
            "ssr",
          ],
        },

        inspectorPort: false,

        config:
          localBindingConfig,
      }),
    ],
  };
});