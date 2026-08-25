import vinext from "vinext";
import { defineConfig } from "vite";
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

export default defineConfig(
  async ({ command }) => {
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

    if (
      command === "build" ||
      isVercel
    ) {
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
  }
);