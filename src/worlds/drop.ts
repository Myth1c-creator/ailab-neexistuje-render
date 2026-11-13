// World 2, THE DROP (film 345-712, 5.743-11.867 s): the ten photos, the UI window, the words.
//   5.743 (drop, "A") the first photo hits out of the blackout: flash 2 f, shake 8 f, CA, a burst; the counter 01 in the corner
//   then one photo per beat (0.418 s, PS(i)), each with a DIFFERENT transition (KIND below): flash-cut, whip L, zoom-through, glitch slice,
//   shatter, whip up, light-leak burn, lime mask wipe, spin 90, RGB smear. Every photo keeps moving (a push on the face, a drift, a roll,
//   a punch on its beat); the picture strobes on the last beats.
//   6.423 DESET slams (over photo 2) · 7.444 ŽÁDNÁ · 8.222 NEEXISTUJE (over the photos) · 9.197 ŽÁDNÁ · 9.685 KAMERA (camera icon, struck out)
//   9.921 (beat) the ten photos are sucked into the AI LAB window (the real app recording on a 3D panel), film burn; the camera orbits
//   (10.339, 10.757) · 10.393 ŽÁDNÝ · 10.834 ATELIÉR (lamp icon, struck out) · 11.175 (beat) the panel turns 180 deg (the AI LAB mark)
// Camera keys are in seconds and checked by assertSorted(); the photos' times are the song's beats PS(i).
import * as THREE from "three";
import type { World } from "../three/shot3d";
import { BG, INK, LIME, PAPER, V, aim, bursts, canvas, clamp, env, glowSprite, glowTex, imgTex, inCubic, lerp, outBack, outCubic, place, placeCam, pulse, streak, type Burst, type Imp } from "./common";
import { PS, S, T } from "./timing";
import { BM, FOCUS, TEN, type Key, type Media, type Src } from "./media";
import { lightShards, ringTex, shardsOf } from "./shapes";
import { D, labelMesh, mkBoard, mkPic, word3 } from "./kit";
import { drawMark } from "./logo";
import { assertSorted, camAt, showW, smooth, stage, type CamKey, type St } from "./util";
import { mkLayer, OV, type LayerO } from "./layers";

const sf = (n: number) => n / 60;
const KIND = ["flash", "whipL", "zoom", "glitch", "shatter", "whipUp", "leak", "wipe", "spin", "smear"] as const;
const TR = [4, 6, 8, 5, 14, 6, 12, 9, 10, 8]; // frames of each incoming transition
const TS = TEN.map((_, i) => PS(i) / 60); // the photos' start times (s)
assertSorted("drop photos", TS.map((t) => ({ t })));
const UI_SUCK = 12; // frames the last photo needs to fly into the window

// each photo's own camera: a frame zoom on the face (push), a drift in px, a roll; every one moves, none stands
const Z0 = [2.0, 1.9, 2.2, 1.8, 2.1, 2.0, 1.9, 2.2, 2.0, 1.8].map((z, i) => Math.min(4.2, Math.max(z, (1.15 * OV) / (2 * FOCUS[TEN[i]][1])))), DZ = [0.7, 0.9, 0.6, 0.8, 0.7, 0.9, 0.6, 0.8, 0.7, 0.9];
const X0 = [-40, 50, -30, 40, -50, 30, -40, 50, -30, 40], VX = [90, -100, 80, -90, 100, -80, 90, -100, 80, -90];
const Y0 = [30, -40, 20, -30, 40, -20, 30, -40, 20, -30], VY = [-60, 70, -50, 60, -70, 50, -60, 70, -50, 60];
const R0 = [0.04, -0.05, 0.06, -0.04, 0.05, -0.06, 0.04, -0.05, 0.06, -0.04], VR = [-0.1, 0.12, -0.1, 0.1, -0.12, 0.1, -0.1, 0.12, -0.1, 0.1];
const photoCam = (i: number, t: number): { z: number; o: LayerO } => {
  const a = Math.max(0, t - TS[i]);
  return { z: Z0[i] + DZ[i] * a + 0.22 * Math.exp(-11 * a), o: { dx: X0[i] + VX[i] * a, dy: Y0[i] + VY[i] * a, roll: R0[i] + VR[i] * a } };
};

