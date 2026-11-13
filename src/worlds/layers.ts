// Full-frame pictures as screen-anchored planes with a cover-fit crop (zoom, focus) and a transform (offset, scale, roll, yaw, wipe), so
// cuts, punch-ins, whips, spins and zoom-through transitions are moves of these planes, blurred by the shot's sub-frame samples.
// `zoom` = what the FRAME sees (1.3 = the plane's overscan, the smallest); the plane is OV x the frame, the crop follows it.
import * as THREE from "three";
import { clamp, place } from "./common";
import { fitRect, type Src } from "./media";

export const OV = 1.3;
export type LayerO = { dx?: number; dy?: number; sc?: number; roll?: number; ry?: number; rx?: number; bright?: number; alpha?: number; wipe?: number; ord?: number; dd?: number };
export type Layer = { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; src: Src; set: (base: THREE.PerspectiveCamera, zoom: number, fx: number, fy: number, o?: LayerO) => void; hide: () => void };

export function mkLayer(scene: THREE.Scene, src: Src, order: number, d: number, mask?: THREE.Texture, dw = true): Layer {
  const tex = src.view(9 / 16, 1);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: dw, ...(mask ? { alphaMap: mask, alphaTest: 0.3 } : {}) });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 16 / 9), mat);
  mesh.name = `full:${src.key}:${order}`;
  mesh.renderOrder = order;
  mesh.visible = false;
  scene.add(mesh);
  const set: Layer["set"] = (base, zoom, fx, fy, o = {}) => {
    mesh.visible = true;
    mesh.renderOrder = o.ord ?? order;
    const sc = o.sc ?? 1;
    place(mesh, base, 540 + (o.dx ?? 0), 960 + (o.dy ?? 0), 1080 * OV * sc, 1, d - 0.002 * order + (o.dd ?? 0), [o.rx ?? 0, o.ry ?? 0, o.roll ?? 0]);
    const r = fitRect(src.aspect, 9 / 16, [fx, fy], Math.max(1, zoom / OV));
    const u = clamp(o.wipe ?? 0, 0, 0.9999);
    const sx = mesh.scale.x;
    mesh.scale.x = sx * (1 - u);
    mesh.translateX((sx * u) / 2);
    tex.repeat.set(r.rx * (1 - u), r.ry);
    tex.offset.set(r.ox + r.rx * u, r.oy);
    mat.color.setScalar(o.bright ?? 1);
    mat.opacity = o.alpha ?? 1;
  };
  return { mesh, mat, src, set, hide: () => (mesh.visible = false) };
}
