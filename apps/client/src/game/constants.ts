export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;

export const GAME_COLORS = {
  ink: 0x1b1c1c,
  paper: 0xfbf9f8,
  wall: 0xc8ead7,
  wallShadow: 0x8fc8ad,
  floor: 0xb67b50,
  floorDark: 0x7a4b31,
  desk: 0x8b552f,
  deskLight: 0xb87643,
  screen: 0x79e6bb,
  screenDark: 0x2d7258,
  bathroom: 0xe8f3ef,
  toilet: 0xf7f5ef,
  toiletShadow: 0xbccbc5,
  accent: 0xffdf59,
  odor: 0x75b46f
} as const;

export const OFFICE_BATHROOM_X = 232;
export const OFFICE_AISLE_Y = 154;
export const BATHROOM_DOOR_X = 238;
export const TOILET_X = 284;
export const TOILET_SEAT_Y = 139;

export type SeatDefinition = {
  x: number;
  y: number;
  deskX: number;
  deskY: number;
  facing: "left" | "right";
};

export const OFFICE_SEATS: readonly SeatDefinition[] = [
  { x: 48, y: 67, deskX: 65, deskY: 59, facing: "right" },
  { x: 109, y: 52, deskX: 127, deskY: 44, facing: "right" },
  { x: 182, y: 69, deskX: 164, deskY: 61, facing: "left" },
  { x: 43, y: 119, deskX: 61, deskY: 111, facing: "right" },
  { x: 108, y: 140, deskX: 126, deskY: 132, facing: "right" },
  { x: 184, y: 121, deskX: 166, deskY: 113, facing: "left" }
] as const;

export const ANIMATION_TIMING = {
  chairPush: 180,
  stand: 180,
  walkVertical: 360,
  walkOffice: 920,
  enterBathroom: 320,
  sit: 380,
  strain: 350,
  impactHold: 520,
  reaction: 220,
  returnBathroom: 320,
  returnOffice: 920,
  returnVertical: 360,
  chairReset: 180
} as const;

export function getVisualScale(size: number) {
  return Math.max(1, Math.min(3, Math.round(size)));
}