const st = (dx: number, dy: number, z: number, roll = 0, ry = 0, rx = 0): St => ({ p: [dx, dy], s: [0, 0], z, roll, ry, rx });
// the UI window's camera (the window is 1500 px wide): orbits, never stands
const KU: CamKey[] = assertSorted("ui", [
  { t: S.ui, st: st(0, 0, 0.9, 0.02, -0.15, 0.04), dz: 0.2, dr: -0.03 },
  { t: S.ui2, st: st(-40, 30, 1.0, -0.03, 0.12, -0.04), dz: 0.25, dr: 0.03 },
  { t: S.ui3, st: st(30, -20, 0.95, 0.03, -0.1, 0.05), dz: 0.3, dr: -0.04 },
  { t: S.flip, st: st(0, 0, 0.95, -0.04, 0, 0.05), dz: 0.3, dr: 0.02 },
]);

const IMPS: Imp[] = [
  { t: S.drop, power: 1.6 }, ...TS.slice(1).map((t, i) => ({ t, power: 0.55 + 0.05 * i })), { t: S.deset, power: 1.0 }, { t: S.zhad, power: 0.5 }, { t: S.neex2, power: 0.55 },
  { t: S.zkam, power: 0.5 }, { t: S.kamera, power: 0.45 }, { t: S.ui, power: 1.3 }, { t: S.ui2, power: 0.6 }, { t: S.zate, power: 0.45 }, { t: S.ui3, power: 0.6 },
  { t: S.atelier, power: 0.5 }, { t: S.flip, power: 1.0 },
];
export const dropSamples = (f: number) => {
  const near = (a: number, r0: number, r1: number) => f >= a - r0 && f <= a + r1;
  if (TS.some((t, i) => near(Math.round(t * 60), 1, TR[i] + 2)) || near(T.deset, 0, 6) || near(T.ui, 1, 20) || near(T.flip, 0, 30)) return 24;
  return 14;
};

function iconTex(kind: "cam" | "lamp") {
  const c = canvas(256, 256);
  const x = c.getContext("2d")!;
  x.strokeStyle = PAPER;
  x.fillStyle = PAPER;
  x.lineWidth = 12;
  x.lineJoin = "round";
  x.lineCap = "round";
  if (kind === "cam") {
    x.beginPath();
    x.roundRect(30, 84, 196, 126, 24);
    x.stroke();
    x.beginPath();
    x.arc(128, 148, 36, 0, 7);
    x.stroke();
    x.beginPath();
    x.roundRect(92, 56, 72, 28, 8);
    x.stroke();
    x.beginPath();
    x.arc(196, 112, 8, 0, 7);
    x.fill();
  } else {
    x.beginPath();
    x.moveTo(70, 50);
    x.lineTo(186, 50);
    x.lineTo(228, 140);
    x.lineTo(28, 140);
    x.closePath();
    x.stroke();
    x.beginPath();
    x.moveTo(128, 140);
    x.lineTo(128, 214);
    x.moveTo(128, 214);
    x.lineTo(84, 244);
    x.moveTo(128, 214);
    x.lineTo(172, 244);
    x.stroke();
  }
  return imgTex(c);
}
function xTex() {
  const c = canvas(256, 256);
  const x = c.getContext("2d")!;
  x.shadowColor = LIME;
  x.shadowBlur = 20;
  x.strokeStyle = LIME;
  x.lineWidth = 24;
  x.lineCap = "round";
  x.beginPath();
  x.moveTo(40, 40);
  x.lineTo(216, 216);
  x.moveTo(216, 40);
  x.lineTo(40, 216);
  x.stroke();
  return imgTex(c);
}
// the back of the window: lime, the AI LAB mark
function backTex() {
  const c = canvas(1024, 560);
  const x = c.getContext("2d")!;
  x.fillStyle = LIME;
  x.beginPath();
  x.roundRect(0, 0, 1024, 560, 40);
  x.fill();
  drawMark(x, 250, 150, 260, INK);
  x.fillStyle = INK;
  x.font = "700 190px 'Instrument Sans'";
  x.textBaseline = "middle";
  x.fillText("AI LAB", 530, 285);
  return imgTex(c);
}
const mk = (geo: THREE.BufferGeometry, mat: THREE.Material) => new THREE.Mesh(geo, mat);

