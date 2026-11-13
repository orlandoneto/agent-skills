/**
 * Gera skills/ontoom/<id>/SKILL.md para o pack Video (100 ideias).
 * Pula se já existir id/name equivalente no catálogo ou pasta.
 *
 *   node scripts/seed-video-pack.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listSkillDirs, normalizeName } from "./lib/gates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ontoomRoot = path.join(root, "skills", "ontoom");

function titleFromId(id) {
  return id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** @type {{ id: string, goal: string, tags: string[] }[]} */
const PACK = [
  { id: "ai-video-generation", goal: "Plan and produce AI-generated video clips from briefs using user-provided models/APIs.", tags: ["video", "ai", "generation"] },
  { id: "remotion-video-generator", goal: "Scaffold Remotion compositions and generate programmatic videos from scripts.", tags: ["video", "remotion"] },
  { id: "remotion-video-toolkit", goal: "Apply Remotion best practices for markup, timing, audio, and render workflows.", tags: ["video", "remotion"] },
  { id: "open-montage", goal: "Orchestrate multi-tool open montage pipelines for agentic video production.", tags: ["video", "pipeline"] },
  { id: "video-cog", goal: "Break video tasks into cognitive steps: brief, storyboard, assets, edit, QC.", tags: ["video", "planning"] },
  { id: "video-agent", goal: "Act as a general video production agent coordinating scripts, visuals, and exports.", tags: ["video", "agent"] },
  { id: "avatar-video-messages", goal: "Produce short avatar-based video messages from a script and brand voice.", tags: ["video", "avatar"] },
  { id: "video-frames", goal: "Extract, sample, and annotate key frames for review, QC, and storyboarding.", tags: ["video", "frames"] },
  { id: "threejs-skills", goal: "Build Three.js scenes and camera moves suitable for rendered video output.", tags: ["video", "threejs", "3d"] },
  { id: "ffmpeg-video-processor", goal: "Process, convert, trim, and mux video/audio with FFmpeg recipes.", tags: ["video", "ffmpeg"] },
  { id: "text-to-video-cinematic", goal: "Turn text prompts into cinematic shot lists and text-to-video generation plans.", tags: ["video", "ai", "cinematic"] },
  { id: "image-to-video-animator", goal: "Animate still images into short motion clips with camera and subject motion.", tags: ["video", "ai", "animation"] },
  { id: "consistent-character-video", goal: "Keep character identity consistent across multi-shot AI video generations.", tags: ["video", "character", "ai"] },
  { id: "storyboard-to-scene", goal: "Convert storyboards into scene briefs, timings, and generation prompts.", tags: ["video", "storyboard"] },
  { id: "first-last-frame-bridge", goal: "Bridge first and last keyframes into a coherent interpolated video clip.", tags: ["video", "ai", "interpolation"] },
  { id: "looping-background-gen", goal: "Create seamless looping background videos for streams, sites, and ads.", tags: ["video", "loop", "background"] },
  { id: "slow-motion-interpolator", goal: "Plan high-quality slow-motion via frame interpolation and retiming.", tags: ["video", "slowmo", "ffmpeg"] },
  { id: "video-outpainting-extender", goal: "Extend frame edges (outpaint) to new aspect ratios without breaking subjects.", tags: ["video", "ai", "outpaint"] },
  { id: "style-transfer-video", goal: "Apply consistent artistic style transfer across video sequences.", tags: ["video", "style", "ai"] },
  { id: "depth-map-parallax", goal: "Create 2.5D parallax motion from images using depth maps.", tags: ["video", "parallax", "3d"] },
  { id: "drone-fpv-flythrough", goal: "Design FPV/drone-style flythrough camera paths for product or location shots.", tags: ["video", "camera", "fpv"] },
  { id: "dolly-zoom-vertigo", goal: "Specify and execute dolly-zoom (vertigo) camera effects in CG or edit.", tags: ["video", "camera"] },
  { id: "handheld-camera-shake", goal: "Add controlled handheld shake and organic camera motion to stabilised footage.", tags: ["video", "camera"] },
  { id: "macro-lens-detail", goal: "Plan macro detail shots that highlight textures and product craftsmanship.", tags: ["video", "macro", "product"] },
  { id: "timelapse-hyperlapse", goal: "Produce timelapse or hyperlapse sequences with stable pacing and exposure.", tags: ["video", "timelapse"] },
  { id: "orbit-360-product", goal: "Create 360° product orbit videos for ecommerce and ads.", tags: ["video", "product", "3d"] },
  { id: "crane-jib-reveal", goal: "Choreograph crane/jib reveal moves for hero product or location intros.", tags: ["video", "camera"] },
  { id: "anamorphic-lens-flare", goal: "Add tasteful anamorphic flares and cinematic lens character to shots.", tags: ["video", "vfx", "cinematic"] },
  { id: "low-angle-hero-shot", goal: "Compose low-angle hero shots that make subjects feel powerful and premium.", tags: ["video", "camera", "composition"] },
  { id: "rack-focus-transition", goal: "Design rack-focus transitions that shift attention between subjects.", tags: ["video", "camera", "edit"] },
  { id: "auto-silence-remover", goal: "Detect and remove silent gaps from talking-head or podcast video.", tags: ["video", "edit", "audio"] },
  { id: "video-upscaler-4k", goal: "Upscale footage toward 4K using user tools/APIs without inventing quality metrics.", tags: ["video", "upscale", "ai"] },
  { id: "ai-color-grading", goal: "Propose and apply AI-assisted color grades matched to a look reference.", tags: ["video", "color", "ai"] },
  { id: "object-inpainting-removal", goal: "Remove unwanted objects from video via inpainting while preserving motion.", tags: ["video", "inpaint", "ai"] },
  { id: "roto-background-remover", goal: "Isolate subjects with roto/background removal for compositing.", tags: ["video", "matting", "vfx"] },
  { id: "face-retouch-video", goal: "Apply subtle face retouching across video with natural skin and lighting.", tags: ["video", "retouch", "ai"] },
  { id: "smart-auto-reframe", goal: "Reframe horizontal video into vertical/square while tracking the subject.", tags: ["video", "reframe", "social"] },
  { id: "beat-sync-cutter", goal: "Cut and arrange clips on music beats for rhythm-driven edits.", tags: ["video", "edit", "music"] },
  { id: "video-stabilizer-pro", goal: "Stabilize shaky footage with sensible crop and motion preservation.", tags: ["video", "stabilize", "ffmpeg"] },
  { id: "watermark-logo-cleaner", goal: "Plan ethical watermark/logo cleanup only on footage the user owns or may alter.", tags: ["video", "cleanup", "ai"] },
  { id: "ai-lip-sync-dubbing", goal: "Lip-sync dubbed audio to face video using user keys and consented likenesses.", tags: ["video", "dubbing", "lipsync"] },
  { id: "multilingual-video-translator", goal: "Translate video scripts and captions into multiple languages with timing notes.", tags: ["video", "translation", "captions"] },
  { id: "voice-reply-tts", goal: "Generate TTS voice replies and sync them to short reply videos.", tags: ["video", "tts", "audio"] },
  { id: "foley-sound-generator", goal: "Design and generate foley/SFX beds that match on-screen actions.", tags: ["video", "foley", "audio"] },
  { id: "vocal-noise-isolator", goal: "Isolate vocals and reduce noise for dialogue-first video mixes.", tags: ["video", "audio", "cleanup"] },
  { id: "custom-bgm-composer", goal: "Compose or specify custom BGM beds matched to scene energy and length.", tags: ["video", "music", "audio"] },
  { id: "dynamic-auto-captions", goal: "Generate dynamic karaoke-style captions locked to word timestamps.", tags: ["video", "captions"] },
  { id: "audio-ducking-mixer", goal: "Duck music under dialogue with clean sidechain-style mix guidance.", tags: ["video", "audio", "mix"] },
  { id: "podcast-video-switcher", goal: "Edit multi-cam podcast video with speaker-aware switching.", tags: ["video", "podcast", "edit"] },
  { id: "binaural-spatial-audio", goal: "Plan binaural/spatial audio beds that enhance immersion in video.", tags: ["video", "audio", "spatial"] },
  { id: "ugc-creator-avatar", goal: "Produce UGC-style avatar creator videos for social ads.", tags: ["video", "ugc", "avatar"] },
  { id: "corporate-spokesperson", goal: "Create polished corporate spokesperson videos from approved scripts.", tags: ["video", "corporate", "avatar"] },
  { id: "photo-to-talking-head", goal: "Animate a still photo into a talking-head clip with consented likeness.", tags: ["video", "avatar", "ai"] },
  { id: "full-body-gesture-sync", goal: "Sync full-body gestures of an avatar to narration and beat timing.", tags: ["video", "avatar", "motion"] },
  { id: "virtual-influencer-persona", goal: "Define and produce a virtual influencer persona pack for recurring videos.", tags: ["video", "influencer", "avatar"] },
  { id: "emotion-expression-tuner", goal: "Tune facial emotion intensity to match script beats without uncanny extremes.", tags: ["video", "avatar", "performance"] },
  { id: "eye-contact-corrector", goal: "Correct eye contact / gaze in talking-head footage for camera engagement.", tags: ["video", "ai", "talking-head"] },
  { id: "clothing-swap-video", goal: "Plan clothing/wardrobe swaps in video for try-on or creative edits with consent.", tags: ["video", "fashion", "ai"] },
  { id: "multi-avatar-dialogue", goal: "Stage multi-avatar dialogue scenes with turn-taking and framing.", tags: ["video", "avatar", "dialogue"] },
  { id: "sign-language-interpreter", goal: "Add a sign-language interpreter inset or guide for accessible video versions.", tags: ["video", "accessibility"] },
  { id: "youtube-agent", goal: "Plan YouTube titles, thumbnails notes, chapters, and edit structure for uploads.", tags: ["video", "youtube", "distribution"] },
  { id: "instagram-reels-architect", goal: "Architect Instagram Reels hooks, pacing, and safe-zone layouts.", tags: ["video", "reels", "social"] },
  { id: "reddit-story-gameplay", goal: "Assemble Reddit-story + gameplay style short videos with captions.", tags: ["video", "shorts", "faceless"] },
  { id: "split-screen-retention", goal: "Design split-screen layouts that boost retention for short-form content.", tags: ["video", "edit", "retention"] },
  { id: "faceless-channel-automator", goal: "Automate faceless channel workflows: script, VO, b-roll, captions, export.", tags: ["video", "faceless", "automation"] },
  { id: "hook-visual-generator", goal: "Generate first-3-second visual hooks tailored to platform algorithms.", tags: ["video", "hooks", "social"] },
  { id: "listicle-countdown-maker", goal: "Build listicle/countdown short videos with clear numbered beats.", tags: ["video", "listicle", "shorts"] },
  { id: "before-after-reveal", goal: "Craft before/after reveal videos with wipe, slider, or smash cuts.", tags: ["video", "reveal", "ads"] },
  { id: "meme-reaction-inserter", goal: "Insert meme/reaction cutaways timed to punchlines in a main video.", tags: ["video", "meme", "edit"] },
  { id: "quiz-trivia-short", goal: "Produce quiz/trivia shorts with question cards, timers, and answers.", tags: ["video", "quiz", "shorts"] },
  { id: "product-demo-explainer", goal: "Build product demo explainers from screen recordings and narration.", tags: ["video", "product", "demo"] },
  { id: "virtual-try-on-fashion", goal: "Plan virtual try-on fashion videos from garment and model references.", tags: ["video", "fashion", "ai"] },
  { id: "3d-packaging-unboxing", goal: "Create 3D packaging unboxing/reveal animations for product launches.", tags: ["video", "3d", "product"] },
  { id: "real-estate-virtual-tour", goal: "Produce real-estate virtual tour videos from stills, scans, or walkthroughs.", tags: ["video", "real-estate"] },
  { id: "app-promo-mockup", goal: "Assemble app promo videos with device mockups and UI motion.", tags: ["video", "app", "promo"] },
  { id: "testimonial-ad-builder", goal: "Build testimonial ad videos from quotes, avatars, or approved footage.", tags: ["video", "ads", "testimonial"] },
  { id: "ugc-hook-ab-tester", goal: "Generate UGC hook variants and an A/B test matrix for paid social.", tags: ["video", "ugc", "testing"] },
  { id: "logo-reveal-intro", goal: "Design logo reveal intros with brand-safe motion and sound.", tags: ["video", "brand", "intro"] },
  { id: "lower-third-brand-kit", goal: "Create lower-third templates aligned to a brand kit.", tags: ["video", "brand", "graphics"] },
  { id: "call-to-action-outro", goal: "Produce CTA outros with clear next steps and brand end cards.", tags: ["video", "cta", "outro"] },
  { id: "whiteboard-doodle-explainer", goal: "Make whiteboard/doodle explainer videos from educational scripts.", tags: ["video", "explainer", "education"] },
  { id: "animated-infographic-chart", goal: "Animate infographic charts that visualise data clearly on video.", tags: ["video", "infographic", "data"] },
  { id: "historical-map-animator", goal: "Animate historical maps with routes, borders, and timeline callouts.", tags: ["video", "maps", "history"] },
  { id: "article-to-video-summary", goal: "Turn long articles into accurate short video summaries with sourced claims.", tags: ["video", "summary", "content"] },
  { id: "code-tutorial-visualizer", goal: "Visualise code tutorials with terminal, editor, and diagram motion.", tags: ["video", "dev", "tutorial"] },
  { id: "scientific-process-3d", goal: "Explain scientific processes with clear 3D/diagram video sequences.", tags: ["video", "science", "3d"] },
  { id: "kinetic-typography-quote", goal: "Animate kinetic typography quote videos matched to VO or music.", tags: ["video", "typography"] },
  { id: "slide-deck-to-video", goal: "Convert slide decks into narrated videos with transitions and timing.", tags: ["video", "slides", "presentation"] },
  { id: "book-summary-visual", goal: "Produce visual book-summary videos with chapter beats and key takeaways.", tags: ["video", "summary", "education"] },
  { id: "language-learning-flashcard", goal: "Create language-learning flashcard videos with spaced repetition pacing.", tags: ["video", "education", "language"] },
  { id: "pixel-art-animator", goal: "Animate pixel-art scenes and characters for retro-styled videos.", tags: ["video", "pixel", "animation"] },
  { id: "anime-cel-shaded", goal: "Produce anime/cel-shaded style video looks and shot plans.", tags: ["video", "anime", "style"] },
  { id: "claymation-stop-motion", goal: "Plan claymation/stop-motion style sequences with frame budgets.", tags: ["video", "stop-motion"] },
  { id: "cyberpunk-neon-noir", goal: "Grade and design cyberpunk neon-noir video atmospheres.", tags: ["video", "style", "cyberpunk"] },
  { id: "watercolor-ink-motion", goal: "Animate watercolor/ink motion graphics for soft editorial videos.", tags: ["video", "style", "illustration"] },
  { id: "origami-papercraft-world", goal: "Build origami/papercraft world motion for playful product stories.", tags: ["video", "style", "3d"] },
  { id: "vhs-retro-camcorder", goal: "Apply VHS/retro camcorder aesthetics with authentic artifacts.", tags: ["video", "style", "retro"] },
  { id: "comic-book-halftone", goal: "Render comic-book halftone panel videos from scripts or stills.", tags: ["video", "comic", "style"] },
  { id: "unreal-engine-photoreal", goal: "Plan Unreal Engine photoreal cinematics and render checklists.", tags: ["video", "unreal", "3d"] },
  { id: "glitch-datamosh-vfx", goal: "Add controlled glitch/datamosh VFX without destroying narrative clarity.", tags: ["video", "glitch", "vfx"] },
];

