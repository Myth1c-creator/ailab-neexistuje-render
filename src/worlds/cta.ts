// CTA + logo (film 713-920, 11.883-15.350 s; adapted from ads/ailab-co-umi/src/worlds/cta.ts: "Dej follow pro víc novinek", FOLLOW in lime, no LAB).
// Graphite; the CTA column in the lower half, the logo in the upper half (after the column):
//   11.883 (DEJ) the world starts with DEJ slamming, ten photos orbit in the upper half (a carousel in the DOF)
//   12.123 FOLLOW shoots out of the carousel into the column, lime, 130 % -> 100 %, flash, a lime ring, shake 8 f, CA 2 f (on screen >= 1.5 s)
//   12.448 a smear writes PRO VÍC NOVINEK ("pro") · 12.846 (beat) a small punch · 13.264 (beat) a sweep over FOLLOW
//   13.682 (beat) the carousel bursts at the camera, the AI LAB lockup slams (the extruded mark + the wordmark, flash 2 f, a lime ring, rays)
//   14.100 (beat) a sweep over the logo (the last new thing) · from 14.517 the clean end card: a slow push (1.5 %/s), FOLLOW breathes on the beats,
//   the grid and the bokeh drift, the mark sways; the music's tail fades from 15.0 (the vignette deepens)
// Every word and the logo are screen-anchored; their sizes (px) are below and in check_text3d.py.
import * as THREE from "three";
import type { World } from "../three/shot3d";
import {
  BG, LIME, PAPER, V, aim, canvas, clamp, env, glowSprite, glowTex, imgTex, inCubic, letters3D, lerp, outBack, outCubic, place, placeCam, pulse, screenPoint,
  softShadow, streak, text3D, tw, type Imp,
} from "./common";
import { BEAT, S, fr } from "./timing";
import { TEN, type Key, type Media, type Src } from "./media";
import { mkPic } from "./kit";
import { bokeh, hudGrid, lightShards, rayFan, ringTex } from "./shapes";
import { markMesh } from "./logo";

const D = 5;
const C = { ramp1: S.dej, ctaPunch: 12.846, speechEnd: 13.458 }; // the anticipation, the small punch (beat 30), the last word ends
// the CTA column and the logo (frame px at rest, before the push-in)
export const CTA = {
  dej: { y: 935, w: 290 },
  follow: { y: 1105, w: 500 }, // FOLLOW <= 560 px even after the slow push (1.053 x) and the breathing
  pro: { y: 1270, w: 560 },
  logoY: 560,
  mark: { x: 352, w: 170 },
  word: { x: 632, w: 330 }, // the AI LAB wordmark
};
// the slow push of the whole CTA (1.5 %/s from the lockup) with a 2 % pull-back into the LAB slam
export const PUSH = (t: number) => (1 + 0.015 * Math.max(0, t - S.dej)) * (1 - 0.02 * tw(t, C.ramp1, S.follow, inCubic) * (t < S.follow ? 1 : 0));
const IMPACTS: Imp[] = [
  { t: S.lockup, power: 0.9 }, { t: S.dej, power: 0.9 }, { t: S.follow, power: 1.05 },
  { t: S.pro, power: 0.2 }, { t: C.ctaPunch, power: 0.25 },
];
export const ctaSamples = (f: number) => {
  const t = fr(f);
  const near = (a: number, r0: number, r1: number) => t >= a - r0 && t < a + r1;
  if (near(S.lockup, 0, 0.2) || near(S.follow, 0.05, 0.2)) return 24;
  if (t < S.calm) return 14;
  return 10;
};

function lineTex(s: string, css: string, color: string, w: number, h: number) {
  const c = canvas(w, h);
  const x = c.getContext("2d")!;
  x.font = css;
  x.fillStyle = color;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(s, w / 2, h / 2 + 2);
  return { tex: imgTex(c), frac: x.measureText(s).width / w };
}

