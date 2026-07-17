export type Account = {
  id: number;
  username: string;
  activeCharacterId: number | null;
};

export type Character = {
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
};

export type AuthPayload = {
  username: string;
  password: string;
};

export type CharacterPayload = {
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
};

export type LeaderboardEntry = {
  id: number;
  nombre: string;
  nickname: string;
  colorPelo: string;
  totalCacas: number;
  fuerza: number;
  tamano: number;
  colorActual: string;
  posicion: number;
  medalla: "oro" | "plata" | "bronce" | null;
};

const API_URL = (window as Window & { __API_URL__?: string }).__API_URL__ ?? "http://localhost:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(body.error ?? "Error desconocido");
  }

  return response.json() as Promise<T>;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`
  };
}

export async function registerAccount(payload: AuthPayload) {
  return request<{ token: string; account: Account }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function login(payload: AuthPayload) {
  return request<{ token: string; account: Account }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function bootstrapGame(token: string) {
  return request<{ account: Account; personajes: Character[]; personajeActivo: Character | null }>("/api/game/bootstrap", {
    headers: authHeaders(token)
  });
}

export async function createCharacter(token: string, payload: CharacterPayload) {
  return request<{ personaje: Character; personajes: Character[] }>("/api/game/characters", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export async function editCharacter(token: string, characterId: number, payload: CharacterPayload) {
  return request<{ personaje: Character; personajes: Character[] }>(`/api/game/characters/${characterId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export async function selectCharacter(token: string, characterId: number) {
  return request<{ personajeActivo: Character; personajes: Character[] }>("/api/game/characters/select", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ characterId })
  });
}

export async function poop(token: string) {
  return request<{ personaje: Character; posicion: number; medalla: LeaderboardEntry["medalla"] }>("/api/game/poop", {
    method: "POST",
    headers: authHeaders(token)
  });
}

export async function resetCounter(token: string) {
  return request<{ personaje: Character; posicion: number; medalla: LeaderboardEntry["medalla"] | null }>("/api/game/reset", {
    method: "POST",
    headers: authHeaders(token)
  });
}

export async function fetchLeaderboard() {
  return request<{ jugadores: LeaderboardEntry[] }>("/api/leaderboard");
}
