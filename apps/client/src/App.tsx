import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PixelAvatar } from "./components/PixelAvatar";
import { CaganometroGame } from "./game/CaganometroGame";
import type { SceneCharacter } from "./game/types";
import {
  bootstrapGame,
  createCharacter,
  editCharacter,
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
import { createScoreCard, downloadScoreCardBlob, shareScoreCardBlob, type ScoreCardData } from "./lib/socialCard";

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

const initialCharacterForm: CharacterPayload = {
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
};

const medalLabel: Record<NonNullable<LeaderboardEntry["medalla"]>, string> = {
  oro: "Oro",
  plata: "Plata",
  bronce: "Bronce"
};

function hairHexFromId(id: string) {
  return hairOptions.find((option) => option.id === id)?.color ?? hairOptions[0].color;
}

function characterToPayload(character: Character): CharacterPayload {
  return {
    nombre: character.nombre,
    nickname: character.nickname,
    descripcion: character.descripcion,
    habilidades: character.habilidades,
    fortalezas: character.fortalezas,
    debilidades: character.debilidades,
    edad: character.edad,
    estatura: character.estatura,
    colorPelo: character.colorPelo,
    colorPiel: character.colorPiel
  };
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
  const [isSelectingCharacter, setIsSelectingCharacter] = useState(false);
  const [isSavingCharacter, setIsSavingCharacter] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<number | null>(null);
  const [authForm, setAuthForm] = useState<AuthPayload>({ username: "", password: "" });
  const [characterForm, setCharacterForm] = useState<CharacterPayload>(initialCharacterForm);

  const refreshLeaderboard = useCallback(async () => {
    const data = await fetchLeaderboard();
    setLeaderboard(data.jugadores);
    return data.jugadores;
  }, []);

  const loadBootstrap = useCallback(async (nextToken: string) => {
    const data = await bootstrapGame(nextToken);
    setAccount(data.account);
    setCharacters(data.personajes);
    setActiveCharacter(data.personajeActivo);
  }, []);

  useEffect(() => {
    void refreshLeaderboard().catch((error: Error) => setStatus(error.message));
  }, [refreshLeaderboard]);

  const sceneRoster = useMemo<SceneCharacter[]>(() => {
    return characters.map((character) => ({
      id: character.id,
      name: character.nombre,
      nickname: character.nickname,
      hairHex: hairHexFromId(character.colorPelo),
      skinHex: character.colorActual,
      height: character.estatura,
      size: character.tamano,
      strength: character.fuerza,
      poops: character.totalCacas,
      source: "owned" as const
    }));
  }, [characters]);

  useEffect(() => {
    if (!token || screenMode !== "play") {
      gameRef.current?.destroy();
      gameRef.current = null;
      setIsAnimating(false);
      return;
    }
    if (!mountRef.current || gameRef.current) return;

    const game = new CaganometroGame("phaser-game", {
      onPoopMidpoint: async () => {
        const data = await poop(token);
        setActiveCharacter(data.personaje);
        setCharacters((current) => current.map((item) => (item.id === data.personaje.id ? data.personaje : item)));
        setStatus(
          data.medalla
            ? `${data.personaje.nombre} subio con medalla ${data.medalla}.`
            : `${data.personaje.nombre} quedo en la posicion #${data.posicion}.`
        );
        await refreshLeaderboard();
      },
      onPoopError: (error) => setStatus(error.message),
      onPoopFinished: () => setIsAnimating(false)
    });
    gameRef.current = game;

    return () => {
      game.destroy();
      if (gameRef.current === game) gameRef.current = null;
    };
  }, [refreshLeaderboard, screenMode, token]);

  useEffect(() => {
    gameRef.current?.updateRoster(sceneRoster, activeCharacter?.id ?? null);
  }, [activeCharacter?.id, sceneRoster]);

  const rankingLeader = leaderboard[0] ?? null;
  const scoreCardData = useMemo<ScoreCardData | null>(() => {
    if (leaderboard.length === 0) return null;
    return {
      ranking: leaderboard.slice(0, 10).map((entry) => ({
        ...entry,
        hairHex: hairHexFromId(entry.colorPelo)
      }))
    };
  }, [leaderboard]);

  async function handleAuthSubmit() {
    try {
      const response = authMode === "login" ? await login(authForm) : await registerAccount(authForm);
      setToken(response.token);
      setAccount(response.account);
      await loadBootstrap(response.token);
      setScreenMode("hub");
      setStatus(authMode === "login" ? "Sesion iniciada. Elige tu proxima mision." : "Cuenta creada. Fabrica tu primer personaje.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo completar la autenticacion.");
    }
  }

  function openCreateCharacter() {
    if (isAnimating || isSelectingCharacter) return;
    setEditingCharacterId(null);
    setCharacterForm(initialCharacterForm);
    setScreenMode("create");
  }

  function openEditCharacter(character: Character) {
    if (isAnimating || isSelectingCharacter) return;
    setEditingCharacterId(character.id);
    setCharacterForm(characterToPayload(character));
    setScreenMode("create");
  }

  function closeCharacterEditor() {
    setCharacterForm(initialCharacterForm);
    setScreenMode(editingCharacterId ? "play" : "hub");
    setEditingCharacterId(null);
  }

  async function handleSaveCharacter() {
    if (!token || isSavingCharacter) return;
    setIsSavingCharacter(true);
    try {
      if (editingCharacterId) {
        const data = await editCharacter(token, editingCharacterId, characterForm);
        setCharacters(data.personajes);
        setActiveCharacter((current) => (current?.id === data.personaje.id ? data.personaje : current));
        await refreshLeaderboard();
        setCharacterForm(initialCharacterForm);
        setEditingCharacterId(null);
        setScreenMode("play");
        setStatus(`${data.personaje.nombre} actualizo su expediente.`);
        return;
      }

      const data = await createCharacter(token, characterForm);
      setCharacters(data.personajes);
      setActiveCharacter(data.personaje);
      setCharacterForm(initialCharacterForm);
      await Promise.all([loadBootstrap(token), refreshLeaderboard()]);
      setScreenMode("play");
      setStatus(`${data.personaje.nombre} ficho por la oficina.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo guardar el personaje.");
    } finally {
      setIsSavingCharacter(false);
    }
  }

  async function handleSelectCharacter(characterId: number) {
    if (!token || isAnimating || isSelectingCharacter || characterId === activeCharacter?.id) return;
    const selectedCharacter = characters.find((character) => character.id === characterId);
    if (!selectedCharacter) return;
    const previousCharacter = activeCharacter;
    setActiveCharacter(selectedCharacter);
    setIsSelectingCharacter(true);
    setStatus(`${selectedCharacter.nombre} tiene el turno del baño.`);
    try {
      const data = await selectCharacter(token, characterId);
      setCharacters(data.personajes);
      setActiveCharacter(data.personajeActivo);
      setStatus(`${data.personajeActivo.nombre} tiene el turno del baño.`);
    } catch (error) {
      setActiveCharacter(previousCharacter);
      setStatus(error instanceof Error ? error.message : "No se pudo seleccionar el personaje.");
    } finally {
      setIsSelectingCharacter(false);
    }
  }

  function handlePoop() {
    if (!activeCharacter || isAnimating || isSelectingCharacter || !gameRef.current) return;
    const started = gameRef.current.playPoopAnimation(activeCharacter.id);
    if (!started) {
      setStatus("La oficina todavia no esta lista para otra mision.");
      return;
    }
    setIsAnimating(true);
    setStatus(`${activeCharacter.nombre} se levanta de su escritorio...`);
  }

  async function handleResetCounter() {
    if (!token || !activeCharacter || isAnimating || isSelectingCharacter) return;
    try {
      const data = await resetCounter(token);
      setActiveCharacter(data.personaje);
      setCharacters((current) => current.map((item) => (item.id === data.personaje.id ? data.personaje : item)));
      await refreshLeaderboard();
      setStatus(`Se reseteo el contador de ${data.personaje.nombre}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo resetear el contador.");
    }
  }

  async function handleDownloadScore() {
    if (!scoreCardData || isSharing) return;
    setIsSharing(true);
    try {
      const blob = await createScoreCard(scoreCardData);
      downloadScoreCardBlob(blob, scoreCardData);
      setStatus("Ranking de cacas descargado en PNG.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo descargar la tarjeta.");
    } finally {
      setIsSharing(false);
    }
  }

  async function handleShareScore() {
    if (!scoreCardData || isSharing) return;
    setIsSharing(true);
    try {
      const blob = await createScoreCard(scoreCardData);
      const result = await shareScoreCardBlob(blob, scoreCardData);
      if (result === "shared") setStatus("Ranking de cacas compartido.");
      if (result === "downloaded") setStatus("Tu navegador no comparte archivos: se descargo el ranking en PNG.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo compartir la tarjeta.");
    } finally {
      setIsSharing(false);
    }
  }

  const header = (
    <header className="topbar">
      <div>
        <p className="eyebrow">{account ? `Sesion activa: ${account.username}` : "Oficina retro competitiva"}</p>
        <h1>CAGANOMETRO</h1>
      </div>
      <div className="status-chip" role="status" aria-live="polite">{status}</div>
    </header>
  );

  if (!token) {
    return (
      <div className="auth-shell">
        <section className="auth-hero">
          <div className="hero-badge">Oficina pixel art</div>
          <h1>CAGANOMETRO</h1>
          <p className="hero-copy">Crea tu plantilla, conquista el ranking y comparte cada gloriosa visita al bano.</p>
          <div className="hero-marquee"><span>Avatares vivos</span><span>Ranking mundial</span><span>Resultados compartibles</span></div>
        </section>
        <section className="auth-panel">
          <div>
            <div className="auth-tabs">
              <button className={authMode === "login" ? "active" : ""} type="button" onClick={() => setAuthMode("login")}>Entrar</button>
              <button className={authMode === "register" ? "active" : ""} type="button" onClick={() => setAuthMode("register")}>Registrar cuenta</button>
            </div>
            <div className="auth-card">
              <p className="auth-kicker">{authMode === "login" ? "Ficha tu entrada" : "Abre tu oficina"}</p>
              <label><span>Usuario</span><input value={authForm.username} onChange={(event) => setAuthForm((current) => ({ ...current, username: event.target.value }))} /></label>
              <label><span>Contrasena</span><input type="password" value={authForm.password} onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} /></label>
              <button className="pixel-button auth-submit" type="button" onClick={handleAuthSubmit}>{authMode === "login" ? "Entrar al juego" : "Crear cuenta"}</button>
              <p className="auth-status">{status}</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (screenMode === "hub") {
    return (
      <div className="shell">{header}
        <main className="hub-shell">
          <button className="hub-card" type="button" onClick={openCreateCharacter}><span className="hub-label">Crear personaje</span><strong>Laboratorio de avatares</strong><p>Diseña un empleado pixel art y mira como cobra vida en tiempo real.</p></button>
          <button className={`hub-card ${characters.length === 0 ? "disabled" : ""}`} type="button" disabled={characters.length === 0} onClick={() => setScreenMode("select")}><span className="hub-label">Jugar</span><strong>Entrar a la oficina</strong><p>{characters.length ? "Tu plantilla esta esperando su turno." : "Primero necesitas crear un personaje."}</p></button>
        </main>
      </div>
    );
  }

  if (screenMode === "create") {
    return (
      <div className="shell">{header}
        <main className="creator-layout">
          <section className="panel avatar-preview-panel">
            <div className="panel-title">{editingCharacterId ? "Editando avatar" : "Avatar en vivo"}</div>
            <div className="avatar-preview-stage">
              <PixelAvatar hairHex={hairHexFromId(characterForm.colorPelo)} skinHex={characterForm.colorPiel} height={characterForm.estatura} size={192} label="Vista previa del personaje" />
            </div>
            <h2>{characterForm.nombre || "Empleado sin nombre"}</h2>
            <p>@{characterForm.nickname || "nickname"}</p>
            <button className="pixel-button secondary" type="button" disabled={isSavingCharacter} onClick={closeCharacterEditor}>Volver</button>
          </section>
          <section className="panel creator-form-panel">
            <div className="panel-title">{editingCharacterId ? "Editar expediente" : "Expediente del empleado"}</div>
            <div className="form-grid">
              <label><span>Nombre</span><input value={characterForm.nombre} onChange={(event) => setCharacterForm((current) => ({ ...current, nombre: event.target.value }))} /></label>
              <label><span>Nickname</span><input value={characterForm.nickname} onChange={(event) => setCharacterForm((current) => ({ ...current, nickname: event.target.value }))} /></label>
              <label className="full-span"><span>Descripcion</span><textarea value={characterForm.descripcion} onChange={(event) => setCharacterForm((current) => ({ ...current, descripcion: event.target.value }))} /></label>
              <label className="full-span"><span>Habilidades</span><textarea value={characterForm.habilidades} onChange={(event) => setCharacterForm((current) => ({ ...current, habilidades: event.target.value }))} /></label>
              <label className="full-span"><span>Fortalezas</span><textarea value={characterForm.fortalezas} onChange={(event) => setCharacterForm((current) => ({ ...current, fortalezas: event.target.value }))} /></label>
              <label className="full-span"><span>Debilidades</span><textarea value={characterForm.debilidades} onChange={(event) => setCharacterForm((current) => ({ ...current, debilidades: event.target.value }))} /></label>
              <label><span>Edad</span><input type="number" min={1} max={120} value={characterForm.edad} onChange={(event) => setCharacterForm((current) => ({ ...current, edad: Number(event.target.value) }))} /></label>
              <label><span>Estatura: {characterForm.estatura.toFixed(2)}m</span><input type="range" min={1} max={2.2} step={0.05} value={characterForm.estatura} onChange={(event) => setCharacterForm((current) => ({ ...current, estatura: Number(event.target.value) }))} /></label>
              <label><span>Pelo</span><select value={characterForm.colorPelo} onChange={(event) => setCharacterForm((current) => ({ ...current, colorPelo: event.target.value }))}>{hairOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
              <div><span className="label-text">Color de piel</span><div className="skin-row">{skinPalette.map((color) => <button key={color} type="button" aria-label={`Seleccionar piel ${color}`} className={`skin-button ${characterForm.colorPiel === color ? "active" : ""}`} style={{ background: color }} onClick={() => setCharacterForm((current) => ({ ...current, colorPiel: color }))} />)}</div></div>
            </div>
            <button className="pixel-button create-submit" type="button" disabled={isSavingCharacter} onClick={handleSaveCharacter}>{isSavingCharacter ? "Guardando..." : editingCharacterId ? "Guardar cambios" : "Crear personaje"}</button>
          </section>
        </main>
      </div>
    );
  }

  if (screenMode === "select") {
    return (
      <div className="shell">{header}
        <main className="select-layout">
          <section className="panel"><div className="panel-title">Seleccionar personaje</div><div className="select-list">{characters.map((character) => <button key={character.id} type="button" disabled={isAnimating || isSelectingCharacter} className={`roster-card ${activeCharacter?.id === character.id ? "active" : ""}`} aria-pressed={activeCharacter?.id === character.id} onClick={() => handleSelectCharacter(character.id)}><PixelAvatar hairHex={hairHexFromId(character.colorPelo)} skinHex={character.colorActual} height={character.estatura} size={64} label={`Avatar de ${character.nombre}`} /><div><strong>{character.nombre}</strong><p>@{character.nickname} | fuerza {character.fuerza}</p></div></button>)}</div></section>
          <section className="panel"><div className="panel-title">Ficha completa</div>{activeCharacter ? <div className="select-detail"><div className="select-hero"><PixelAvatar hairHex={hairHexFromId(activeCharacter.colorPelo)} skinHex={activeCharacter.colorActual} height={activeCharacter.estatura} size={128} label={`Avatar de ${activeCharacter.nombre}`} /><div><h2>{activeCharacter.nombre}</h2><p className="select-nick">@{activeCharacter.nickname}</p></div></div><div className="select-stats"><div><strong>Edad:</strong> {activeCharacter.edad}</div><div><strong>Estatura:</strong> {activeCharacter.estatura.toFixed(2)}m</div><div><strong>Fuerza:</strong> {activeCharacter.fuerza}</div><div><strong>Cacas:</strong> {activeCharacter.totalCacas}</div></div><div className="select-copy"><p><strong>Descripcion:</strong> {activeCharacter.descripcion}</p><p><strong>Habilidades:</strong> {activeCharacter.habilidades}</p><p><strong>Fortalezas:</strong> {activeCharacter.fortalezas}</p><p><strong>Debilidades:</strong> {activeCharacter.debilidades}</p></div><div className="button-row"><button className="pixel-button secondary" type="button" onClick={() => setScreenMode("hub")}>Volver</button><button className="pixel-button secondary" type="button" onClick={() => openEditCharacter(activeCharacter)}>Editar personaje</button><button className="pixel-button" type="button" onClick={() => setScreenMode("play")}>Entrar a la oficina</button></div></div> : <p>No hay personaje seleccionado.</p>}</section>
        </main>
      </div>
    );
  }

  return (
    <div className="shell play-shell">{header}
      <main className="play-layout">
        <section className="panel employee-strip-panel">
          <div className="strip-heading"><div><p className="eyebrow">Plantilla jugable</p><h2>Elige quien necesita un descanso</h2></div><div className="button-row compact"><button className="pixel-button secondary small-button" type="button" disabled={isAnimating || isSelectingCharacter} onClick={() => setScreenMode("hub")}>Menu</button><button className="pixel-button secondary small-button" type="button" disabled={isAnimating || isSelectingCharacter} onClick={openCreateCharacter}>Nuevo</button><button className="pixel-button secondary small-button" type="button" disabled={!activeCharacter || isAnimating || isSelectingCharacter} onClick={() => activeCharacter && openEditCharacter(activeCharacter)}>Editar activo</button></div></div>
          <div className="employee-card-strip" aria-label="Personajes propios">{characters.map((character) => {
            const selected = character.id === activeCharacter?.id;
            return <button key={character.id} type="button" disabled={isAnimating || isSelectingCharacter} className={`employee-card ${selected ? "active" : ""}`} aria-pressed={selected} onClick={() => handleSelectCharacter(character.id)}><PixelAvatar hairHex={hairHexFromId(character.colorPelo)} skinHex={character.colorActual} height={character.estatura} size={80} label={`Avatar de ${character.nombre}`} /><span><strong>{character.nombre}</strong><small>@{character.nickname}</small><small>{character.totalCacas} cacas · fuerza {character.fuerza}</small></span></button>;
          })}</div>
        </section>

        <div className="play-grid">
          <section className="panel game-panel">
            <div className="game-title-row"><div className="panel-title">Oficina + bano</div><span className="live-badge"><i /> En vivo</span></div>
            <div className="stats-bar"><div><span>Activo</span><strong>{activeCharacter?.nombre ?? "--"}</strong></div><div><span>Fuerza</span><strong>{activeCharacter?.fuerza ?? 0}</strong></div><div><span>Tamano</span><strong>{activeCharacter?.tamano.toFixed(2) ?? "0.00"}</strong></div><div><span>Cacas</span><strong>{activeCharacter?.totalCacas ?? 0}</strong></div></div>
            <div id="phaser-game" ref={mountRef} className="game-frame" aria-label="Escena pixel art de la oficina y el bano" />
            <div className="action-grid"><button className="pixel-button action-button" type="button" onClick={handlePoop} disabled={!activeCharacter || isAnimating || isSelectingCharacter}>{isAnimating ? "Mision en curso..." : "IR AL BANO"}</button><button className="pixel-button secondary action-button" type="button" onClick={handleResetCounter} disabled={!activeCharacter || isAnimating || isSelectingCharacter}>Resetear contador</button></div>
            <div className="share-bar"><div><p className="eyebrow">Ranking de cacas</p><strong>{scoreCardData ? `Top ${scoreCardData.ranking.length} listo para compartir` : "Aun no hay puntuaciones en el ranking"}</strong></div><div className="button-row"><button className="pixel-button secondary small-button" type="button" disabled={!scoreCardData || isSharing || isAnimating || isSelectingCharacter} onClick={handleDownloadScore}>Descargar ranking</button><button className="pixel-button small-button" type="button" disabled={!scoreCardData || isSharing || isAnimating || isSelectingCharacter} onClick={handleShareScore}>Compartir ranking</button></div></div>
          </section>

          <aside className="panel ranking-panel">
            <div className="panel-title">Ranking global de cacas</div>
            {rankingLeader ? (
              <div className="ranking-champion">
                <span className="champion-crown" aria-hidden="true">♛</span>
                <PixelAvatar hairHex={hairHexFromId(rankingLeader.colorPelo)} skinHex={rankingLeader.colorActual} size={128} label={`Avatar del lider ${rankingLeader.nombre}`} />
                <div className="champion-copy"><span>Quien mas caga</span><strong>{rankingLeader.nombre}</strong><small>@{rankingLeader.nickname}</small><b>{rankingLeader.totalCacas} cacas · fuerza {rankingLeader.fuerza}</b></div>
              </div>
            ) : <p className="ranking-empty">Todavia no hay campeon del trono.</p>}
            <p className="ranking-intro">Jugadores reales ordenados por cacas. No ocupan puestos en tu oficina.</p>
            <div className="ranking-list">{leaderboard.map((entry) => <article key={entry.id} className={`rank-row rank-${entry.posicion <= 3 ? entry.posicion : "rest"}`}><div className="rank-position">{entry.medalla ? medalLabel[entry.medalla] : `#${entry.posicion}`}</div><PixelAvatar hairHex={hairHexFromId(entry.colorPelo)} skinHex={entry.colorActual} size={48} label={`Avatar de ${entry.nombre}`} /><div className="rank-meta"><strong>{entry.nombre}</strong><span>{entry.totalCacas} cacas | fuerza {entry.fuerza}</span></div></article>)}</div>
          </aside>
        </div>
      </main>
    </div>
  );
}
