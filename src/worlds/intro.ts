// World 1, the intro (film 0-344, 0.000-5.742 s). BRUTAL EDIT, every hard change on the song's beats (timing.ts T):
//   0.000  frame 0 is already flying: photo n6 in 2.5D (the face layer cut out in front of the blurred background, parallax), a fast push-in,
//          flash + CA + a burst of lime particles, a scan line; 0.200 TAHLE, 0.513 HOLKA, 0.861 NEEXISTUJE (lime)
//   0.311 / 0.729 / 1.147 (beats) hard cuts (wide, the face macro, wide tilted), glitch 3 f; 0.917 the face breaks up into lime wireframe +
//          particles for 8 f (4 f at the peak) and re-forms; 1.565 punch
//   1.983  the photo freezes into a print (a polaroid floating in the graphite) · 2.400 the viewfinder snaps on, shutter flash 2 f ·
//          2.522 NIKDO · 2.847 NEVYFOTIL · 3.236 the viewfinder glass shatters (shards fly at the camera)
//   3.654  whip into the 3D prompt panel (the real app recording, the prompt blurred), the camera flies along the line, cuts on the beats
//          4.072 / 4.490 / 4.907 / 5.325 · 4.670 JEDEN · 4.971 PROMPT · 5.150 tape-stop: the picture slows down and the panel collapses to a
//          line · 5.413 blackout (the music dies) until the drop (5.743, world 2)
// Every word is screen-anchored (common.ts place); camera keys are in seconds and checked by assertSorted().
import * as THREE from "three";
import type { World } from "../three/shot3d";
import { BG, LIME, V, aim, bursts, canvas, clamp, env, glowSprite, glowTex, imgTex, lerp, outBack, outCubic, place, placeCam, pulse, streak, type Burst, type Imp } from "./common";
import { S, T } from "./timing";
import { BM, FOCUS, type Key, type Media, type Src } from "./media";
import { lightShards, plateTex, shardsOf } from "./shapes";
import { D, mkBoard, mkPic, word3 } from "./kit";
import { assertSorted, camAt, pxWorld, showW, smooth, stage, type CamKey, type St } from "./util";
import { mkLayer, OV } from "./layers";

const st = (dx: number, dy: number, z: number, roll = 0, ry = 0, rx = 0): St => ({ p: [dx, dy], s: [0, 0], z, roll, ry, rx });
const sf = (n: number) => n / 60; // frames -> seconds (a key time is S.x or S.x + sf(n), never S.x + n)

// the hook's camera (px offset of the face layer, the frame's zoom, roll, yaw, pitch): it never stands (dz / dr drift on every key)
const KH: CamKey[] = assertSorted("hook", [
  { t: 0, st: st(0, -40, 1.8, 0.07, -0.1, 0.05), dz: 3.4, dr: -0.12 }, // frame 0 already flying in, fast push
  { t: S.cutA, st: st(-50, 90, 1.35, -0.05, 0.12, -0.04), dz: 0.9, dr: 0.06 }, // CUT A: wide
  { t: S.cutB, st: st(30, 0, 3.1, 0.06, -0.08, 0.03), dz: 0.5, dr: -0.04 }, // CUT B: the face, macro (the breakup lives here)
  { t: S.cutC, st: st(40, 60, 1.5, -0.09, 0.15, 0), dz: 1.1, dr: 0.07 }, // CUT C: wide, tilted, pushing
  { t: S.punch1, st: st(-30, -20, 2.4, 0.04, -0.1, 0.02), dz: 0.4, dr: -0.02 }, // punch
]);
// the prompt panel's camera (the panel is 1700 px wide: offset, zoom, roll, yaw, pitch)
const KP: CamKey[] = assertSorted("panel", [
  { t: S.panel, st: st(0, 40, 1.0, 0.02, -0.1, 0.04), dz: 0.25, dr: -0.03 },
  { t: S.p1, st: st(0, -40, 1.25, -0.03, 0.08, -0.03), dz: 0.2, dr: 0.04 },
  { t: S.p2, st: st(0, 60, 1.05, 0.03, -0.1, 0.05), dz: 0.35, dr: -0.05 },
  { t: S.p3, st: st(0, -20, 1.4, -0.02, 0.06, 0), dz: 0.3, dr: 0.03 },
  { t: S.p4, st: st(0, 30, 1.1, 0.03, -0.08, 0.03), dz: 0.3, dr: -0.04 },
]);

