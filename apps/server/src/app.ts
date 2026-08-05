// @ts-nocheck
import "dotenv/config";
import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { authRouter } from "./routes/auth.js";
import { gameRouter } from "./routes/game.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { prisma } from "./lib/prisma.js";

export const app = express();

const allowedOrigins = (
  process.env.CLIENT_ORIGINS ??
  process.env.CLIENT_ORIGIN ??
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400
  })
);
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: "connected" });
  } catch {
    res.status(503).json({ ok: false, database: "disconnected" });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/game", gameRouter);
app.use("/api/leaderboard", leaderboardRouter);

app.use(notFoundHandler);
app.use((error: unknown, _req, _res, next) => {
  if (error instanceof ZodError) {
    const zodError = new Error(error.issues[0]?.message ?? "Datos invalidos.");
    (zodError as Error & { status?: number }).status = 400;
    return next(zodError);
  }

  return next(error);
});
app.use(errorHandler);