export function buildCta(M: Media, SR: Record<Key, Src>): World {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  const camera = new THREE.PerspectiveCamera(36, 1080 / 1920, 0.05, 80);
  const base = new THREE.PerspectiveCamera(36, 1080 / 1920, 0.05, 80);
  scene.add(new THREE.HemisphereLight("#e8eef4", "#060708", 0.65));
  const key = new THREE.DirectionalLight("#fff4ea", 1.15);
  key.position.set(-3, 4, 6);
  const rimL = new THREE.DirectionalLight("#e2ffa0", 0.9);
  rimL.position.set(4, -1, 2);
  scene.add(key, rimL);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex("rgba(198,255,0,0.16)", "rgba(198,255,0,0.05)", "rgba(198,255,0,0)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(halo);
  const BK = bokeh(56, [3.6, 6.2, 2.2], V(0, 0, -4), V(0.35, 0.9, 0), 0.34, "ct", 0.45);
  BK.mat.opacity = 0.38;
  scene.add(BK.points);
  const grid = hudGrid(240);
  scene.add(grid.mesh);
  // the carousel of the ten photos (upper half), in the DOF
  const orb = new THREE.Group();
  scene.add(orb);
  const cards = TEN.map((k) => {
    const c = mkPic(scene, SR[k], 0.75, { depth: 0.02 });
    orb.add(c.g);
    c.g.visible = true;
    c.g.scale.setScalar(0.22);
    return c;
  });

  // ── the logo: the extruded mark and the AI LAB wordmark (Instrument Sans, the app's logotype) ──
  const mark = markMesh(0.24);
  const markG = new THREE.Group();
  markG.add(mark.mesh);
  markG.name = "logo:mark";
  scene.add(markG);
  const wm = lineTex("AI LAB", "700 150px 'Instrument Sans'", PAPER, 768, 200);
  const wordMat = new THREE.MeshStandardMaterial({ map: wm.tex, transparent: true, emissive: "#ffffff", emissiveMap: wm.tex, emissiveIntensity: 0.9, roughness: 0.4, alphaTest: 0.3 });
  const word = new THREE.Mesh(new THREE.PlaneGeometry(1, 200 / 768), wordMat);
  word.name = "logo:wordmark";
  scene.add(word);
  const logoRays = rayFan(16, 6, 0.6, "#efffcf", "lg");
  scene.add(logoRays.group);
  const logoRing = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  scene.add(logoRing);

  // ── the CTA type ──
  const mk = (s: string, face: string, side: string, fe = 0.3, se = 0.5) => {
    const w = text3D(M.font, s, { size: 1, depth: 0.3, face, side, faceEmissive: fe, sideEmissive: se });
    const g = new THREE.Group();
    g.name = `word:${s}`;
    g.add(w.mesh);
    const sh = softShadow(s, w.w, w.h);
    sh.mesh.position.set(0.05 * w.h, -0.09 * w.h, -0.5);
    g.add(sh.mesh);
    g.visible = false;
    scene.add(g);
    return { g, w: w.w, h: w.h, mats: w.mats };
  };
  const dej = mk("DEJ", PAPER, LIME);
  const lab = mk("FOLLOW", LIME, "#4f6600", 0.85, 0.35);
  const poslu = letters3D(M.font, "PRO VÍC NOVINEK", { size: 1, depth: 0.22, face: PAPER, side: LIME, faceEmissive: 0.3, sideEmissive: 0.45 });
  poslu.group.visible = false;
  poslu.group.name = "word:PRO VÍC NOVINEK";
  scene.add(poslu.group);
  const labGlow = glowSprite(glowTex("rgba(198,255,0,0.55)", "rgba(198,255,0,0.18)", "rgba(198,255,0,0)"));
  scene.add(labGlow);
  const labRing = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  scene.add(labRing);
  const smear = streak(1, 0.24);
  scene.add(smear.mesh);
  const sweep = streak(1, 0.3);
  scene.add(sweep.mesh);
  const LS = lightShards(50, "lb");
  scene.add(LS.group);

  const update = (t: number) => {
    const sway = Math.sin(t * 0.7);
    aim(base, V(0, 0, 6), V(0, 0, 0), 36, 0.012 * sway);
    // the real camera drifts a little (parallax for the bokeh), the anchored type rides with base
    placeCam(camera, V(0.06 * sway, 0.04 * Math.sin(t * 0.9), 6), V(0, 0, 0), 36, 0.012 * sway, t, IMPACTS, t > S.calm ? 0.004 : 0.007);
    const te = Math.max(0, t - C.speechEnd);
    const ts = Math.min(t, C.speechEnd);
    place(grid.mesh, base, 540, 960, grid.W, 1, D + 4, [0, 0, -0.05 + 0.04 * Math.sin(t * 0.4)]);
    grid.set(1, -230 * ts - 160 * te, 200 * ts + 130 * te, "graphite", 1.4);
    const Z = PUSH(t);
    const at = (x: number, y: number, w: number): [number, number, number] => [540 + (x - 540) * Z, 960 + (y - 960) * Z, w * Z];
    const punch = (t0: number, k: number) => k * pulse(t, t0, 8) * clamp((t - t0) * 60);
    const charge = clamp((t - C.ramp1) / (S.follow - C.ramp1)) * (t < S.follow ? 1 : 0);
    const beat = t >= S.follow + 0.3 ? 0.03 * Math.exp(-(((t - S.follow) % BEAT) * 9)) : 0;

    // ── the lockup (17.933): the mark from 160 %, the wordmark slides in from the right ──
    {
      const a = t - S.lockup;
      markG.visible = word.visible = logoRays.group.visible = a >= 0;
      const pop = lerp(1.6, 1, outBack(clamp(a / (7 / 60)), 1.4));
      const [x, y, w] = at(CTA.mark.x, CTA.logoY, CTA.mark.w * pop * (1 + punch(S.follow, 0.05) + 0.02 * Math.sin(t * 2.1)));
      place(markG, base, x, y, w, 2, D, [0.1 * Math.sin(t * 1.3), 0.25 * Math.sin(t * 0.9) + 0.6 * (1 - outCubic(clamp(a / 0.3))), 0]);
      mark.face.emissiveIntensity = 0.75 + 1.4 * pulse(t, S.lockup, 5) + 0.6 * charge;
      const inn = outCubic(clamp(a / (6 / 60)));
      const slam = lerp(1.3, 1, outBack(clamp(a / (8 / 60)), 1.3));
      const [wx, wy, ww] = at(lerp(900, CTA.word.x, inn), CTA.logoY, CTA.word.w * slam);
      place(word, base, wx, wy, ww / wm.frac, 1, D, [0.08 * Math.sin(t * 1.3), 0.12 * Math.sin(t * 0.9), 0]);
      wordMat.opacity = inn;
      wordMat.emissiveIntensity = 0.9 + 1.2 * charge + 0.8 * pulse(t, S.follow, 6) * (t >= S.follow ? 1 : 0);
      logoRays.group.position.copy(screenPoint(base, ...(at(540, CTA.logoY, 0).slice(0, 2) as [number, number]), D + 1.2));
      logoRays.group.quaternion.copy(base.quaternion);
      logoRays.group.rotateZ(0.25 * a);
      logoRays.mats.forEach((m, i) => (m.opacity = (0.05 + 0.3 * Math.exp(-a * 4) + 0.15 * charge) * (0.7 + 0.3 * Math.sin(i + t))));
      const r = a;
      logoRing.visible = r >= 0 && r < 0.4;
      if (logoRing.visible) {
        const [lx, ly] = at(540, CTA.logoY, 0);
        place(logoRing, base, lx, ly, 300 + 1700 * outCubic(r / 0.4), 1, D + 0.2);
        (logoRing.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - r / 0.4);
      }
    }

    // ── the CTA column ──
    for (const [w, t0, y, wpx] of [[dej, S.dej, CTA.dej.y, CTA.dej.w]] as [typeof dej, number, number, number][]) {
      const a = t - t0;
      w.g.visible = a >= 0;
      if (!w.g.visible) continue;
      const slam = lerp(1.25, 1, outBack(clamp(a / (8 / 60)), 1.2));
      const [x, yy, ww] = at(540 + 10 * Math.sin(t * 1.1 + y), y, wpx * slam * (1 + punch(S.follow, 0.03)));
      place(w.g, base, x, yy, ww, w.w, D, [0.12 + 0.04 * Math.sin(t * 1.5), -0.16 * Math.sin(t * 1.3 + y * 0.01), 0]);
    }
    // FOLLOW: shoots out of the wordmark (5 frames), lime, 130 % -> 100 %, breathes on the beats
    {
      const a = t - S.follow;
      lab.g.visible = a >= 0;
      labGlow.visible = a >= 0;
      if (lab.g.visible) {
        const fly = outCubic(clamp(a / (5 / 60)));
        const slam1 = lerp(1.3, 1, outBack(clamp((a - 4 / 60) / (8 / 60)), 1.2));
        const [x0, y0] = at(540, CTA.follow.y - 170, 0);
        const [x1, y1] = at(540, CTA.follow.y + 6 * Math.sin(t * 2.1), 0);
        const wpx = CTA.follow.w * Z * lerp(0.3, 1, fly) * slam1 * (1 + beat + punch(C.ctaPunch, 0.03));
        place(lab.g, base, lerp(x0, x1, fly), lerp(y0, y1, fly), wpx, lab.w, D, [0.14 + 0.05 * Math.sin(t * 1.7), -0.18 * Math.sin(t * 1.25), 0]);
        (lab.mats[0] as THREE.MeshStandardMaterial).emissiveIntensity = 0.85 + 0.9 * pulse(t, S.follow, 6) + 0.5 * pulse(t, S.sweep1, 5) * (t >= S.sweep1 ? 1 : 0);
        const gp = screenPoint(base, lerp(x0, x1, fly), lerp(y0, y1, fly), D + 0.4);
        labGlow.position.copy(gp);
        labGlow.quaternion.copy(base.quaternion);
        labGlow.scale.set(wpx * 0.0035 * 1.4, wpx * 0.0016 * 1.4, 1);
        (labGlow.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.4 * pulse(t, S.follow, 5) + 4 * beat;
      }
      const r = t - S.follow;
      labRing.visible = r >= 0 && r < 0.4;
      if (labRing.visible) {
        const [x, y] = at(540, CTA.follow.y, 0);
        place(labRing, base, x, y, 300 + 1500 * outCubic(r / 0.4), 1, D + 0.2);
        (labRing.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - r / 0.4);
      }
      LS.update(t, t >= S.lockup ? S.lockup : S.follow, screenPoint(base, ...(at(540, t >= S.lockup ? CTA.logoY : CTA.follow.y, 0).slice(0, 2) as [number, number]), D - 0.3), 1.2, 0.6);
    }
    // PRO VÍC NOVINEK: a smear crosses the line and every letter appears as it passes
    {
      const a = t - S.pro;
      poslu.group.visible = a >= 0;
      const sp = clamp(a / 0.2);
      if (poslu.group.visible) {
        const [x, y, w] = at(540, CTA.pro.y, CTA.pro.w * (1 + punch(C.ctaPunch, 0.03)));
        place(poslu.group, base, x, y, w, poslu.w, D, [0.1, -0.08 * Math.sin(t * 0.9), 0]);
        for (const it of poslu.items) {
          const u = clamp((sp - (it.home.x / poslu.w + 0.5)) / 0.08);
          it.mesh.visible = u > 0;
          it.mesh.scale.setScalar(lerp(1.4, 1, outCubic(u)));
          it.mesh.position.copy(it.home).add(V(0, 0.25 * (1 - outCubic(u)), 0));
        }
      }
      smear.mesh.visible = a >= 0 && a < 0.26;
      if (smear.mesh.visible) {
        const [x, y] = at(lerp(160, 940, clamp(a / 0.22)), CTA.pro.y, 0);
        place(smear.mesh, base, x, y, 520, 1, D - 0.4, [0, 0, -0.12]);
        smear.mat.opacity = 0.85 * Math.sin(Math.PI * clamp(a / 0.26));
      }
    }
    // the sweeps (19.350 over FOLLOW, 20.067 over the logo)
    {
      const k = [S.sweep1, S.sweep2].map((s, i) => [t - s, i] as [number, number]).find(([d]) => d >= 0 && d < 0.3);
      sweep.mesh.visible = !!k;
      if (k) {
        const u = k[0] / 0.3;
        const yy = k[1] === 0 ? CTA.follow.y : CTA.logoY;
        const [x, y] = at(lerp(180, 900, u), yy, 0);
        place(sweep.mesh, base, x, y, 620, 1, D - 0.4, [0, 0, 0.5]);
        sweep.mat.opacity = 0.8 * Math.sin(u * Math.PI);
      }
    }
    {
      // the carousel: orbits until the lockup, then bursts at the camera
      orb.visible = t >= S.dej && t < S.lockup + 0.3;
      if (orb.visible) {
        const bu = clamp((t - S.lockup) / 0.3);
        const [ox, oy, ow] = at(540, 520, 1000 * (1 + 2.2 * outCubic(bu)) * lerp(0.6, 1, outBack(clamp((t - S.dej) / 0.2), 1.2)));
        place(orb, base, ox, oy, ow, 1, D, [0.35, 0, 0.08 * Math.sin(t)]);
        cards.forEach((c, i) => {
          const th = (i / 10) * Math.PI * 2 + t * 1.1;
          c.g.position.set(Math.cos(th) * 0.36, 0.03 * Math.sin(th * 3), Math.sin(th) * 0.36);
          c.g.rotation.set(0, Math.PI / 2 - th, 0);
        });
      }
    }
    place(halo, base, 540, 760, 1700, 1, D + 3);
    (halo.material as THREE.MeshBasicMaterial).opacity = 0.8 + 0.4 * pulse(t, S.follow, 3) * (t >= S.follow ? 1 : 0) + 0.1 * Math.sin(t * 2.2);
    BK.update(t);

    const fl = (t0: number, a: number, b: number) => (t >= t0 && t < t0 + 1 / 60 ? a : t >= t0 + 1 / 60 && t < t0 + 2 / 60 ? b : 0);
    return {
      focus: D,
      ap: 6,
      flash: Math.max(fl(S.dej, 0.5, 0.25), fl(S.lockup, 0.9, 0.45), fl(S.follow, 0.4, 0.15), env(t, IMPACTS, 30) * 0.05),
      ca: 0.3 + env(t, IMPACTS, 14) * 1.1 + (t >= S.dej && t < S.dej + 3 / 60 ? 3 : 0) + (t >= S.follow && t < S.follow + 2 / 60 ? 2.4 : 0) + (t >= S.lockup && t < S.lockup + 3 / 60 ? 2.6 : 0),
      glitch: 0,
      vig: 0.1 * tw(t, S.fade0, S.end),
    };
  };
  return { scene, camera, update };
}
