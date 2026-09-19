import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

/**
 * Creates and configures the Express application.
 * Exported separately from the server listen call so it can be tested in isolation.
 */
export function createApp(): express.Application {
  const app = express();

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, 
    legacyHeaders: false, 
  });

  app.use(limiter);
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return app;
}
