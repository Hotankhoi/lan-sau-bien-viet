/** Kênh sự kiện giữa Phaser (cảnh lặn) và giao diện DOM. */
import Phaser from 'phaser';
export const bus = new Phaser.Events.EventEmitter();

export interface PhotoResult {
  speciesId: string | null;
  stars: number;
  points: number;
  isNew: boolean;
  photo: string;
  quality: number;
  reason?: string;
}

export interface DiveSummary {
  region: string;
  tier: number;
  photos: PhotoResult[];
  newSpecies: string[];
  research: number;
  green: number;
  trash: number;
  coralHits: number;
  dangerHits: string[];
  reason: 'surface' | 'oxygen';
  seconds: number;
}

export interface HudState {
  oxygen: number;
  depth: number;
  pressure: number;
  green: number;
  research: number;
  newCount: number;
  lamp: boolean;
  scanReady: number; // 0..1
  hasScanner: boolean;
  aiming: boolean;
  surfacing: number; // 0..1
  sprint: boolean;
  frame?: { x: number; y: number; w: number; h: number; focus: number; label: string };
  markers: { x: number; y: number; kind: 'warn' | 'scan' | 'new'; label?: string }[];
  minimap: { diverX: number; diverY: number; W: number; H: number; ground: number[]; dots: { x: number; y: number; c: string }[] };
}