const IMPS: Imp[] = [
  { t: -0.03, power: 1.2 }, { t: S.cutA, power: 0.8 }, { t: S.kter, power: 0.4 }, { t: S.holka, power: 0.35 }, { t: S.cutB, power: 0.8 }, { t: S.neex, power: 0.4 },
  { t: S.dis, power: 0.9 }, { t: S.cutC, power: 0.8 }, { t: S.punch1, power: 0.5 }, { t: S.freeze, power: 1.0 }, { t: S.shutter, power: 1.1 }, { t: S.nikdo, power: 0.4 },
  { t: S.nevyf, power: 0.35 }, { t: S.shatter, power: 1.3 }, { t: S.panel, power: 0.9 }, { t: S.p1, power: 0.6 }, { t: S.p2, power: 0.6 }, { t: S.jeden, power: 0.4 },
  { t: S.p3, power: 0.6 }, { t: S.prompt, power: 0.3 }, { t: S.p4, power: 0.5 },
];
export const introSamples = (f: number) => {
  const near = (a: number, r0: number, r1: number) => f >= a - r0 && f <= a + r1;
  if (f < 8 || [T.cutA, T.cutB, T.cutC, T.punch1, T.freeze, T.shutter, T.panel, T.p1, T.p2, T.p3, T.p4].some((a) => near(a, 1, 5)) || near(T.dis, 0, 12) || near(T.shatter, 0, 22) || near(T.panel, 8, 8) || f >= T.tape) return 24;
  return 12;
};

// the oval that lets the face layer through (white inside, black outside; the face layer's alphaMap)
function maskTex() {
  const c = canvas(256, 256);
  const x = c.getContext("2d")!;
  x.fillStyle = "#000";
  x.fillRect(0, 0, 256, 256);
  const g = x.createRadialGradient(128, 128, 20, 128, 128, 128);
  g.addColorStop(0, "#fff");
  g.addColorStop(0.6, "#fff");
  g.addColorStop(1, "#000");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  const t = imgTex(c, false);
  t.center.set(0.5, 0.5);
  return t;
}
// the viewfinder: glass tint, lime corner brackets, thirds, the focus square, REC and the exposure line (a canvas, 608 x 1064)
function vfTex() {
  const W = 608, H = 1064;
  const c = canvas(W, H);
  const x = c.getContext("2d")!;
  x.fillStyle = "rgba(235,255,200,0.16)";
  x.fillRect(0, 0, W, H);
  x.strokeStyle = LIME;
  x.lineWidth = 12;
  const L = 96, p = 14;
  for (const [cx, cy, sx, sy] of [[p, p, 1, 1], [W - p, p, -1, 1], [p, H - p, 1, -1], [W - p, H - p, -1, -1]]) {
    x.beginPath();
    x.moveTo(cx + sx * L, cy);
    x.lineTo(cx, cy);
    x.lineTo(cx, cy + sy * L);
    x.stroke();
  }
  x.lineWidth = 2;
  x.strokeStyle = "rgba(198,255,0,0.55)";
  for (const k of [1, 2]) {
    x.beginPath();
    x.moveTo((W * k) / 3, 0);
    x.lineTo((W * k) / 3, H);
    x.moveTo(0, (H * k) / 3);
    x.lineTo(W, (H * k) / 3);
    x.stroke();
  }
  x.lineWidth = 6;
  x.strokeStyle = LIME;
  x.strokeRect(W / 2 - 60, H / 2 - 60, 120, 120);
  x.fillStyle = "#ff2a2a";
  x.beginPath();
  x.arc(58, 62, 12, 0, 7);
  x.fill();
  x.fillStyle = LIME;
  x.font = "500 34px 'Geist Mono'";
  x.textBaseline = "middle";
  x.fillText("REC", 84, 64);
  x.fillText("1/250  F2.8  ISO 100", 40, H - 54);
  return imgTex(c);
}

