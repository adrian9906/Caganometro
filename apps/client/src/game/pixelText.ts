import Phaser from "phaser";

const CELL_WIDTH = 5;
const CELL_HEIGHT = 9;

const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  Ñ: ["01010", "10100", "00000", "10001", "11001", "10101", "10011", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00110", "00110"],
  ",": ["00000", "00000", "00000", "00000", "00110", "00100", "01000"],
  ":": ["00000", "00100", "00100", "00000", "00100", "00100", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "·": ["00000", "00000", "00000", "00100", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "¡": ["00100", "00000", "00100", "00100", "00100", "00100", "00100"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "Á": ["00100", "00010", "01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  "É": ["00100", "00010", "11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  "Í": ["00100", "00010", "11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  "Ó": ["00100", "00010", "01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "Ú": ["00100", "00010", "10001", "10001", "10001", "10001", "10001", "10001", "01110"]
};

export type PixelTextOptions = {
  color: number;
  pixelSize?: number;
  letterSpacing?: number;
  lineSpacing?: number;
  maxWidth?: number;
  align?: "left" | "center" | "right";
  originX?: number;
  originY?: number;
};

function measureLine(line: string, letterSpacing: number) {
  return line.length === 0 ? 0 : line.length * CELL_WIDTH + (line.length - 1) * letterSpacing;
}

function breakLongWord(word: string, maxUnits: number, letterSpacing: number) {
  const chunks: string[] = [];
  let chunk = "";
  for (const character of word) {
    const candidate = chunk + character;
    if (chunk && measureLine(candidate, letterSpacing) > maxUnits) {
      chunks.push(chunk);
      chunk = character;
    } else {
      chunk = candidate;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

function wrapText(text: string, maxUnits: number | null, letterSpacing: number) {
  const lines: string[] = [];
  for (const paragraph of text.toUpperCase().split("\n")) {
    if (!maxUnits) {
      lines.push(paragraph);
      continue;
    }

    let current = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const pieces = measureLine(word, letterSpacing) > maxUnits
        ? breakLongWord(word, maxUnits, letterSpacing)
        : [word];
      for (const piece of pieces) {
        const candidate = current ? `${current} ${piece}` : piece;
        if (current && measureLine(candidate, letterSpacing) > maxUnits) {
          lines.push(current);
          current = piece;
        } else {
          current = candidate;
        }
      }
    }
    lines.push(current);
  }
  return lines.length ? lines : [""];
}

export class PixelText extends Phaser.GameObjects.Container {
  private readonly pixels: Phaser.GameObjects.Graphics;
  private value: string;
  private readonly options: Required<Omit<PixelTextOptions, "maxWidth">> & Pick<PixelTextOptions, "maxWidth">;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, options: PixelTextOptions) {
    super(scene, Math.round(x), Math.round(y));
    this.value = text;
    this.options = {
      color: options.color,
      pixelSize: Math.max(1, Math.round(options.pixelSize ?? 1)),
      letterSpacing: Math.max(0, Math.round(options.letterSpacing ?? 1)),
      lineSpacing: Math.max(0, Math.round(options.lineSpacing ?? 2)),
      maxWidth: options.maxWidth,
      align: options.align ?? "center",
      originX: options.originX ?? 0.5,
      originY: options.originY ?? 0.5
    };
    this.pixels = new Phaser.GameObjects.Graphics(scene);
    this.add(this.pixels);
    scene.add.existing(this);
    this.redraw();
  }

  setText(text: string) {
    if (text === this.value) return this;
    this.value = text;
    this.redraw();
    return this;
  }

  private redraw() {
    const { align, color, letterSpacing, lineSpacing, maxWidth, originX, originY, pixelSize } = this.options;
    const maxUnits = maxWidth ? Math.max(CELL_WIDTH, Math.floor(maxWidth / pixelSize)) : null;
    const lines = wrapText(this.value, maxUnits, letterSpacing);
    const lineWidths = lines.map((line) => measureLine(line, letterSpacing));
    const widthUnits = Math.max(0, ...lineWidths);
    const heightUnits = lines.length * CELL_HEIGHT + Math.max(0, lines.length - 1) * lineSpacing;
    const originOffsetX = Math.round(-widthUnits * pixelSize * originX);
    const originOffsetY = Math.round(-heightUnits * pixelSize * originY);

    this.pixels.clear();
    this.pixels.fillStyle(color, 1);
    lines.forEach((line, lineIndex) => {
      const lineWidth = lineWidths[lineIndex];
      const alignmentOffset = align === "left" ? 0 : align === "right" ? widthUnits - lineWidth : Math.round((widthUnits - lineWidth) / 2);
      [...line].forEach((character, characterIndex) => {
        const glyph = GLYPHS[character] ?? GLYPHS["?"];
        const glyphTop = CELL_HEIGHT - glyph.length;
        glyph.forEach((row, rowIndex) => {
          [...row].forEach((pixel, columnIndex) => {
            if (pixel !== "1") return;
            this.pixels.fillRect(
              originOffsetX + (alignmentOffset + characterIndex * (CELL_WIDTH + letterSpacing) + columnIndex) * pixelSize,
              originOffsetY + (lineIndex * (CELL_HEIGHT + lineSpacing) + glyphTop + rowIndex) * pixelSize,
              pixelSize,
              pixelSize
            );
          });
        });
      });
    });
  }
}
