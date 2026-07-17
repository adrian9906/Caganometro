// @ts-nocheck
import type { Request } from "express";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { assertPoopCooldown, computeEvolution, medalForPosition, skinColorAtPoopCount } from "../lib/game.js";
import {
  addHistorial,
  createCharacter,
  findAccountById,
  getActiveCharacter,
  getCharactersByAccountId,
  getLeaderboard,
  resetCharacterProgress,
  setActiveCharacter,
  updateCharacter
} from "../lib/store.js";

type JwtPayload = {
  userId: number;
};

const createCharacterSchema = z.object({
  nombre: z.string().min(2).max(40),
  nickname: z.string().min(2).max(24),
  descripcion: z.string().min(6).max(220),
  habilidades: z.string().min(2).max(180),
  fortalezas: z.string().min(2).max(180),
  debilidades: z.string().min(2).max(180),
  edad: z.number().int().min(1).max(120),
  estatura: z.number().min(1).max(2.5),
  colorPelo: z.string().min(3).max(20),
  colorPiel: z.string().regex(/^#([0-9a-fA-F]{6})$/)
});

const selectCharacterSchema = z.object({
  characterId: z.number().int().positive()
});

const characterIdSchema = z.coerce.number().int().positive();

function getAccountIdFromRequest(req: Request) {
  const authHeader = req.header("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    const error = new Error("Falta el token.");
    (error as Error & { status?: number }).status = 401;
    throw error;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no esta configurado.");
  }

  const token = authHeader.replace("Bearer ", "");
  const decoded = jwt.verify(token, secret) as JwtPayload;
  return decoded.userId;
}

export const gameRouter = Router();

gameRouter.get("/bootstrap", async (req, res) => {
  const accountId = getAccountIdFromRequest(req);
  const account = await findAccountById(accountId);

  if (!account) {
    return res.status(404).json({ error: "Cuenta no encontrada." });
  }

  const personajes = await getCharactersByAccountId(accountId);
  const personajeActivo = await getActiveCharacter(accountId);

  return res.json({
    account: {
      id: account.id,
      username: account.username,
      activeCharacterId: account.activeCharacterId
    },
    personajes,
    personajeActivo
  });
});

gameRouter.post("/characters", async (req, res) => {
  const accountId = getAccountIdFromRequest(req);
  const payload = createCharacterSchema.parse(req.body);
  const personaje = await createCharacter(accountId, {
    nombre: payload.nombre,
    nickname: payload.nickname,
    descripcion: payload.descripcion,
    habilidades: payload.habilidades,
    fortalezas: payload.fortalezas,
    debilidades: payload.debilidades,
    edad: payload.edad,
    estatura: payload.estatura,
    colorPelo: payload.colorPelo,
    colorPiel: payload.colorPiel,
    colorActual: payload.colorPiel
  });

  await setActiveCharacter(accountId, personaje.id);
  const personajes = await getCharactersByAccountId(accountId);

  return res.status(201).json({
    personaje,
    personajes
  });
});

gameRouter.patch("/characters/:characterId", async (req, res) => {
  const accountId = getAccountIdFromRequest(req);
  const characterId = characterIdSchema.parse(req.params.characterId);
  const payload = createCharacterSchema.parse(req.body);
  const existing = await findCharacterById(characterId);

  if (!existing || existing.accountId !== accountId) {
    return res.status(404).json({ error: "Personaje no encontrado." });
  }

  const personaje = await updateCharacter(characterId, {
    nombre: payload.nombre,
    nickname: payload.nickname,
    descripcion: payload.descripcion,
    habilidades: payload.habilidades,
    fortalezas: payload.fortalezas,
    debilidades: payload.debilidades,
    edad: payload.edad,
    estatura: payload.estatura,
    colorPelo: payload.colorPelo,
    colorPiel: payload.colorPiel,
    colorActual: skinColorAtPoopCount(payload.colorPiel, existing.totalCacas)
  });
  const personajes = await getCharactersByAccountId(accountId);

  return res.json({ personaje, personajes });
});

gameRouter.post("/characters/select", async (req, res) => {
  const accountId = getAccountIdFromRequest(req);
  const payload = selectCharacterSchema.parse(req.body);
  const personaje = await setActiveCharacter(accountId, payload.characterId);

  if (!personaje) {
    return res.status(404).json({ error: "Personaje no encontrado." });
  }

  const personajes = await getCharactersByAccountId(accountId);

  return res.json({
    personajeActivo: personaje,
    personajes
  });
});

gameRouter.post("/poop", async (req, res) => {
  const accountId = getAccountIdFromRequest(req);
  const personaje = await getActiveCharacter(accountId);

  if (!personaje) {
    return res.status(400).json({ error: "Primero crea o selecciona un personaje." });
  }

  assertPoopCooldown(personaje);
  const evolution = computeEvolution(personaje);

  await addHistorial({
    personajeId: personaje.id,
    tamanoAntes: personaje.tamano,
    fuerzaAntes: personaje.fuerza,
    colorAntes: personaje.colorActual
  });

  const actualizado = await updateCharacter(personaje.id, {
    totalCacas: evolution.totalCacas,
    tamano: evolution.tamano,
    fuerza: evolution.fuerza,
    colorActual: evolution.colorActual,
    ultimaCaca: new Date().toISOString()
  });

  const ranking = await getLeaderboard(20);
  const posicion = ranking.findIndex((entry) => entry.id === actualizado.id) + 1;

  return res.json({
    personaje: actualizado,
    posicion,
    medalla: medalForPosition(posicion)
  });
});

gameRouter.post("/reset", async (req, res) => {
  const accountId = getAccountIdFromRequest(req);
  const personaje = await getActiveCharacter(accountId);

  if (!personaje) {
    return res.status(400).json({ error: "No hay personaje activo para resetear." });
  }

  const actualizado = await resetCharacterProgress(accountId, personaje.id);
  const ranking = await getLeaderboard(20);
  const posicion = ranking.findIndex((entry) => entry.id === actualizado.id) + 1;

  return res.json({
    personaje: actualizado,
    posicion,
    medalla: posicion > 0 ? medalForPosition(posicion) : null
  });
});
