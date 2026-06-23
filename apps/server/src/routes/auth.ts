// @ts-nocheck
import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { createAccount, findAccountByUsername } from "../lib/store.js";

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(100)
});

const loginSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(100)
});

export const authRouter = Router();

function signToken(accountId: number) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET no esta configurado.");
  }

  return jwt.sign({ userId: accountId }, secret, { expiresIn: "7d" });
}

authRouter.post("/register", async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const existing = await findAccountByUsername(payload.username);

  if (existing) {
    return res.status(409).json({ error: "Ese usuario ya existe." });
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const account = await createAccount(payload.username, passwordHash);
  const token = signToken(account.id);

  return res.status(201).json({
    token,
    account: {
      id: account.id,
      username: account.username,
      activeCharacterId: account.activeCharacterId
    }
  });
});

authRouter.post("/login", async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const account = await findAccountByUsername(payload.username);

  if (!account) {
    return res.status(401).json({ error: "Credenciales invalidas." });
  }

  const isValid = await bcrypt.compare(payload.password, account.passwordHash);

  if (!isValid) {
    return res.status(401).json({ error: "Credenciales invalidas." });
  }

  const token = signToken(account.id);

  return res.json({
    token,
    account: {
      id: account.id,
      username: account.username,
      activeCharacterId: account.activeCharacterId
    }
  });
});

