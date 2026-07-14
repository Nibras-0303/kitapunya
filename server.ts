import express from "express";
import path from "path";
import dotenv from "dotenv";
import { apiRouter } from "./src/api/routes.js";
import { dbService } from "./src/services/db.js";

// Load environment variables
dotenv.config();

// Log environment status for debugging
console.log("=== ENV CHECK ===");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "DETECTED" : "NOT FOUND");
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "DETECTED" : "NOT FOUND");
console.log("VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL ? "DETECTED" : "NOT FOUND");
console.log("=================");

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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[REQUEST] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.query).length > 0) {
    console.log(`[QUERY]`, JSON.stringify(req.query));
  }
  if (req.body && Object.keys(req.body).length > 0) {
    const loggedBody = { ...req.body };
    if (loggedBody.password) loggedBody.password = "********";
    if (loggedBody.base64Image) loggedBody.base64Image = `base64_data_length_${loggedBody.base64Image.length}`;
    console.log(`[BODY]`, JSON.stringify(loggedBody));
  }
  next();
});

// Response-formatting middleware for all /api endpoints to enforce JSON and requested format
app.use("/api", (req, res, next) => {
  // Set JSON Content-Type always
  res.setHeader("Content-Type", "application/json");

  const originalJson = res.json;
  res.json = function (body) {
    let formattedBody = body;
    if (body && typeof body === "object") {
      const isError = res.statusCode >= 400 || body.error !== undefined || body.success === false;
      if (isError) {
        const errorMsg = body.error || body.message || "Ralat pelayan dalaman berlaku.";
        formattedBody = {
          success: false,
          error: errorMsg,
          message: errorMsg
        };
      } else {
        const hasSuccess = body.success !== undefined ? body.success : true;
        if (body.success !== undefined && body.data !== undefined) {
          // Already formatted
          formattedBody = body;
        } else {
          // Format it safely without mutating the original object in-place
          const cloned = { ...body };
          if ("success" in cloned) {
            delete (cloned as any).success;
          }
          formattedBody = {
            success: hasSuccess,
            data: cloned
          };
        }
      }
    }
    return originalJson.call(this, formattedBody);
  };
  next();
});

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.DATABASE_URL ? "production-db" : "demo-mode" });
});

// Mount the Express API Router
app.use("/api", apiRouter);

// Catch-all 404 for any unmatched /api routes (with or without trailing slashes or subpaths)
app.use("/api", (req, res) => {
  console.log(`[404] API Route Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: `Laluan ${req.method} ${req.originalUrl} tidak ditemui.`
  });
});

// Global error handler to catch any unhandled router exceptions and guarantee JSON response
app.use((err: any, req: any, res: any, next: any) => {
  console.error("[GLOBAL ERROR]", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Ralat pelayan dalaman berlaku."
  });
});

export default app;

async function startServer() {
  const PORT = 3000;

  // Serve static assets or configure Vite HMR
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
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
      if (req.path.startsWith("/api")) {
        return res.status(404).json({
          success: false,
          error: `Laluan ${req.method} ${req.originalUrl} tidak ditemui.`
        });
      }
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
