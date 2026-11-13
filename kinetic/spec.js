// spec.js: AI LAB "Tahle holka neexistuje" as a kinetic film, native 9:16, 60 fps, 143.6 BPM, 921 frames (15.350 s).
// The picture is one 3D film (src/Film.tsx: the intro 0-344 = the hook photo in 2.5D, the print + the viewfinder, the prompt panel, the
// tape-stop and the blackout; the drop 345-712 = the ten photos with ten transitions, the UI window; the CTA 713-920 = FOLLOW, the logo;
// rendered as public/hook/hook_###.jpg by the workflow's "hook" job) played full frame by Seq3D; every big word (TAHLE · HOLKA · NEEXISTUJE,
// NIKDO · NEVYFOTIL, JEDEN · PROMPT, DESET, ŽÁDNÁ · NEEXISTUJE, ŽÁDNÁ KAMERA · ŽÁDNÝ ATELIÉR, DEJ · FOLLOW · PRO VÍC NOVINEK), the
// counter 01-10, the photos, the UI window and the logo are inside the 3D. On top: the one-word captions in a white box (ad-captions:
// ../capwords.json in beats at 143.6 BPM; none under a word that is big on screen). The engine adds bloom and grain (post.py,
// BLOOM_LOCAL=1). Cuts mirror src/worlds/timing.ts and mix.py; the mix itself is kinetic/audio/master.wav (mix.py), the cues here only
// feed info.json and the checks.
import { Seq3D } from './blocks.js';

const FPS = 60, FRAMES = 921, BPM = 143.6;
const capWords = await fetch('../capwords.json').then(r => r.json());
// the hard changes (timing.ts T, frames): the hook's cuts, the print, the viewfinder, the shatter, the panel whip and its cuts, the drop, one cut per
// photo (every beat), the UI window, the CTA, FOLLOW, the logo
const cuts = [19, 44, 69, 119, 144, 194, 219, 244, 269, 294, 320, 345, 370, 395, 420, 445, 470, 495, 520, 545, 570, 595, 620, 645, 671, 713, 727, 821].map(f => f / FPS);

export default {
  title: 'AI LAB – Tahle holka neexistuje',
  bpm: BPM, beats: FRAMES * BPM / 3600, fps: FPS,
  palette: { bg: '#0B0D10', paper: '#ECEEF0', accent: '#C6FF00', hot: '#FF2A2A', ink: '#0B0D10' },
  hud: false,
  cues: [],
  scenes: [
    [Seq3D, 0, FRAMES * BPM / 3600, { seq: '../public/hook/hook_', n: FRAMES, cuts }],
  ],
  captions: [],
  // one word at a time in a white box: [[word, beat0, beat1]] (ad-captions, ../capwords.json)
  capWords,
};
