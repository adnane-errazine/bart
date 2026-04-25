import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const root = process.cwd();
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = join(root, pathname);

  try {
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": mime[extname(filePath)] ?? "text/plain" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

try {
  const [html, css, js] = await Promise.all([
    fetch(`${base}/`).then((res) => {
      if (!res.ok) throw new Error(`HTML returned ${res.status}`);
      return res.text();
    }),
    fetch(`${base}/styles.css`).then((res) => {
      if (!res.ok) throw new Error(`CSS returned ${res.status}`);
      return res.text();
    }),
    fetch(`${base}/app.js`).then((res) => {
      if (!res.ok) throw new Error(`JS returned ${res.status}`);
      return res.text();
    }),
  ]);

  const assertions = [
    ["HTML marker", html.includes('data-testid="bart-vercel-smoke"')],
    ["Vercel copy", html.includes("Vercel hosting check")],
    ["CSS shell", css.includes(".shell")],
    ["JS browser check", js.includes("Browser check passed")],
  ];

  const failed = assertions.filter(([, ok]) => !ok);
  if (failed.length) {
    throw new Error(`Smoke test failed: ${failed.map(([name]) => name).join(", ")}`);
  }

  console.log(`OK static frontend smoke test passed at ${base}`);
} finally {
  server.close();
}
