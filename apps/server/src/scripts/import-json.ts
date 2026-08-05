import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/prisma.js";

type JsonStore = {
  accounts: Array<{
    id: number;
    username: string;
    passwordHash: string;
    activeCharacterId: number | null;
    fechaCreacion: string;
  }>;
  characters: Array<{
    id: number;
    accountId: number;
    nombre: string;
    nickname?: string;
    descripcion?: string;
    habilidades?: string;
    fortalezas?: string;
    debilidades?: string;
    edad: number;
    estatura: number;
    colorPelo: string;
    colorPiel: string;
    colorActual: string;
    totalCacas: number;
    tamano: number;
    fuerza: number;
    ultimaCaca: string | null;
    fechaCreacion: string;
  }>;
  historialCacas: Array<{
    id: number;
    personajeId: number;
    fechaHora: string;
    tamanoAntes: number;
    fuerzaAntes: number;
    colorAntes: string;
  }>;
};

const sourcePath = path.resolve(
  process.cwd(),
  process.argv[2] ?? "data/caganometro.json"
);

async function importJson() {
  const source = JSON.parse(await readFile(sourcePath, "utf8")) as JsonStore;

  if (!Array.isArray(source.accounts) || !Array.isArray(source.characters) || !Array.isArray(source.historialCacas)) {
    throw new Error("El JSON no tiene el formato esperado del Caganometro.");
  }

  const [accountCount, characterCount, historyCount] = await Promise.all([
    prisma.account.count(),
    prisma.character.count(),
    prisma.historialCaca.count()
  ]);

  if (accountCount || characterCount || historyCount) {
    throw new Error(
      `La base de datos no esta vacia (cuentas=${accountCount}, personajes=${characterCount}, historial=${historyCount}). Importacion cancelada para no sobrescribir datos.`
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.account.createMany({
      data: source.accounts.map((account) => ({
        id: account.id,
        username: account.username,
        passwordHash: account.passwordHash,
        activeCharacterId: null,
        fechaCreacion: new Date(account.fechaCreacion)
      }))
    });

    await tx.character.createMany({
      data: source.characters.map((character) => ({
        id: character.id,
        accountId: character.accountId,
        nombre: character.nombre,
        nickname: character.nickname ?? character.nombre,
        descripcion: character.descripcion ?? "",
        habilidades: character.habilidades ?? "",
        fortalezas: character.fortalezas ?? "",
        debilidades: character.debilidades ?? "",
        edad: character.edad,
        estatura: character.estatura,
        colorPelo: character.colorPelo,
        colorPiel: character.colorPiel,
        colorActual: character.colorActual,
        totalCacas: character.totalCacas,
        tamano: character.tamano,
        fuerza: character.fuerza,
        ultimaCaca: character.ultimaCaca ? new Date(character.ultimaCaca) : null,
        fechaCreacion: new Date(character.fechaCreacion)
      }))
    });

    await tx.historialCaca.createMany({
      data: source.historialCacas.map((entry) => ({
        id: entry.id,
        personajeId: entry.personajeId,
        fechaHora: new Date(entry.fechaHora),
        tamanoAntes: entry.tamanoAntes,
        fuerzaAntes: entry.fuerzaAntes,
        colorAntes: entry.colorAntes
      }))
    });

    for (const account of source.accounts) {
      if (account.activeCharacterId) {
        await tx.account.update({
          where: { id: account.id },
          data: { activeCharacterId: account.activeCharacterId }
        });
      }
    }

    await tx.$queryRaw`SELECT setval(pg_get_serial_sequence('accounts', 'id'), COALESCE((SELECT MAX(id) FROM accounts), 1), EXISTS(SELECT 1 FROM accounts))`;
    await tx.$queryRaw`SELECT setval(pg_get_serial_sequence('characters', 'id'), COALESCE((SELECT MAX(id) FROM characters), 1), EXISTS(SELECT 1 FROM characters))`;
    await tx.$queryRaw`SELECT setval(pg_get_serial_sequence('historial_cacas', 'id'), COALESCE((SELECT MAX(id) FROM historial_cacas), 1), EXISTS(SELECT 1 FROM historial_cacas))`;
  });

  console.log(
    `Importacion completada: ${source.accounts.length} cuenta(s), ${source.characters.length} personaje(s), ${source.historialCacas.length} registro(s) de historial.`
  );
}

importJson()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
