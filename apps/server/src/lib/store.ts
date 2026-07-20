// @ts-nocheck
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = process.env.DATA_FILE_PATH
  ? path.resolve(process.env.DATA_FILE_PATH)
  : path.resolve(__dirname, "../../data/caganometro.json");

export type AccountRecord = {
  id: number;
  username: string;
  passwordHash: string;
  activeCharacterId: number | null;
  fechaCreacion: string;
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
  ultimaCaca: string | null;
  fechaCreacion: string;
};

type HistorialRecord = {
  id: number;
  personajeId: number;
  fechaHora: string;
  tamanoAntes: number;
  fuerzaAntes: number;
  colorAntes: string;
};

type LegacyUsuario = {
  id: number;
  nombre: string;
  edad: number;
  estatura: number;
  colorPelo: string;
  colorPiel: string;
  colorActual: string;
  contrasenaHash: string;
  totalCacas: number;
  tamano: number;
  fuerza: number;
  ultimaCaca: string | null;
  fechaCreacion: string;
};

type StoreShape = {
  accounts: AccountRecord[];
  characters: CharacterRecord[];
  historialCacas: HistorialRecord[];
};

function createEmptyStore(): StoreShape {
  return {
    accounts: [],
    characters: [],
    historialCacas: []
  };
}

function normalizeStore(raw: unknown): StoreShape {
  if (!raw || typeof raw !== "object") {
    return createEmptyStore();
  }

  const candidate = raw as Partial<StoreShape> & {
    usuarios?: LegacyUsuario[];
    historialCacas?: Array<{
      id: number;
      usuarioId?: number;
      personajeId?: number;
      fechaHora: string;
      tamanoAntes: number;
      fuerzaAntes: number;
      colorAntes: string;
    }>;
  };

  if (Array.isArray(candidate.accounts) && Array.isArray(candidate.characters) && Array.isArray(candidate.historialCacas)) {
    return {
      accounts: candidate.accounts,
      characters: candidate.characters.map((character) => ({
        nickname: character.nickname ?? character.nombre,
        descripcion: character.descripcion ?? "",
        habilidades: character.habilidades ?? "",
        fortalezas: character.fortalezas ?? "",
        debilidades: character.debilidades ?? "",
        ...character
      })),
      historialCacas: candidate.historialCacas
    };
  }

  if (Array.isArray(candidate.usuarios)) {
    const accounts = candidate.usuarios.map((usuario) => ({
      id: usuario.id,
      username: usuario.nombre,
      passwordHash: usuario.contrasenaHash,
      activeCharacterId: usuario.id,
      fechaCreacion: usuario.fechaCreacion
    }));

    const characters = candidate.usuarios.map((usuario) => ({
      id: usuario.id,
      accountId: usuario.id,
      nombre: usuario.nombre,
      nickname: usuario.nombre,
      descripcion: "",
      habilidades: "",
      fortalezas: "",
      debilidades: "",
      edad: usuario.edad,
      estatura: usuario.estatura,
      colorPelo: usuario.colorPelo,
      colorPiel: usuario.colorPiel,
      colorActual: usuario.colorActual,
      totalCacas: usuario.totalCacas,
      tamano: usuario.tamano,
      fuerza: usuario.fuerza,
      ultimaCaca: usuario.ultimaCaca,
      fechaCreacion: usuario.fechaCreacion
    }));

    const historialCacas = (candidate.historialCacas ?? []).map((entry) => ({
      id: entry.id,
      personajeId: entry.personajeId ?? entry.usuarioId ?? 0,
      fechaHora: entry.fechaHora,
      tamanoAntes: entry.tamanoAntes,
      fuerzaAntes: entry.fuerzaAntes,
      colorAntes: entry.colorAntes
    }));

    return {
      accounts,
      characters,
      historialCacas
    };
  }

  return createEmptyStore();
}

async function ensureStore() {
  try {
    await fs.access(storePath);
  } catch {
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    await fs.writeFile(storePath, JSON.stringify(createEmptyStore(), null, 2));
  }
}

async function readStore(): Promise<StoreShape> {
  await ensureStore();
  const content = await fs.readFile(storePath, "utf8");
  const normalized = normalizeStore(JSON.parse(content));
  await writeStore(normalized);
  return normalized;
}