function existingSlugs() {
  const set = new Set();
  for (const { id, skillPath } of listSkillDirs(path.join(root, "skills"))) {
    set.add(normalizeName(id));
    try {
      const md = readFileSync(path.join(skillPath, "SKILL.md"), "utf8");
      const m = md.match(/^name:\s*(.+)$/m);
      if (m) set.add(normalizeName(m[1]));
    } catch {
      /* ignore */
    }
  }
  try {
    const catalog = JSON.parse(readFileSync(path.join(root, "catalog.json"), "utf8"));
    for (const s of catalog.skills || []) {
      set.add(normalizeName(s.id));
      set.add(normalizeName(s.name));
      for (const pref of [
        "ms",
        "aaron",
        "kostja",
        "claude",
        "seo",
        "aitmpl",
        "ck",
        "notque",
        "remotion",
        "bomx",
        "openmontage",
      ]) {
        const nid = normalizeName(s.id);
        if (nid.startsWith(`${pref}-`)) set.add(nid.slice(pref.length + 1));
      }
    }
  } catch {
    /* ignore */
  }
  return set;
}

function renderSkill(item) {
  const title = titleFromId(item.id);
  const desc = `${item.goal} Use when the user asks for ${item.id.replace(/-/g, " ")}, ${item.tags.join(", ")}, or related AI video production workflows.`;
  return `---
name: ${item.id}
description: >-
  ${desc}
license: MIT
---

# ${title}

## Goal

${item.goal}

## Inputs

- Creative brief, script, or reference links
- Target aspect ratio, duration, and platform
- Brand assets / voice notes when available
- API keys only when the user provides them (never invent credentials)

## Instructions

1. Clarify the deliverable (length, format, platform, style) before generating.
2. Prefer official APIs, exports, and documented CLIs over scraping or invented results.
3. Draft a short shot list or edit plan the user can approve.
4. Execute with the user's tools/keys; pause before paid API calls when cost is non-trivial.
5. QC: check framing, audio sync, captions, and claim accuracy before final export notes.

## Output

Production plan + prompts/commands + QC checklist (and file paths when generated locally).

## Rules

- Do not invent API results, render outputs, rankings, or metrics you cannot see.
- Prefer official APIs/exports; document exact commands and providers used.
- Paid APIs (HeyGen, Veo, Runway, ElevenLabs, fal.ai, etc.) require the user's own keys and explicit OK before spend.
- No illegal deepfake or impersonation of real people without clear consent; disclose synthetic presenters.
- Respect copyright, platform ToS, and privacy; do not strip watermarks from content the user does not own.
`;
}

const existing = existingSlugs();
let created = 0;
let skipped = 0;
const report = { created: [], skipped: [] };

for (const item of PACK) {
  const id = normalizeName(item.id);
  if (existing.has(id) || existsSync(path.join(ontoomRoot, id, "SKILL.md"))) {
    skipped += 1;
    report.skipped.push(id);
    continue;
  }

  const dir = path.join(ontoomRoot, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "SKILL.md"), renderSkill(item), "utf8");
  created += 1;
  report.created.push(id);
  existing.add(id);
}

mkdirSync(path.join(root, "staging"), { recursive: true });
writeFileSync(
  path.join(root, "staging", `seed-video-pack-${new Date().toISOString().slice(0, 10)}.json`),
  JSON.stringify(
    { created: report.created, skipped: report.skipped, totals: { created, skipped, pack: PACK.length } },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log(`OK: created ${created}, skipped ${skipped} (pack ${PACK.length})`);