export function buildIntro(M: Media, SR: Record<Key, Src>): World {
  const { scene, camera, base, grid, BK, lights } = stage(new THREE.Color(BG));
  const FX = FOCUS.n6[0], FY = FOCUS.n6[1];
  // ── the hook: the background layer (blurred by the DOF, moves less) and the face layer (an oval cut-out, moves more) ──
  const mask = maskTex();
  const bg = mkLayer(scene, SR.n6, 0, D + 1.6);
  const face = mkLayer(scene, SR.n6, 1, D + 0.6, mask);
  const scan = streak(1100, 120);
  scene.add(scan.mesh);
  // the breakup: a lime wireframe over the face + particles that scatter and come home
  const wire = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 16, 22), new THREE.MeshBasicMaterial({ color: LIME, wireframe: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  wire.visible = false;
  scene.add(wire);
  const w0 = (wire.geometry.getAttribute("position") as THREE.BufferAttribute).array.slice() as Float32Array;
  const NP = 420;
  const pg = new THREE.BufferGeometry();
  const ppos = new Float32Array(NP * 3);
  pg.setAttribute("position", new THREE.BufferAttribute(ppos, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: LIME, size: 0.032, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  pts.frustumCulled = false;
  pts.visible = false;
  scene.add(pts);
  const hp = Array.from({ length: NP }, (_, i) => {
    const r = Math.sqrt((i * 0.6180339) % 1), a = i * 2.39996;
    return [r * Math.cos(a), r * Math.sin(a), Math.sin(i * 12.9898) * 0.5 + 0.5, Math.sin(i * 78.233) * 0.5 + 0.5];
  });
  // ── the print (a polaroid: white paper + the photo) and the viewfinder (glass + shards) ──
  const pic = mkPic(scene, SR.n6, 9 / 16, { depth: 0.05 });
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 1.98), new THREE.MeshBasicMaterial({ color: "#ECEEF0" }));
  paper.position.set(0, -0.09, 0.001);
  pic.g.add(paper);
  const vfT = vfTex();
  const vfG = new THREE.Group();
  vfG.visible = false;
  scene.add(vfG);
  const vfPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.75), new THREE.MeshBasicMaterial({ map: vfT, transparent: true, depthWrite: false }));
  vfG.add(vfPlane);
  const shardMat = new THREE.MeshBasicMaterial({ map: vfT, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const shards = shardsOf(1, 1.75, 5, 9, "vf").map((s, i) => {
    const m = new THREE.Mesh(s.geo, shardMat);
    m.position.copy(s.c);
    m.visible = false;
    vfG.add(m);
    const k = Math.sin(i * 12.9898) * 0.5 + 0.5, k2 = Math.sin(i * 78.233) * 0.5 + 0.5;
    return { m, c: s.c, v: V(s.c.x * (1.5 + 2 * k), s.c.y * (1.5 + 2 * k) + 0.4 * k2, 0.6 + 1.8 * k2), spin: V(k * 9 - 4, k2 * 9 - 4, k * 7 - 3) };
  });
  const LS = lightShards(60, "in", 1);
  scene.add(LS.group);
  // ── the prompt panel (the real recording's prompt field, the prompt blurred) + the cursor glow ──
  const board = mkBoard(scene, SR.typ, BM.typ.size, { glow: 0.5 });
  const cursor = glowSprite(glowTex("rgba(255,255,255,0.95)", "rgba(198,255,0,0.6)", "rgba(198,255,0,0)"));
  cursor.scale.setScalar(0.22);
  board.g.add(cursor);
  const lineBar = streak(1100, 60);
  scene.add(lineBar.mesh);
  // ── words ──
  const wT = word3(M, scene, "TAHLE"), wH = word3(M, scene, "HOLKA"), wN = word3(M, scene, "NEEXISTUJE", LIME, "#4f6600", 0.85, 0.35);
  const wK = word3(M, scene, "NIKDO"), wV = word3(M, scene, "NEVYFOTIL", LIME, "#4f6600", 0.85, 0.35);
  const wJ = word3(M, scene, "JEDEN"), wP = word3(M, scene, "PROMPT", LIME, "#4f6600", 0.85, 0.35);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: plateTex(), transparent: true, opacity: 0, depthWrite: false }));
  plate.renderOrder = 5;
  scene.add(plate);
  const BL: Burst[] = [{ t: 0.02, at: V(0, 0, 1.4), power: 2.0, lime: 0.7, up: 1 }, { t: S.cutB, at: V(0, 0, 1.4), power: 1.4, lime: 0.7 }, { t: S.freeze, at: V(0, 0.2, 1.4), power: 1.6, lime: 0.6 },
    { t: S.shutter, at: V(0, 0.2, 1.4), power: 1.4, lime: 0.8 }, { t: S.shatter, at: V(0, 0.2, 1.4), power: 1.8, lime: 0.7 }, { t: S.panel, at: V(0, 0, 1.4), power: 1.4, lime: 0.8 }];
  const BU = bursts(BL, 80, 0.022, "ib");
  scene.add(BU.points);
  // the stacked lines of a block of words: the y of each centre, from the top of the stack
  const stack = (ws: { w: number; h: number }[], wpx: number[], top: number, gap = 34) => {
    let y = top;
    return ws.map((w, i) => {
      const hp_ = (w.h * wpx[i]) / w.w;
      const c = y + hp_ / 2;
      y += hp_ + gap;
      return c;
    });
  };
  const WH = [620, 620, 620], WN = [594, 620], WJ = [600, 620];
  const yH = stack([wT, wH, wN], WH, 1180), yN = stack([wK, wV], WN, 1400), yJ = stack([wJ, wP], WJ, 1390);
  const bump8 = (t: number) => (t >= S.dis && t < S.dis + sf(8) ? Math.sin((Math.PI * (t - S.dis)) / sf(8)) : 0);

  const update = (t: number) => {
    const f60 = t * 60;
    const dk = t >= S.black ? 1 : 0; // the blackout
    const hookOn = t < S.freeze, printOn = t >= S.freeze && t < S.panel + 0.04, panelOn = t >= S.panel - sf(6) && t < S.black;
    const tc = t < S.tape ? t : S.tape + 0.12 * (1 - Math.exp(-(t - S.tape) * 12)); // the tape-stop: time slows down and stops
    const roll0 = 0.012 * Math.sin(t * 1.1);
    aim(base, V(0, 0, 6), V(0, 0, 0), 36, roll0);
    placeCam(camera, V(0.05 * Math.sin(t * 0.9), 0.04 * Math.sin(t * 0.7), 6), V(0, 0, 0), 36, roll0, t, IMPS, 0.008);
    lights(1 - dk);
    (scene.background as THREE.Color).set(dk ? "#000000" : BG);
    grid.mesh.visible = !dk;
    place(grid.mesh, base, 540, 960, grid.W, 1, D + 3, [0, 0, 0]);
    grid.set(t, 90, -150, "graphite", 1.3);
    BK.update(t);
    BK.mat.opacity = 0.45;
    BK.points.visible = !dk;
    BU.update(t);
    const bump = bump8(t);

    // ── the hook ──
    const cs = camAt(t, KH);
    const rx_ = 250 * cs.z, ry_ = 340 * cs.z;
    mask.repeat.set(Math.max(0.2, (0.5 * 1080 * OV) / rx_), Math.max(0.2, (0.5 * 1920 * OV) / ry_));
    const swim = 14 * Math.sin(t * 2.3);
    if (hookOn) {
      bg.set(base, Math.max(OV, cs.z * 0.9), FX, FY, { dx: cs.p[0] * 0.55, dy: cs.p[1] * 0.55 + swim * 0.5, roll: cs.roll, ry: cs.ry * 0.6, rx: cs.rx * 0.6, bright: 0.8 - 0.5 * bump });
      face.set(base, Math.max(OV, cs.z), FX, FY, { dx: cs.p[0], dy: cs.p[1] + swim, roll: cs.roll, ry: cs.ry, rx: cs.rx, bright: 1 - 0.7 * bump + (bump > 0 ? 0.35 * Math.sin(f60 * 9) : 0) });
    } else {
      bg.hide();
      face.hide();
    }
    scan.mesh.visible = hookOn && t > 0.1 && t < 0.85;
    if (scan.mesh.visible) {
      const u = (t - 0.1) / 0.75;
      place(scan.mesh, base, 540, lerp(520, 1400, u), 1200, 1, D - 0.5, [0, 0, -0.05]);
      scan.mat.opacity = 0.9 * Math.sin(Math.PI * u);
    }
    {
      // the breakup (0.917, 8 f): wireframe + particles around the face, then they come home
      const cx = 540 + cs.p[0], cy = 960 + cs.p[1] + swim, rxc = Math.min(rx_, 520), ryc = Math.min(ry_, 760);
      wire.visible = hookOn && bump > 0.02;
      pts.visible = wire.visible;
      if (wire.visible) {
        place(wire, base, cx, cy, 2 * rxc, 1, D - 0.5, [0, 0, cs.roll]);
        wire.scale.y *= ryc / rxc;
        (wire.material as THREE.MeshBasicMaterial).opacity = Math.min(1, bump * 1.4);
        const pa = wire.geometry.getAttribute("position") as THREE.BufferAttribute;
        for (let i = 0; i < pa.count; i++) {
          const k = Math.sin(i * 12.9898 + f60 * 3.1);
          pa.setXYZ(i, w0[i * 3] * (1 + 0.5 * bump * k), w0[i * 3 + 1] * (1 + 0.4 * bump * k), bump * 0.6 * Math.sin(i * 7.7 + f60));
        }
        pa.needsUpdate = true;
        const P = pxWorld(base, D - 0.7), q = V();
        hp.forEach((h, i) => {
          const s = bump * (1.2 + 2.5 * h[2]);
          P(cx + h[0] * rxc * (1 + s) + (h[3] - 0.5) * 220 * bump, cy + h[1] * ryc * (1 + s * 0.8) + (h[2] - 0.5) * 260 * bump, q);
          ppos[i * 3] = q.x;
          ppos[i * 3 + 1] = q.y;
          ppos[i * 3 + 2] = q.z + bump * h[3] * 0.8;
        });
        pg.attributes.position.needsUpdate = true;
        (pts.material as THREE.PointsMaterial).opacity = Math.min(1, bump * 1.6);
      }
    }
    // the words of the hook: TAHLE / HOLKA / NEEXISTUJE stacked low, in front of everything
    const hEnd = 1.7;
    showW(wT, base, t, S.kter, hEnd, 540, yH[0], WH[0], { from: 1.08, punch: [S.cutB], seed: 0.4, d: D - 1.2 });
    showW(wH, base, t, S.holka, hEnd, 540, yH[1], WH[1], { from: 1.08, punch: [S.cutB], seed: 1.1, d: D - 1.2 });
    showW(wN, base, t, S.neex, hEnd, 540, yH[2], WH[2], { from: 1.08, punch: [S.dis, S.cutC], seed: 2.3, d: D - 1.2 });
    showW(wK, base, t, S.nikdo, S.panel, 540, yN[0], WN[0], { from: 1.08, punch: [S.shatter], seed: 0.7, d: D - 1.2 });
    showW(wV, base, t, S.nevyf, S.panel, 540, yN[1], WN[1], { from: 1.08, punch: [S.shatter], seed: 1.9, d: D - 1.2 });
    showW(wJ, base, t, S.jeden, S.black, 540, yJ[0], WJ[0], { from: 1.08, punch: [S.p3], seed: 0.5, d: D - 1.2 });
    showW(wP, base, t, S.prompt, S.black, 540, yJ[1], WJ[1], { from: 1.08, punch: [S.p4], seed: 2.2, d: D - 1.2 });
    {
      const on = (t >= S.kter && t < hEnd) || (t >= S.nikdo && t < S.panel) || (t >= S.jeden && t < S.black);
      plate.visible = on;
      const yy = t < hEnd ? 1330 : t < S.panel ? 1520 : 1500;
      place(plate, base, 540, yy, 1500, 1, D - 0.8);
      (plate.material as THREE.MeshBasicMaterial).opacity = 0.7 * clamp((t - (t < hEnd ? S.kter : t < S.panel ? S.nikdo : S.jeden)) / 0.1);
    }

    // ── the print + the viewfinder ──
    const whipU = clamp((t - (S.panel - sf(6))) / sf(6));
    const dxOld = -1500 * smooth(whipU); // the old picture whips out to the left
    pic.g.visible = printOn && t < S.panel + 0.01 && !dk;
    if (pic.g.visible) {
      const a = t - S.freeze;
      const pop = lerp(1.5, 1, outBack(clamp(a / sf(7)), 1.3)) * (1 + 0.05 * pulse(t, S.shatter, 9) * (t >= S.shatter ? 1 : 0));
      place(pic.g, base, 540 + dxOld, 770 + 12 * Math.sin(t * 2.4), 560 * pop, 1, D, [0.06 + 0.03 * Math.sin(t * 1.7), -0.2 + 0.08 * Math.sin(t * 1.3) + 0.5 * (1 - outCubic(clamp(a / 0.25))), 0.04 * Math.sin(t * 1.9)]);
    }
    {
      const a = t - S.shutter;
      const intact = t >= S.shutter && t < S.shatter, broken = t >= S.shatter && t < S.panel + 0.01;
      vfG.visible = (intact || broken) && !dk;
      vfPlane.visible = intact;
      if (vfG.visible) {
        const pop = lerp(1.5, 1, outBack(clamp(a / sf(5)), 1.4));
        place(vfG, base, 540 + dxOld, 770 + 12 * Math.sin(t * 2.4), 700 * pop, 1, D - 0.3, [0.06 + 0.03 * Math.sin(t * 1.7), -0.2 + 0.08 * Math.sin(t * 1.3), 0.04 * Math.sin(t * 1.9)]);
      }
      const b = t - S.shatter;
      shardMat.opacity = broken ? Math.max(0, 1 - b / 0.4) : 1;
      for (const s of shards) {
        s.m.visible = broken;
        if (!broken) continue;
        const k = 1 - Math.exp(-5 * b);
        s.m.position.set(s.c.x + s.v.x * k, s.c.y + s.v.y * k - 0.5 * b * b, s.v.z * k);
        s.m.rotation.set(s.spin.x * b, s.spin.y * b, s.spin.z * b);
      }
      LS.update(t, S.shatter, V(0, 0.2, 1.3), 2.4, 0.6);
    }

    // ── the prompt panel ──
    board.g.visible = panelOn;
    lineBar.mesh.visible = false;
    if (panelOn) {
      const k = camAt(tc, KP);
      const prog = clamp((tc - S.panel) / (S.tape - S.panel));
      const viewX = lerp(380, 1340, prog * prog * (3 - 2 * prog) * 0.6 + prog * 0.4); // follows the cursor along the line
      const enter = 1500 * (1 - smooth(whipU));
      const collapse = smooth((t - S.tape) / sf(16));
      const z = k.z;
      place(board.g, base, 540 + enter + (850 - viewX) * 0.68 * z, 760 + k.p[1] * z, 1150 * z, 1, D, [k.rx + 0.015 * Math.sin(t * 1.3), k.ry + 0.03 * Math.sin(t * 1.7), k.roll]);
      board.g.scale.y *= 1 - 0.985 * collapse;
      SR.typ.set(Math.floor(clamp(prog) * (BM.typ.n - 1)));
      board.faceMat.color.setScalar(1 - 0.5 * collapse);
      board.rim.opacity = 0.15 + 0.2 * pulse(t, S.p1, 8) + 0.5 * collapse;
      const lx = BM.typ.line;
      const cp = board.local(lerp(lx[0], lx[2], clamp(prog * 1.05)), (lx[1] + lx[3]) / 2, 0.01);
      cursor.position.copy(cp);
      cursor.scale.setScalar(0.08 + 0.02 * Math.sin(t * 40));
      lineBar.mesh.visible = collapse > 0.05;
      if (lineBar.mesh.visible) {
        place(lineBar.mesh, base, 540, 760 + k.p[1] * z, 1100 * (1 - 0.3 * collapse), 1, D - 0.3);
        lineBar.mat.opacity = 0.9 * collapse;
      }
    }

    // ── the grade ──
    const fl = f60 < 4 ? [0.55, 0.35, 0.2, 0.08][Math.floor(f60)] : 0;
    const one = (t0: number, a: number, b = 0) => (t >= t0 && t < t0 + sf(1) ? a : t >= t0 + sf(1) && t < t0 + sf(2) ? b : 0);
    const gl = (t0: number, n = 3) => (t >= t0 && t < t0 + sf(n) ? 1 : 0);
    const glitch = Math.max(gl(S.cutA), gl(S.cutB), gl(S.cutC), gl(S.freeze, 2), gl(S.dis, 4), gl(S.shatter, 3), gl(S.p1, 2), gl(S.p2, 2));
    return {
      focus: t < S.freeze ? D + 0.6 : D,
      ap: t < S.freeze ? 38 : 12,
      flash: Math.max(fl, one(S.cutA, 0.3), one(S.cutB, 0.3), one(S.cutC, 0.3), one(S.freeze, 0.6, 0.25), one(S.shutter, 0.95, 0.5), one(S.shatter, 0.4, 0.15), one(S.panel, 0.3), env(t, IMPS, 30) * 0.05) * (1 - dk),
      ca: 0.3 + env(t, IMPS, 14) * 1.3 + (f60 < 3 ? 3 : 0) + glitch * 2.8 + bump * 3,
      glitch: glitch * 0.9,
      vig: 0.15 * clamp((t - S.tape) / sf(16)),
    };
  };
  return { scene, camera, update };
}
