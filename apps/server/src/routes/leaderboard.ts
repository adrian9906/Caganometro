// @ts-nocheck
import { Router } from "express";
import { medalForPosition } from "../lib/game.js";
import { getLeaderboard } from "../lib/store.js";

export const leaderboardRouter = Router();

leaderboardRouter.get("/", async (_req, res) => {
  const personajes = await getLeaderboard(20);

  return res.json({
    jugadores: personajes.map((personaje, index) => ({
      id: personaje.id,
      nombre: personaje.nombre,
      totalCacas: personaje.totalCacas,
      fuerza: personaje.fuerza,
      tamano: personaje.tamano,
      colorActual: personaje.colorActual,
      posicion: index + 1,
      medalla: medalForPosition(index + 1)
    }))
  });
});
