import assert from "node:assert/strict";
import {
  spawn,
} from "node:child_process";
import {
  fileURLToPath,
} from "node:url";
import net from "node:net";
import test from "node:test";

function availablePort() {
  return new Promise(
    (resolve, reject) => {
      const server =
        net.createServer();

      server.once("error", reject);

      server.listen(
        0,
        "127.0.0.1",
        () => {
          const address =
            server.address();

          if (
            !address ||
            typeof address === "string"
          ) {
            server.close();

            reject(
              new Error(
                "Não foi possível definir a porta."
              )
            );

            return;
          }

          const { port } = address;

          server.close(error => {
            if (error) {
              reject(error);
              return;
            }

            resolve(port);
          });
        }
      );
    }
  );
}

async function waitForServer(
  url,
  serverProcess,
  serverOutput
) {
  const maximumAttempts = 60;

  for (
    let attempt = 0;
    attempt < maximumAttempts;
    attempt += 1
  ) {
    if (
      serverProcess.exitCode !== null
    ) {
      throw new Error(
        `O servidor encerrou antes de responder.\n${serverOutput()}`
      );
    }

    try {
      const response =
        await fetch(url, {
          headers: {
            accept: "text/html",
          },
        });

      if (response.status > 0) {
        return response;
      }
    } catch {
      // O servidor ainda está iniciando.
    }

    await new Promise(resolve => {
      setTimeout(resolve, 250);
    });
  }

  throw new Error(
    `O servidor não iniciou no tempo esperado.\n${serverOutput()}`
  );
}

test(
  "renderiza o HTML principal do FriBolos",
  async context => {
    const port =
      await availablePort();

    const serverPath =
      fileURLToPath(
        new URL(
          "../.output/server/index.mjs",
          import.meta.url
        )
      );

    let output = "";

    const serverProcess =
      spawn(
        process.execPath,
        [serverPath],
        {
          env: {
            ...process.env,
            HOST: "127.0.0.1",
            PORT: String(port),
            NODE_ENV: "production",
          },

          stdio: [
            "ignore",
            "pipe",
            "pipe",
          ],
        }
      );

    serverProcess.stdout.on(
      "data",
      chunk => {
        output += chunk.toString();
      }
    );

    serverProcess.stderr.on(
      "data",
      chunk => {
        output += chunk.toString();
      }
    );

    context.after(() => {
      if (
        serverProcess.exitCode === null
      ) {
        serverProcess.kill();
      }
    });

    const response =
      await waitForServer(
        `http://127.0.0.1:${port}/`,
        serverProcess,
        () => output
      );

    assert.equal(
      response.status,
      200
    );

    assert.match(
      response.headers.get(
        "content-type"
      ) ?? "",
      /^text\/html\b/i
    );

    const html =
      await response.text();

    assert.match(
      html,
      /<title>FriBolos<\/title>/i
    );

    assert.match(
      html,
      /FRIBOLOS/i
    );
  }
);