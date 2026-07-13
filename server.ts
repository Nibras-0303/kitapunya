import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./src/api/routes.js";
import { dbService } from "./src/services/db.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware for body parsing (handling large base64 scanned notes)
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Middleware to block until DB is initialized (useful if running in PostgreSQL mode)
app.use(async (req, res, next) => {
  try {
    await dbService.ensureInitialized();
  } catch (err) {
    console.error("Database initialization check failed in middleware:", err);
  }
  next();
});

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.DATABASE_URL ? "production-db" : "demo-mode" });
});

// Mount the Express API Router
app.use("/api", apiRouter);

export default app;

async function startServer() {
  const PORT = 3000;

  // Serve static assets or configure Vite HMR
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KitaPunya server running at http://localhost:${PORT}`);
  });
}

// Only start standalone listener if not in serverless Vercel environment
if (process.env.VERCEL !== "1") {
  startServer().catch((err) => {
    console.error("Critical: Failed to start KitaPunya server:", err);
  });
}
