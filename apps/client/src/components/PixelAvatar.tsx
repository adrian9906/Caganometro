import { useEffect, useRef } from "react";
import { CHARACTER_FRAME_HEIGHT, CHARACTER_FRAME_WIDTH, drawCharacterFrame, type CharacterAppearance } from "../game/pixelSpriteSheet";

type PixelAvatarProps = CharacterAppearance & {
  size?: number;
  frame?: number;
  label: string;
  className?: string;
};

export function PixelAvatar({ size = 96, frame = 0, label, className = "", ...appearance }: PixelAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT);
    drawCharacterFrame(ctx, frame, appearance);
  }, [appearance.hairHex, appearance.height, appearance.pantsHex, appearance.shirtHex, appearance.skinHex, frame]);

  return (
    <canvas
      ref={canvasRef}
      className={`pixel-avatar ${className}`.trim()}
      width={CHARACTER_FRAME_WIDTH}
      height={CHARACTER_FRAME_HEIGHT}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    />
  );
}
