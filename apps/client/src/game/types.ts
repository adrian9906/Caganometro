export type SceneCharacter = {
  id: number;
  name: string;
  nickname: string;
  hairHex: string;
  skinHex: string;
  height: number;
  size: number;
  strength: number;
  poops: number;
  source: "owned" | "leaderboard";
  position?: number;
};

export type PoopEventPayload = {
  characterId: number;
};

export type PoopErrorPayload = PoopEventPayload & {
  error: Error;
};
