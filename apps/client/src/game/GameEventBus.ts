import Phaser from "phaser";
import type { PoopErrorPayload, PoopEventPayload } from "./types";

export type GameEventMap = {
  "scene:ready": undefined;
  "character:selected": { characterId: number; name: string };
  "poop:midpoint": PoopEventPayload;
  "poop:success": PoopEventPayload;
  "poop:error": PoopErrorPayload;
  "poop:finished": PoopEventPayload;
};

export class GameEventBus {
  private readonly emitter = new Phaser.Events.EventEmitter();

  on<K extends keyof GameEventMap>(event: K, listener: (payload: GameEventMap[K]) => void) {
    this.emitter.on(event, listener);
    return () => this.emitter.off(event, listener);
  }

  emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]) {
    this.emitter.emit(event, payload);
  }

  destroy() {
    this.emitter.removeAllListeners();
    this.emitter.destroy();
  }
}
