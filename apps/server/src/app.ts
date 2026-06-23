// @ts-nocheck
import "dotenv/config";
import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { authRouter } from "./routes/auth.js";
import { gameRouter } from "./routes/game.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

export const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
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