export function buildDrop(M: Media, SR: Record<Key, Src>): World {
  const { scene, camera, base, grid, BK, lights } = stage(new THREE.Color(BG));
  const L = TEN.map((k, i) => mkLayer(scene, SR[k], i, D + 0.9, undefined, false));
  // ── transition pieces: shards of photo 4 (index 3), the light leak, the lime wipe bar, the shock rings ──
  const shMat = new THREE.MeshBasicMaterial({ map: L[3].mat.map, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const shG = new THREE.Group();
  shG.visible = false;
  scene.add(shG);
  const sh = shardsOf(1, 16 / 9, 6, 10, "ph").map((s, i) => {
    const m = mk(s.geo, shMat);
    m.renderOrder = 60;
    shG.add(m);
    const k = Math.sin(i * 12.9898) * 0.5 + 0.5, k2 = Math.sin(i * 78.233) * 0.5 + 0.5;
    return { m, c: s.c, v: V(s.c.x * (2 + 3 * k), s.c.y * (2 + 3 * k) + 0.5 * k2, 0.8 + 2.4 * k2), spin: V(k * 10 - 5, k2 * 10 - 5, k * 8 - 4) };
  });
  const leak = glowSprite(glowTex("rgba(255,244,214,1)", "rgba(255,170,70,0.75)", "rgba(255,110,30,0)"));
  leak.renderOrder = 70;
  leak.visible = false;
  scene.add(leak);
  const bar = mk(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: LIME, transparent: true, depthWrite: false }));
  bar.renderOrder = 71;
  bar.visible = false;
  scene.add(bar);
  const barS = streak(1, 1, "#ffffff");
  barS.mesh.renderOrder = 72;
  scene.add(barS.mesh);
  const ring = mk(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  ring.renderOrder = 73;
  scene.add(ring);
  const burn = glowSprite(glowTex("rgba(255,236,190,1)", "rgba(255,140,50,0.85)", "rgba(255,90,20,0)"));
  burn.renderOrder = 74;
  burn.visible = false;
  scene.add(burn);
  const LS = lightShards(70, "dr", 1);
  scene.add(LS.group);
  const BL: Burst[] = [{ t: S.drop, at: V(0, 0, 1.4), power: 2.4, lime: 0.6, up: 1.2 }, ...TS.slice(1).map((t) => ({ t, at: V(0, 0, 1.4), power: 0.9, lime: 0.6 })), { t: S.deset, at: V(0, -0.2, 1.4), power: 1.6, lime: 0.7 },
    { t: S.ui, at: V(0, 0.3, 1.4), power: 1.6, lime: 0.7 }, { t: S.flip, at: V(0, 0.3, 1.4), power: 1.4, lime: 0.8 }];
  const BU = bursts(BL, 60, 0.022, "db");
  scene.add(BU.points);
  // ── the counter 01-10 (top left, in front of everything) ──
  const cnt = TEN.map((_, i) => {
    const l = labelMesh(String(i + 1).padStart(2, "0"), { css: "700 64px 'Geist Mono'", color: LIME, w: 200, h: 100, bg: "rgba(11,13,16,0.9)" });
    l.mesh.visible = false;
    l.mesh.renderOrder = 80;
    scene.add(l.mesh);
    return l.mesh;
  });
  // ── the UI window: the app recording (4K click, Generovať) on a slab, the lime back with the mark; the nine photos fly into it ──
  const rig = new THREE.Group();
  rig.visible = false;
  scene.add(rig);
  const bR = mkBoard(scene, SR.res, BM.res.size);
  const bG = mkBoard(scene, SR.gen, BM.gen.size, { glow: 0.5 });
  rig.add(bR.g, bG.g);
  bR.g.visible = bG.g.visible = true;
  bR.g.position.set(0, 0.12, 0);
  bG.g.scale.setScalar(0.8);
  bG.g.position.set(0, -0.2, 0);
  const back = mk(new THREE.PlaneGeometry(1.14, 0.62), new THREE.MeshBasicMaterial({ map: backTex(), side: THREE.FrontSide }));
  back.position.set(0, 0, -0.07);
  back.rotation.y = Math.PI;
  rig.add(back);
  const thumbs = TEN.slice(0, 9).map((k, i) => {
    const p = mkPic(scene, SR[k], 9 / 16, { depth: 0.03 });
    const a = i * 0.7 + 0.4;
    return { p, x0: 540 + Math.cos(a) * (430 + 60 * (i % 3)), y0: 960 + Math.sin(a) * (620 + 90 * (i % 2)), t0: S.ui + sf(1.5 * i), rot: (i % 2 ? 1 : -1) * (0.5 + 0.1 * i) };
  });
  // ── words and icons ──
  const wD = word3(M, scene, "DESET", LIME, "#4f6600", 0.85, 0.35);
  const wZ = word3(M, scene, "ŽÁDNÁ"), wE = word3(M, scene, "NEEXISTUJE", LIME, "#4f6600", 0.85, 0.35);
  const wZ2 = word3(M, scene, "ŽÁDNÁ"), wKm = word3(M, scene, "KAMERA", LIME, "#4f6600", 0.85, 0.35);
  const wZ3 = word3(M, scene, "ŽÁDNÝ"), wAt = word3(M, scene, "ATELIÉR", LIME, "#4f6600", 0.85, 0.35);
  const icon = (kind: "cam" | "lamp") => {
    const g = new THREE.Group();
    const i = mk(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: iconTex(kind), transparent: true, depthWrite: false }));
    const xx = mk(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: xTex(), transparent: true, depthWrite: false }));
    xx.position.z = 0.01;
    g.add(i, xx);
    g.visible = false;
    g.name = `label:icon-${kind}`;
    scene.add(g);
    return { g, x: xx };
  };
  const icCam = icon("cam"), icLamp = icon("lamp");
  // side by side two words (one height): total width px, gap px -> the centres and widths
  const pair = (a: { w: number }, b: { w: number }, total: number, gap = 40) => {
    const s = (total - gap) / (a.w + b.w);
    return { wa: a.w * s, wb: b.w * s, xa: 540 - total / 2 + (a.w * s) / 2, xb: 540 + total / 2 - (b.w * s) / 2 };
  };
  const P1 = pair(wZ2, wKm, 640), P2 = pair(wZ3, wAt, 640);
  const hpx = (w: { w: number; h: number }, wpx: number) => (w.h * wpx) / w.w;
  const WDS = 594, WZ = 486, WE = 620; // DESET, ŽÁDNÁ, NEEXISTUJE at rest (px)
  const yZ = 1255 + hpx(wZ, WZ) / 2, yE = 1255 + hpx(wZ, WZ) + 38 + hpx(wE, WE) / 2;
  const LY = { cam: 1130, l1: 1300, lamp: 1460, l2: 1620 };

  const update = (t: number) => {
    const f60 = t * 60;
    const roll0 = 0.012 * Math.sin(t * 1.1);
    aim(base, V(0, 0, 6), V(0, 0, 0), 36, roll0);
    placeCam(camera, V(0.05 * Math.sin(t * 0.9), 0.04 * Math.sin(t * 0.7), 6), V(0, 0, 0), 36, roll0, t, IMPS, 0.008);
    lights(1);
    grid.mesh.visible = false;
    BK.points.visible = false;
    BU.update(t);
    const ui = t >= S.ui;
    leak.visible = false;
    bar.visible = false;
    barS.mesh.visible = false;
    shG.visible = false;
    let ca = 0, glitch = 0, flashT = 0;

    // ── the ten photos ──
    L.forEach((ly, i) => {
      const end = i === 3 ? TS[4] + 0.4 : i < 9 ? TS[i + 1] + sf(TR[i + 1]) : S.ui + sf(UI_SUCK); // photo 4 lives on as shards until 0.4 s after the shatter
      if (t < TS[i] || t >= end) return ly.hide();
      const { z, o } = photoCam(i, t);
      const oo: LayerO = { ...o, bright: 1, alpha: 1 };
      // incoming
      if (i > 0 && t < TS[i] + sf(TR[i])) {
        const u = clamp((t - TS[i]) / sf(TR[i])), e = smooth(u);
        switch (KIND[i]) {
          case "whipL": oo.dx! += 1150 * (1 - e); oo.roll! += 0.1 * (1 - e); break;
          case "zoom": oo.sc = lerp(0.5, 1, outCubic(u)); oo.alpha = clamp(u * 2.5); oo.ord = (i - 1) * 2 - 1; oo.dd = 0.0; break;
          case "glitch": oo.dx! += (Math.floor(f60) % 2 ? 1 : -1) * 70 * (1 - u); oo.bright = 1 + 0.5 * Math.sin(f60 * 7) * (1 - u); break;
          case "whipUp": oo.dy! += 2000 * (1 - e); oo.roll! -= 0.06 * (1 - e); break;
          case "leak": oo.alpha = smooth((u - 0.3) / 0.4); oo.bright = 1 + 0.9 * Math.sin(Math.PI * u); break;
          case "wipe": oo.wipe = 1 - outCubic(u); break;
          case "spin": oo.ry = u >= 0.5 ? lerp(-1.5, 0, clamp(u * 2 - 1)) : -1.5; oo.alpha = u >= 0.5 ? 1 : 0; break;
          case "smear": oo.dx! += 130 * (1 - e); oo.alpha = clamp(u * 1.5); break;
          default: break;
        }
      }
      if (i === 0) oo.bright = 1 + 1.6 * clamp(1 - (t - TS[0]) / sf(TR[0]));
      // outgoing (the next photo's transition) / the suck-in of the last one
      if (i < 9 && t >= TS[i + 1]) {
        const u = clamp((t - TS[i + 1]) / sf(TR[i + 1])), e = smooth(u);
        switch (KIND[i + 1]) {
          case "whipL": oo.dx! -= 1150 * e; oo.roll! -= 0.08 * e; break;
          case "zoom": oo.sc = lerp(1, 3.4, inCubic(u)); oo.alpha = 1 - clamp((u - 0.35) * 1.6); oo.ord = i * 2 + 5; break;
          case "whipUp": oo.dy! -= 2000 * e; break;
          case "leak": oo.bright = 1 + 0.9 * Math.sin(Math.PI * u); break;
          case "spin": oo.ry = lerp(0, 1.5, clamp(u * 2)); oo.alpha = u < 0.5 ? 1 : 0; break;
          case "smear": oo.dx! -= 130 * e; oo.alpha = 1 - 0.7 * u; break;
          default: break;
        }
      }
      if (i === 9 && ui) {
        const u = clamp((t - S.ui) / sf(UI_SUCK)), e = inCubic(u);
        oo.sc = lerp(1, 0.16, e);
        oo.dy = lerp(oo.dy!, -320, e);
        oo.dx = lerp(oo.dx!, 0, e);
        oo.roll = oo.roll! + 0.6 * e;
        oo.ry = 0.6 * e;
      }
      ly.set(base, Math.max(OV, z), FOCUS[TEN[i]][0], FOCUS[TEN[i]][1], oo);
      // photo 4 shatters under the next one: the plane gives way to the shards
      if (i === 3 && t >= TS[4]) {
        const a = t - TS[4];
        ly.mesh.visible = a < 0.0001;
        shG.visible = a < 0.4 && a >= 0;
        shG.position.copy(ly.mesh.position);
        shG.quaternion.copy(ly.mesh.quaternion);
        shG.scale.copy(ly.mesh.scale);
        shMat.opacity = Math.max(0, 1 - a / 0.4);
        const k = 1 - Math.exp(-5 * a);
        for (const s of sh) {
          s.m.position.set(s.c.x + s.v.x * k, s.c.y + s.v.y * k - 0.6 * a * a, s.v.z * k);
          s.m.rotation.set(s.spin.x * a, s.spin.y * a, s.spin.z * a);
        }
      }
    });
    // transition extras: the light leak (7th photo), the lime bar (8th), the grade values
    TS.forEach((t0, i) => {
      if (i === 0) return;
      const u = (t - t0) / sf(TR[i]);
      if (u < 0 || u >= 1) return;
      if (KIND[i] === "leak") {
        leak.visible = true;
        place(leak, base, lerp(1100, 700, u), lerp(120, 500, u), 3400 * (0.4 + 0.9 * outCubic(u)), 1, D - 0.5);
        (leak.material as THREE.MeshBasicMaterial).opacity = Math.sin(Math.PI * u);
        flashT = Math.max(flashT, 0.7 * Math.sin(Math.PI * u));
      }
      if (KIND[i] === "wipe") {
        const wx = -135 + (1 - outCubic(u)) * 1350;
        bar.visible = barS.mesh.visible = true;
        place(bar, base, wx, 960, 150, 1, D - 0.6);
        bar.scale.y = bar.scale.x * (2600 / 150);
        place(barS.mesh, base, wx, 960, 520, 1, D - 0.6, [0, 0, Math.PI / 2]);
        barS.mat.opacity = 0.9;
      }
      if (KIND[i] === "smear") ca = Math.max(ca, 10 * Math.sin(Math.PI * u));
      if (KIND[i] === "glitch") glitch = 1;
    });
    // ── counter ──
    cnt.forEach((m, i) => {
      const t1 = i < 9 ? TS[i + 1] : S.ui;
      m.visible = t >= TS[i] && t < t1;
      if (m.visible) place(m, base, 300, 235, 190 * lerp(1.25, 1, outBack(clamp((t - TS[i]) / sf(6)), 1.3)), 1, D - 1.4);
    });
    // ── the UI window ──
    rig.visible = ui;
    thumbs.forEach((th) => {
      const u = (t - th.t0) / sf(14);
      th.p.g.visible = ui && u >= 0 && u < 1;
      if (th.p.g.visible) {
        const e = inCubic(u);
        place(th.p.g, base, lerp(th.x0, 540, e), lerp(th.y0, 560, e), lerp(360, 50, e), 1, D - 0.5, [0.3 * (1 - u), th.rot * e, th.rot * (1 - u)]);
      }
    });
    if (ui) {
      const k = camAt(t, KU);
      const e = smooth((t - S.flip) / 0.45);
      const pop = lerp(0.6, 1, outBack(clamp((t - S.ui - sf(4)) / sf(10)), 1.3));
      rig.visible = t >= S.ui + sf(4);
      place(rig, base, 540 + k.p[0] * 0.5, 560 + k.p[1], 1000 * k.z * pop, 1, D, [k.rx + 0.015 * Math.sin(t * 1.3), k.ry * (1 - e) + Math.PI * e + 0.03 * Math.sin(t * 1.7), k.roll]);
      SR.res.set((t - (S.ui + sf(3))) * 30);
      SR.gen.set((t - (S.ui + 0.3)) * 30);
      bR.rim.opacity = 0.35 + 0.6 * pulse(t, S.ui2, 8) + 0.5 * pulse(t, S.flip, 8) * (t >= S.flip ? 1 : 0);
      burn.visible = t < S.ui + 0.5;
      if (burn.visible) {
        const u = (t - S.ui) / 0.5;
        place(burn, base, 540, 700, 3000 * (0.5 + outCubic(u)), 1, D - 0.5);
        (burn.material as THREE.MeshBasicMaterial).opacity = 1 - u;
        flashT = Math.max(flashT, 0.55 * (1 - clamp(u * 4)));
      }
    } else burn.visible = false;
    // ── the words, in front of everything ──
    showW(wD, base, t, S.deset, 7.22, 540, 1300, WDS, { from: 1.08, punch: [TS[3], TS[4]], seed: 0.6, d: D - 1.2 });
    showW(wZ, base, t, S.zhad, 9.13, 540, yZ, WZ, { from: 1.08, punch: [S.neex2, TS[7], TS[8]], seed: 1.4, d: D - 1.2 });
    showW(wE, base, t, S.neex2, 9.13, 540, yE, WE, { from: 1.08, punch: [TS[7], TS[8]], seed: 2.1, d: D - 1.2 });
    showW(wZ2, base, t, S.zkam, 11.70, P1.xa, LY.l1, P1.wa, { from: 1.08, punch: [S.ui], seed: 0.3, d: D - 1.2 });
    showW(wKm, base, t, S.kamera, 11.70, P1.xb, LY.l1, P1.wb, { from: 1.08, punch: [S.ui], seed: 1.0, d: D - 1.2 });
    showW(wZ3, base, t, S.zate, 11.70, P2.xa, LY.l2, P2.wa, { from: 1.08, punch: [S.flip], seed: 1.7, d: D - 1.2 });
    showW(wAt, base, t, S.atelier, 11.70, P2.xb, LY.l2, P2.wb, { from: 1.08, punch: [S.flip], seed: 2.5, d: D - 1.2 });
    // the icons (appear with the first word of their line) and their lime X (slams after the word)
    for (const [ic, t0, tx, y] of [[icCam, S.zkam, S.kamera + 0.45, LY.cam], [icLamp, S.zate, S.atelier + 0.45, LY.lamp]] as [typeof icCam, number, number, number][]) {
      ic.g.visible = t >= t0 && t < 11.70;
      if (!ic.g.visible) continue;
      place(ic.g, base, 540, y, 190 * lerp(1.5, 1, outBack(clamp((t - t0) / sf(7)), 1.3)), 1, D - 1.0, [0.1 * Math.sin(t * 1.3), 0.15 * Math.sin(t * 1.1), 0]);
      const xu = clamp((t - tx) / sf(6));
      ic.x.visible = xu > 0;
      ic.x.scale.setScalar(lerp(1.6, 1, outBack(xu, 1.4)));
    }
    // the shock rings: the drop, DESET
    const rr = [S.drop, S.deset].map((h) => t - h).find((d) => d >= 0 && d < 0.45);
    ring.visible = rr !== undefined;
    if (rr !== undefined) {
      place(ring, base, 540, 960, 300 + 2800 * outCubic(rr / 0.45), 1, D - 0.3);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - rr / 0.45);
    }
    LS.update(t, S.drop, V(0, 0, 1.2), 2.4, 0.8);

    // ── the grade ──
    const one = (t0: number, a: number, b = 0) => (t >= t0 && t < t0 + sf(1) ? a : t >= t0 + sf(1) && t < t0 + sf(2) ? b : 0);
    const dropFl = t >= S.drop && t < S.drop + sf(4) ? [1.0, 0.75, 0.45, 0.2][Math.floor((t - S.drop) * 60)] : 0;
    const beatFl = TS.slice(1).reduce((m, t0) => Math.max(m, one(t0, 0.3)), 0);
    const strobe = t >= TS[6] && t < S.ui && Math.floor(f60) % 5 === 0 ? 0.14 : 0;
    const beatCa = TS.slice(1).reduce((m, t0) => (t >= t0 && t < t0 + sf(3) ? 2.5 : m), 0);
    return {
      focus: D,
      ap: 0,
      flash: Math.max(dropFl, beatFl, strobe, flashT, one(S.deset, 0.45, 0.2), one(S.ui, 0.6, 0.3), one(S.flip, 0.5, 0.2), env(t, IMPS, 30) * 0.05),
      ca: 0.3 + env(t, IMPS, 14) * 1.3 + (t >= S.drop && t < S.drop + sf(3) ? 3.2 : 0) + beatCa + ca,
      glitch,
      vig: 0,
    };
  };
  return { scene, camera, update };
}
