import { prisma } from "./prisma.js";

export type AccountRecord = {
  id: number;
  username: string;
  passwordHash: string;
  activeCharacterId: number | null;
  fechaCreacion: Date;
};

export type CharacterRecord = {
  id: number;
  accountId: number;
  nombre: string;
  nickname: string;
  descripcion: string;
  habilidades: string;
  fortalezas: string;
  debilidades: string;
  edad: number;
  estatura: number;
  colorPelo: string;
  colorPiel: string;
  colorActual: string;
  totalCacas: number;
  tamano: number;
  fuerza: number;
  ultimaCaca: Date | null;
  fechaCreacion: Date;
};

type NewCharacter = Omit<
  CharacterRecord,
  "id" | "accountId" | "fechaCreacion" | "ultimaCaca" | "totalCacas" | "tamano" | "fuerza"
>;

type CharacterPatch = Partial<
  Omit<CharacterRecord, "id" | "accountId" | "fechaCreacion">
>;

export function createAccount(username: string, passwordHash: string) {
  return prisma.account.create({
    data: { username, passwordHash }
  });
}

export function findAccountByUsername(username: string) {
  return prisma.account.findFirst({
    where: {
      username: { equals: username, mode: "insensitive" }
    }
  });
}

export function findAccountById(id: number) {
  return prisma.account.findUnique({ where: { id } });
}

export function createCharacter(accountId: number, data: NewCharacter) {
  return prisma.$transaction(async (tx) => {
    const character = await tx.character.create({
      data: { accountId, ...data }
    });

    await tx.account.updateMany({
      where: { id: accountId, activeCharacterId: null },
      data: { activeCharacterId: character.id }
    });

    return character;
  });
}

export function getCharactersByAccountId(accountId: number) {
  return prisma.character.findMany({
    where: { accountId },
    orderBy: { fechaCreacion: "asc" }
  });
}

export function findCharacterById(id: number) {
  return prisma.character.findUnique({ where: { id } });
}

export function updateCharacter(id: number, patch: CharacterPatch) {
  return prisma.character.update({
    where: { id },
    data: patch
  });
}

export async function setActiveCharacter(accountId: number, characterId: number) {
  const character = await prisma.character.findFirst({
    where: { id: characterId, accountId }
  });

  if (!character) {
    return null;
  }

  const updated = await prisma.account.updateMany({
    where: { id: accountId },
    data: { activeCharacterId: characterId }
  });

  return updated.count === 1 ? character : null;
}

export async function getActiveCharacter(accountId: number) {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { activeCharacterId: true }
  });

  if (!account?.activeCharacterId) {
    return null;
  }

  return prisma.character.findFirst({
    where: { id: account.activeCharacterId, accountId }
  });
}

export function addHistorial(entry: {
  personajeId: number;
  tamanoAntes: number;
  fuerzaAntes: number;
  colorAntes: string;
}) {
  return prisma.historialCaca.create({ data: entry });
}

export function getLeaderboard(limit = 20) {
  return prisma.character.findMany({
    orderBy: [
      { totalCacas: "desc" },
      { fuerza: "desc" },
      { fechaCreacion: "asc" }
    ],
    take: limit
  });
}

export async function resetCharacterProgress(accountId: number, characterId: number) {
  const current = await prisma.character.findFirst({
    where: { id: characterId, accountId },
    select: { colorPiel: true }
  });

  if (!current) {
    return null;
  }

  return prisma.character.update({
    where: { id: characterId },
    data: {
      totalCacas: 0,
      tamano: 1,
      fuerza: 5,
      colorActual: current.colorPiel,
      ultimaCaca: null
    }
  });
}
