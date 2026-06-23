import { useEffect, useMemo, useRef, useState } from "react";
import { CaganometroGame } from "./game/CaganometroGame";
import {
  bootstrapGame,
  createCharacter,
  fetchLeaderboard,
  login,
  poop,
  registerAccount,
  resetCounter,
  selectCharacter,
  type Account,
  type AuthPayload,
  type Character,
  type CharacterPayload,
  type LeaderboardEntry
} from "./lib/api";

type HairOption = {
  id: string;
  label: string;
  color: string;
};

const skinPalette = ["#f4c8a8", "#d9a074", "#9a6038", "#2a1912"];
const hairOptions: HairOption[] = [
  { id: "negro", label: "Negro volcanico", color: "#1b1c1c" },
  { id: "rubio", label: "Rubio arcade", color: "#d1b43b" },
  { id: "rojo", label: "Rojo turbo", color: "#9f3d26" },
  { id: "castano", label: "Castano beta", color: "#69412b" }
];

const medalLabel: Record<NonNullable<LeaderboardEntry["medalla"]>, string> = {
  oro: "Oro",
  plata: "Plata",
  bronce: "Bronce"
};

function hairHexFromId(id: string) {
  return hairOptions.find((option) => option.id === id)?.color ?? hairOptions[0].color;
}

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<CaganometroGame | null>(null);
  const [token, setToken] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState("Crea una cuenta y luego fabrica un ejercito de cagadores.");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [screenMode, setScreenMode] = useState<"hub" | "create" | "select" | "play">("hub");
  const [isAnimating, setIsAnimating] = useState(false);
  const [authForm, setAuthForm] = useState<AuthPayload>({
    username: "",
    password: ""
  });
  const [characterForm, setCharacterForm] = useState<CharacterPayload>({
    nombre: "",
    nickname: "",
    descripcion: "",
    habilidades: "",
    fortalezas: "",
    debilidades: "",
    edad: 18,
    estatura: 1.7,
    colorPelo: "negro",
    colorPiel: skinPalette[0]
  });

  async function refreshLeaderboard() {
    const data = await fetchLeaderboard();
    setLeaderboard(data.jugadores);
  }

  async function loadBootstrap(nextToken: string) {
    const data = await bootstrapGame(nextToken);
    setAccount(data.account);
    setCharacters(data.personajes);
    setActiveCharacter(data.personajeActivo);
  }

  useEffect(() => {
    refreshLeaderboard().catch((error: Error) => {
      setStatus(error.message);
    });
  }, []);

  const phaserConfig = useMemo(() => {
    const activeSkin = activeCharacter?.colorActual ?? characterForm.colorPiel;
    const scale = activeCharacter?.tamano ? 1.82 + (activeCharacter.tamano - 1) * 0.42 : 1.82;

    return {
      hairColor: hairHexFromId(activeCharacter?.colorPelo ?? characterForm.colorPelo),
      skinColor: activeSkin,
      scale
    };
  }, [activeCharacter, characterForm.colorPelo, characterForm.colorPiel]);

  useEffect(() => {
    if (!mountRef.current || gameRef.current || !token) {
      return;
    }

    gameRef.current = new CaganometroGame("phaser-game", {
      onPoopMidpoint: async () => {
        try {
          const data = await poop(token);
          setActiveCharacter(data.personaje);
          setCharacters((prev) => prev.map((item) => (item.id === data.personaje.id ? data.personaje : item)));
          setStatus(
            data.medalla
              ? `${data.personaje.nombre} subio con medalla ${data.medalla}.`
              : `${data.personaje.nombre} quedo en la posicion #${data.posicion}.`
          );
          await refreshLeaderboard();
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "No se pudo registrar la caca.");
        }
      },
      onPoopFinished: () => {
        setIsAnimating(false);
      }
    });

    return () => {
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    gameRef.current?.updateCharacter(phaserConfig);
  }, [phaserConfig]);

  async function handleAuthSubmit() {
    try {
      const response = authMode === "login" ? await login(authForm) : await registerAccount(authForm);
      setToken(response.token);
      setAccount(response.account);
      await loadBootstrap(response.token);
      setScreenMode("hub");
      setStatus(
        authMode === "login"
          ? "Sesion iniciada. Elige si quieres crear personaje o jugar."
          : "Cuenta creada. El siguiente paso es crear tu primer personaje."
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo completar la autenticacion.");
    }
  }

  async function handleCreateCharacter() {
    if (!token) {
      return;
    }

    try {
      const data = await createCharacter(token, characterForm);
      setCharacters(data.personajes);
      setActiveCharacter(data.personaje);
      setCharacterForm({
        nombre: "",
        nickname: "",
        descripcion: "",
        habilidades: "",
        fortalezas: "",
        debilidades: "",
        edad: 18,
        estatura: 1.7,
        colorPelo: "negro",
        colorPiel: skinPalette[0]
      });
      await loadBootstrap(token);
      await refreshLeaderboard();
      setScreenMode("play");
      setStatus(`${data.personaje.nombre} entro al caganoverso.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo crear el personaje.");
    }
  }

  async function handleSelectCharacter(characterId: number) {
    if (!token) {
      return;
    }

    try {
      const data = await selectCharacter(token, characterId);
      setCharacters(data.personajes);
      setActiveCharacter(data.personajeActivo);
      setStatus(`${data.personajeActivo.nombre} es ahora tu campeon activo.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo seleccionar el personaje.");
    }
  }

  function handlePoop() {
    if (!token || !activeCharacter || isAnimating) {
      return;
    }

    setIsAnimating(true);
    setStatus(`${activeCharacter.nombre} camina hacia el trono...`);
    gameRef.current?.playPoopAnimation();
  }

  async function handleResetCounter() {
    if (!token || !activeCharacter || isAnimating) {
      return;
    }

    try {
      const data = await resetCounter(token);
      setActiveCharacter(data.personaje);
      setCharacters((prev) => prev.map((item) => (item.id === data.personaje.id ? data.personaje : item)));
      await refreshLeaderboard();
      setStatus(`Se reseteo el contador de ${data.personaje.nombre}. Vuelve a crecer desde cero.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo resetear el contador.");
    }
  }

  if (!token) {
    return (
      <div className="auth-shell">
        <section className="auth-hero">
          <div className="hero-badge">Retro brutal login</div>
          <h1>CAGANOMETRO</h1>
          <p className="hero-copy">
            Primero entra con tu cuenta. Despues, ya dentro del juego, podras crear todos los personajes que quieras sin pedir contrasena por cada uno.
          </p>
          <div className="hero-marquee">
            <span>Pixel art humano</span>
            <span>Ranking mundial</span>
            <span>Cuenta separada de personaje</span>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-tabs">
            <button className={authMode === "login" ? "active" : ""} type="button" onClick={() => setAuthMode("login")}>
              Entrar
            </button>
            <button className={authMode === "register" ? "active" : ""} type="button" onClick={() => setAuthMode("register")}>
              Registrar cuenta
            </button>
          </div>

          <div className="auth-card">
            <p className="auth-kicker">{authMode === "login" ? "Accede al arcade" : "Abre tu laboratorio"}</p>
            <label>
              <span>Usuario</span>
              <input
                value={authForm.username}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, username: event.target.value }))}
                placeholder="ej: adrian_arcade"
              />
            </label>
            <label>
              <span>Contrasena</span>
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="min 6 caracteres"
              />
            </label>

            <button className="pixel-button auth-submit" type="button" onClick={handleAuthSubmit}>
              {authMode === "login" ? "Entrar al juego" : "Crear cuenta"}
            </button>

            <p className="auth-status">{status}</p>
          </div>
        </section>
      </div>
    );
  }

  if (screenMode === "hub") {
    const canPlay = characters.length > 0;

    return (
      <div className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Sesion activa: {account?.username}</p>
            <h1>CAGANOMETRO</h1>
          </div>
          <div className="status-chip">{status}</div>
        </header>

        <main className="hub-shell">
          <button className="hub-card" type="button" onClick={() => setScreenMode("create")}>
            <span className="hub-label">Crear personaje</span>
            <strong>Laboratorio de avatares</strong>
            <p>Define su identidad, su lore y todo su kit antes de mandarlo al trono.</p>
          </button>

          <button className={`hub-card ${!canPlay ? "disabled" : ""}`} type="button" onClick={() => canPlay && setScreenMode("select")}>
            <span className="hub-label">Jugar</span>
            <strong>Entrar a la arena del bano</strong>
            <p>{canPlay ? "Ya tienes personajes listos para competir." : "Necesitas crear al menos un personaje antes de jugar."}</p>
          </button>
        </main>
      </div>
    );
  }

  if (screenMode === "select") {
    return (
      <div className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Sesion activa: {account?.username}</p>
            <h1>CAGANOMETRO</h1>
          </div>
          <div className="status-chip">{status}</div>
        </header>

        <main className="select-layout">
          <section className="panel">
            <div className="panel-title">Seleccionar personaje</div>
            <div className="select-list">
              {characters.map((character) => (
                <button
                  key={character.id}
                  type="button"
                  className={`roster-card ${activeCharacter?.id === character.id ? "active" : ""}`}
                  onClick={() => handleSelectCharacter(character.id)}
                >
                  <div className="roster-avatar" style={{ background: character.colorActual }}>
                    <span style={{ background: hairHexFromId(character.colorPelo) }} />
                  </div>
                  <div>
                    <strong>{character.nombre}</strong>
                    <p>{character.nickname} | fuerza {character.fuerza}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">Ficha completa</div>
            {activeCharacter ? (
              <div className="select-detail">
                <div className="select-hero">
                  <div className="select-avatar" style={{ background: activeCharacter.colorActual }}>
                    <span style={{ background: hairHexFromId(activeCharacter.colorPelo) }} />
                  </div>
                  <div>
                    <h2>{activeCharacter.nombre}</h2>
                    <p className="select-nick">@{activeCharacter.nickname}</p>
                  </div>
                </div>

                <div className="select-stats">
                  <div><strong>Edad:</strong> {activeCharacter.edad}</div>
                  <div><strong>Estatura:</strong> {activeCharacter.estatura.toFixed(2)}m</div>
                  <div><strong>Fuerza:</strong> {activeCharacter.fuerza}</div>
                  <div><strong>Cacas:</strong> {activeCharacter.totalCacas}</div>
                </div>

                <div className="select-copy">
                  <p><strong>Descripcion:</strong> {activeCharacter.descripcion}</p>
                  <p><strong>Habilidades:</strong> {activeCharacter.habilidades}</p>
                  <p><strong>Fortalezas:</strong> {activeCharacter.fortalezas}</p>
                  <p><strong>Debilidades:</strong> {activeCharacter.debilidades}</p>
                </div>

                <div className="button-row">
                  <button className="pixel-button secondary" type="button" onClick={() => setScreenMode("hub")}>
                    Volver
                  </button>
                  <button className="pixel-button" type="button" onClick={() => setScreenMode("play")}>
                    Jugar
                  </button>
                </div>
              </div>
            ) : (
              <p>No hay personaje seleccionado.</p>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Sesion activa: {account?.username}</p>
          <h1>CAGANOMETRO</h1>
        </div>
        <div className="status-chip">{status}</div>
      </header>

      <main className="layout">
        <section className="panel builder-panel">
          <div className="panel-title">Hangar de personajes</div>
          <div className="button-row compact">
            <button className="pixel-button secondary" type="button" onClick={() => setScreenMode("hub")}>
              Volver al menu
            </button>
            <button className="pixel-button secondary" type="button" onClick={() => setScreenMode("create")}>
              Crear otro
            </button>
            <button className="pixel-button secondary" type="button" onClick={() => setScreenMode("select")}>
              Cambiar personaje
            </button>
          </div>

          <div className="account-mini">
            <strong>Cuenta</strong>
            <span>{account?.username}</span>
          </div>

          <div className="character-roster">
            {characters.length === 0 ? (
              <p className="roster-empty">Todavia no tienes personajes. Fabrica el primero.</p>
            ) : (
              characters.map((character) => (
                <button
                  key={character.id}
                  type="button"
                  className={`roster-card ${activeCharacter?.id === character.id ? "active" : ""}`}
                  onClick={() => handleSelectCharacter(character.id)}
                >
                  <div className="roster-avatar" style={{ background: character.colorActual }}>
                    <span style={{ background: hairHexFromId(character.colorPelo) }} />
                  </div>
                  <div>
                    <strong>{character.nombre}</strong>
                    <p>{character.nickname} | {character.totalCacas} cacas</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {screenMode === "create" ? (
            <div className="creator-card">
              <h2>Crear nuevo personaje</h2>
              <div className="preview-card">
                <div className="preview-face" style={{ background: characterForm.colorPiel }}>
                  <span className="preview-hair" style={{ background: hairHexFromId(characterForm.colorPelo) }} />
                </div>
                <div>
                  <strong>{characterForm.nombre || "Sin nombre"}</strong>
                  <p>Este formulario no pide contrasena. Va ligado a tu cuenta actual.</p>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  <span>Nombre</span>
                  <input
                    value={characterForm.nombre}
                    onChange={(event) => setCharacterForm((prev) => ({ ...prev, nombre: event.target.value }))}
                  />
                </label>

                <label>
                  <span>Nickname</span>
                  <input
                    value={characterForm.nickname}
                    onChange={(event) => setCharacterForm((prev) => ({ ...prev, nickname: event.target.value }))}
                  />
                </label>

                <label className="full-span">
                  <span>Descripcion</span>
                  <textarea
                    value={characterForm.descripcion}
                    onChange={(event) => setCharacterForm((prev) => ({ ...prev, descripcion: event.target.value }))}
                  />
                </label>

                <label className="full-span">
                  <span>Habilidades</span>
                  <textarea
                    value={characterForm.habilidades}
                    onChange={(event) => setCharacterForm((prev) => ({ ...prev, habilidades: event.target.value }))}
                  />
                </label>

                <label className="full-span">
                  <span>Fortalezas</span>
                  <textarea
                    value={characterForm.fortalezas}
                    onChange={(event) => setCharacterForm((prev) => ({ ...prev, fortalezas: event.target.value }))}
                  />
                </label>

                <label className="full-span">
                  <span>Debilidades</span>
                  <textarea
                    value={characterForm.debilidades}
                    onChange={(event) => setCharacterForm((prev) => ({ ...prev, debilidades: event.target.value }))}
                  />
                </label>

                <label>
                  <span>Edad</span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={characterForm.edad}
                    onChange={(event) => setCharacterForm((prev) => ({ ...prev, edad: Number(event.target.value) }))}
                  />
                </label>

                <label>
                  <span>Estatura: {characterForm.estatura.toFixed(2)}m</span>
                  <input
                    type="range"
                    min={1}
                    max={2.2}
                    step={0.05}
                    value={characterForm.estatura}
                    onChange={(event) => setCharacterForm((prev) => ({ ...prev, estatura: Number(event.target.value) }))}
                  />
                </label>

                <label>
                  <span>Pelo</span>
                  <select
                    value={characterForm.colorPelo}
                    onChange={(event) => setCharacterForm((prev) => ({ ...prev, colorPelo: event.target.value }))}
                  >
                    {hairOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <span className="label-text">Color de piel</span>
                  <div className="skin-row">
                    {skinPalette.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`skin-button ${characterForm.colorPiel === color ? "active" : ""}`}
                        style={{ background: color }}
                        onClick={() => setCharacterForm((prev) => ({ ...prev, colorPiel: color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button className="pixel-button" type="button" onClick={handleCreateCharacter}>
                Crear personaje
              </button>
            </div>
          ) : (
            <div className="creator-card lore-card">
              <h2>Ficha del personaje activo</h2>
              {activeCharacter ? (
                <div className="lore-grid">
                  <div><strong>Nombre:</strong> {activeCharacter.nombre}</div>
                  <div><strong>Nickname:</strong> {activeCharacter.nickname}</div>
                  <div className="full-span"><strong>Descripcion:</strong> {activeCharacter.descripcion}</div>
                  <div className="full-span"><strong>Habilidades:</strong> {activeCharacter.habilidades}</div>
                  <div className="full-span"><strong>Fortalezas:</strong> {activeCharacter.fortalezas}</div>
                  <div className="full-span"><strong>Debilidades:</strong> {activeCharacter.debilidades}</div>
                </div>
              ) : (
                <p>No hay personaje activo.</p>
              )}
            </div>
          )}
        </section>

        <section className="panel game-panel">
          <div className="panel-title">Arena del bano</div>
          <div className="stats-bar">
            <div>
              <span>Activo</span>
              <strong>{activeCharacter?.nombre ?? "--"}</strong>
            </div>
            <div>
              <span>Fuerza</span>
              <strong>{activeCharacter?.fuerza ?? 0}</strong>
            </div>
            <div>
              <span>Tamano</span>
              <strong>{activeCharacter?.tamano.toFixed(2) ?? "0.00"}</strong>
            </div>
            <div>
              <span>Cacas</span>
              <strong>{activeCharacter?.totalCacas ?? 0}</strong>
            </div>
          </div>

          <div id="phaser-game" ref={mountRef} className="game-frame" />

          <div className="button-row">
            <button className="pixel-button action-button" type="button" onClick={handlePoop} disabled={!activeCharacter || isAnimating}>
              {isAnimating ? "Ejecutando ritual..." : "IR AL BANO"}
            </button>
            <button className="pixel-button secondary action-button" type="button" onClick={handleResetCounter} disabled={!activeCharacter || isAnimating}>
              Resetear contador
            </button>
          </div>
        </section>

        <section className="panel ranking-panel">
          <div className="panel-title">Ranking mundial</div>
          <div className="ranking-list">
            {leaderboard.map((entry) => (
              <article key={entry.id} className={`rank-row rank-${entry.posicion <= 3 ? entry.posicion : "rest"}`}>
                <div className="rank-position">{entry.medalla ? medalLabel[entry.medalla] : `#${entry.posicion}`}</div>
                <div className="rank-meta">
                  <strong>{entry.nombre}</strong>
                  <span>
                    {entry.totalCacas} cacas | fuerza {entry.fuerza}
                  </span>
                </div>
                <div className="rank-skin" style={{ background: entry.colorActual }} />
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
