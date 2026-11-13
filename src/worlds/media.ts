// The pictures of the film as three.js textures (media.ts of ads/ailab-prompt-post):
//   n6 (the hook), n4 n5 a1 m5 m6 m8 ai1 ref1 ref3 m7 (the ten of the drop, in this order after n6): the WHOLE photos, long side <= 2600 px
//     (public/img, prep_photos.py; n4 n5 n6 come x4 from the Real-ESRGAN step of the render repo)
//   typ, res, gen  the real app recording as JPEG frames (public/seq, prep_screens.py): the prompt being typed (blurred), the click on 4K,
//                  the click on Generovať
// One Src per picture; every surface gets its own cover-fit "view" (a clone sharing the image) cropped around the face: punch-ins only
// ever go to the face. A video Src swaps its image per frame (set / play): every view follows.
import * as THREE from "three";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { clamp } from "../three/shot3d";
import boardsJson from "../../public/scr/boards.json";

export type Key = "n6" | "n4" | "n5" | "a1" | "m5" | "m6" | "m8" | "ai1" | "ref1" | "ref3" | "m7" | "typ" | "res" | "gen";
export const PHOTOS: Key[] = ["n6", "n4", "n5", "a1", "m5", "m6", "m8", "ai1", "ref1", "ref3", "m7"];
// the order of the ten of the drop (script.md)
export const TEN: Key[] = ["n4", "n5", "a1", "m5", "m6", "m8", "ai1", "ref1", "ref3", "m7"];
export const CLIPS: Key[] = ["typ", "res", "gen"];
export type Media = { font: Font; img: Record<string, HTMLImageElement>; seq: Record<string, HTMLImageElement[]> };
export type Box = [number, number, number, number];
export const BM = boardsJson as unknown as {
  typ: { size: [number, number]; field: Box; line: Box; n: number };
  res: { size: [number, number]; chip4k: Box; click: number; fps: number; n: number };
  gen: { size: [number, number]; button: Box; click: number; fps: number; n: number };
};

// where each picture's face is (0..1 from the top left of the WHOLE photo): crops and punch-ins go there
export const FOCUS: Record<Key, [number, number]> = {
  n6: [0.5, 0.4], n4: [0.36, 0.45], n5: [0.45, 0.28], a1: [0.53, 0.45], m5: [0.38, 0.22], m6: [0.37, 0.34], m8: [0.4, 0.18], ai1: [0.33, 0.29],
  ref1: [0.42, 0.31], ref3: [0.48, 0.22], m7: [0.59, 0.37], typ: [0.5, 0.5], res: [0.5, 0.5], gen: [0.5, 0.5],
};

// cover-fit: the part of a picture of aspect srcA (w/h) that fills a surface of aspect dstA, around focus, zoomed in
export function fitRect(srcA: number, dstA: number, focus: [number, number] = [0.5, 0.5], zoom = 1) {
  let rx = 1, ry = 1;
  if (srcA > dstA) rx = dstA / srcA;
  else ry = srcA / dstA;
  rx /= zoom;
  ry /= zoom;
  // texture v runs bottom-up (flipY): the focus y is measured from the top
  return { rx, ry, ox: clamp(focus[0] - rx / 2, 0, 1 - rx), oy: clamp(1 - focus[1] - ry / 2, 0, 1 - ry) };
}

export class Src {
  base: THREE.Texture;
  views: THREE.Texture[] = [];
  cur = 0;
  aspect: number;
  constructor(public key: Key, public frames: (HTMLImageElement | HTMLCanvasElement)[]) {
    this.base = new THREE.Texture(frames[0]);
    this.base.colorSpace = THREE.SRGBColorSpace;
    this.base.anisotropy = 8;
    this.base.needsUpdate = true;
    const f0 = frames[0];
    this.aspect = f0 instanceof HTMLImageElement ? f0.naturalWidth / f0.naturalHeight : f0.width / f0.height;
  }
  get isClip() {
    return this.frames.length > 1;
  }
  private add(rx: number, ry: number, ox: number, oy: number) {
    const t = this.base.clone();
    t.repeat.set(rx, ry);
    t.offset.set(ox, oy);
    t.needsUpdate = true;
    this.views.push(t);
    return t;
  }
  // the picture cover-fitted to a surface of aspect a (w/h)
  view(a: number, zoom = 1, focus: [number, number] = FOCUS[this.key]) {
    const r = fitRect(this.aspect, a, focus, zoom);
    return this.add(r.rx, r.ry, r.ox, r.oy);
  }
  // a video: show source frame i (every view follows; the GPU uploads the picture once)
  set(i: number) {
    const k = clamp(Math.floor(i), 0, this.frames.length - 1);
    if (k === this.cur) return;
    this.cur = k;
    this.base.image = this.frames[k];
    this.base.needsUpdate = true;
    for (const v of this.views) v.needsUpdate = true;
  }
  // a video used from film time t0 on: a `fps` source at `speed`, held on its last frame
  play(t: number, t0: number, speed = 1, fps = 30) {
    if (this.isClip) this.set(Math.max(0, t - t0) * fps * speed);
  }
}

export function sources(M: Media) {
  const S = {} as Record<Key, Src>;
  for (const k of PHOTOS) S[k] = new Src(k, [M.img[k]]);
  for (const k of CLIPS) S[k] = new Src(k, M.seq[k]);
  return S;
}