async function writeStore(store: StoreShape) {
  await fs.writeFile(storePath, JSON.stringify(store, null, 2));
}

function nextId(collection: Array<{ id: number }>) {
  return collection.at(-1)?.id ? collection.at(-1).id + 1 : 1;
}

export async function createAccount(username: string, passwordHash: string) {
  const store = await readStore();
  const account: AccountRecord = {
    id: nextId(store.accounts),
    username,
    passwordHash,
    activeCharacterId: null,
    fechaCreacion: new Date().toISOString()
  };

  store.accounts.push(account);
  await writeStore(store);
  return account;
}

export async function findAccountByUsername(username: string) {
  const store = await readStore();
  return store.accounts.find((account) => account.username.toLowerCase() === username.toLowerCase()) ?? null;
}

export async function findAccountById(id: number) {
  const store = await readStore();
  return store.accounts.find((account) => account.id === id) ?? null;
}

export async function createCharacter(
  accountId: number,
  data: Omit<CharacterRecord, "id" | "accountId" | "fechaCreacion" | "ultimaCaca" | "totalCacas" | "tamano" | "fuerza">
) {
  const store = await readStore();
  const character: CharacterRecord = {
    id: nextId(store.characters),
    accountId,
    fechaCreacion: new Date().toISOString(),
    ultimaCaca: null,
    totalCacas: 0,
    tamano: 1,
    fuerza: 5,
    ...data
  };

  store.characters.push(character);

  const account = store.accounts.find((entry) => entry.id === accountId);
  if (account && !account.activeCharacterId) {
    account.activeCharacterId = character.id;
  }

  await writeStore(store);
  return character;
}

export async function getCharactersByAccountId(accountId: number) {
  const store = await readStore();
  return store.characters.filter((character) => character.accountId === accountId);
}

export async function findCharacterById(id: number) {
  const store = await readStore();
  return store.characters.find((character) => character.id === id) ?? null;
}

export async function updateCharacter(id: number, patch: Partial<CharacterRecord>) {
  const store = await readStore();
  const index = store.characters.findIndex((character) => character.id === id);

  if (index === -1) {
    return null;
  }

  store.characters[index] = {
    ...store.characters[index],
    ...patch
  };

  await writeStore(store);
  return store.characters[index];
}

export async function setActiveCharacter(accountId: number, characterId: number) {
  const store = await readStore();
  const account = store.accounts.find((entry) => entry.id === accountId);
  const character = store.characters.find((entry) => entry.id === characterId && entry.accountId === accountId);

  if (!account || !character) {
    return null;
  }

  account.activeCharacterId = characterId;
  await writeStore(store);
  return character;
}

export async function getActiveCharacter(accountId: number) {
  const store = await readStore();
  const account = store.accounts.find((entry) => entry.id === accountId);

  if (!account?.activeCharacterId) {
    return null;
  }

  return store.characters.find((character) => character.id === account.activeCharacterId && character.accountId === accountId) ?? null;
}

export async function addHistorial(entry: Omit<HistorialRecord, "id" | "fechaHora">) {
  const store = await readStore();
  store.historialCacas.push({
    id: nextId(store.historialCacas),
    fechaHora: new Date().toISOString(),
    ...entry
  });
  await writeStore(store);
}

export async function getLeaderboard(limit = 20) {
  const store = await readStore();
  return [...store.characters]
    .sort((left, right) => {
      if (right.totalCacas !== left.totalCacas) {
        return right.totalCacas - left.totalCacas;
      }
      if (right.fuerza !== left.fuerza) {
        return right.fuerza - left.fuerza;
      }
      return left.fechaCreacion.localeCompare(right.fechaCreacion);
    })
    .slice(0, limit);
}

export async function resetCharacterProgress(accountId: number, characterId: number) {
  const store = await readStore();
  const index = store.characters.findIndex((character) => character.id === characterId && character.accountId === accountId);

  if (index === -1) {
    return null;
  }

  const current = store.characters[index];
  store.characters[index] = {
    ...current,
    totalCacas: 0,
    tamano: 1,
    fuerza: 5,
    colorActual: current.colorPiel,
    ultimaCaca: null
  };

  await writeStore(store);
  return store.characters[index];
}
