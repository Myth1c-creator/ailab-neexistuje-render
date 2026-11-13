// Every time of the film "Tahle holka neexistuje" (script.md v1, BRUTAL EDIT; sound approved 2026-11-13). The film = the song cut from
// audio/cut.json (EsDeeKid - 4 Raws, 143.6 BPM, beat 0.4178 s, DROP 5.743 = "A", 15.353 s) with Jana's ONE continuous take (audio/vo.wav, never
// moved or cut; word times audio/vo-words.json: the 29 words of the take). Whole frames at 60 fps, TWO kinds of anchors:
//   - big words and labels come with Jana's words (WS(i)),
//   - hard changes (cuts, whips, flashes, punches, shakes) sit on the song's beats Bt(i) (+-1 f).
// Every camera key below is written in SECONDS only (S.x or S.x + n / 60); util.ts assertSorted() throws when the keys are not ordered.
import words from "../../audio/vo-words.json";
import cut from "../../audio/cut.json";

export const FPS = 60;
export const FRAMES = 921; // 15.350 s (the cut is 15.353 s)
export const BPM = cut.bpm; // 143.6
export const BEAT = cut.beat; // 0.4178
export const fr = (f: number) => f / FPS;

type Word = { word: string; start: number; end: number };
const WD = words as Word[];
if (WD.length !== 29) throw new Error("vo-words.json: expected the 29 words of the take");
export const WS = (i: number) => Math.round(WD[i].start * FPS);
export const WE = (i: number) => Math.round(WD[i].end * FPS);
export const Bt = (i: number) => Math.round(cut.beats[i] * FPS);
export const DROP = Math.round(cut.drop * FPS); // 345
if (Bt(13) !== DROP) throw new Error("beat 13 must be the drop");

// world boundaries (first frame of each): the intro (hook, print, prompt, blackout) | the drop (ten photos, the UI) | the CTA + the logo
export const F = { drop: DROP, cta: WS(24) };

export const T = {
  // ── hook (0-119): photo n6 in 2.5D, flying in from frame 0 ──
  kter: WS(0), //     12  0.200 TAHLE
  holka: WS(1), //    31  0.513 HOLKA
  neex: WS(2), //     52  0.861 NEEXISTUJE (lime)
  dis: WS(2) + 3, //  55  0.917 the face breaks up into lime wireframe / particles (4 f) and re-forms
  cutA: Bt(0), //     19  0.311 beat: hard cut, glitch
  cutB: Bt(1), //     44  0.729 beat: hard cut to the face
  cutC: Bt(2), //     69  1.147 beat: cut wide, tilted
  punch1: Bt(3), //   94  1.565 beat: punch
  // ── the print + the viewfinder (119-219) ──
  freeze: Bt(4), //  119  1.983 beat: the photo freezes into a print
  shutter: Bt(5), // 144  2.400 beat: the viewfinder snaps on, the shutter flash 2 f
  nikdo: WS(6), //   151  2.522 NIKDO
  nevyf: WS(7), //   171  2.847 NEVYFOTIL
  shatter: Bt(7), // 194  3.236 beat: the viewfinder glass shatters
  // ── the prompt panel (219-345) ──
  panel: Bt(8), //   219  3.654 beat: whip into the 3D prompt panel
  p1: Bt(9), //      244  4.072 beat: cut
  p2: Bt(10), //     269  4.490 beat: cut
  jeden: WS(10), //  280  4.670 JEDEN
  prompt: WS(11), // 298  4.971 PROMPT
  p3: Bt(11), //     294  4.907 beat: cut
  p4: Bt(12), //     320  5.325 beat: cut, the music dies (-30 dB from 5.413)
  tape: 309, //          5.150 tape-stop: the picture slows down and the panel collapses to a line
  black: 325, //         5.413 blackout
  // ── THE DROP (345 = 5.743 "A") ──
  drop: DROP,
  deset: WS(15), //  385  6.423 DESET slams (over photo 2)
  zhad: WS(16), //   447  7.444 ŽÁDNÁ
  neex2: WS(19), //  493  8.222 NEEXISTUJE
  zkam: WS(20), //   552  9.197 ŽÁDNÁ
  kamera: WS(21), // 581  9.685 KAMERA
  zate: WS(22), //   624 10.393 ŽÁDNÝ
  atelier: WS(23), // 650 10.834 ATELIÉR
  ui: Bt(23), //     595  9.921 beat: the ten photos are sucked into the AI LAB window (film burn)
  ui2: Bt(24), //    10.339 beat: UI camera cut
  ui3: Bt(25), //    10.757 beat: UI camera cut
  flip: Bt(26), //   671 11.175 beat: the panel turns 180 deg
  // ── the CTA (713 = 11.879) ──
  dej: WS(24), //    713 11.879
  follow: WS(25), // 727 12.123 FOLLOW (lime)
  pro: WS(26), //    747 12.448 PRO VÍC NOVINEK
  sweep1: Bt(31), // 796 13.264 beat: a sweep over FOLLOW
  lockup: Bt(32), // 821 13.682 beat: the AI LAB logo slams in
  sweep2: Bt(33), // 846 14.100 beat: a sweep over the logo (the last new thing)
  calm: Bt(34), //   871 14.517 the clean end card
  fade0: 900, //         15.000 the music's tail
  end: FRAMES,
};
// the ten photos of the drop: photo i starts on beat 13 + i
export const PS = (i: number) => Bt(13 + i);
export const S = Object.fromEntries(Object.entries(T).map(([k, v]) => [k, v / FPS])) as Record<keyof typeof T, number>;
