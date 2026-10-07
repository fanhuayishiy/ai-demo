import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const style = readFileSync(
  new URL("../src/style.css", import.meta.url),
  "utf8",
);

function element(id, tag) {
  const result = html.match(
    new RegExp(`<${tag}\\b(?=[^>]*\\bid="${id}")[^>]*>([\\s\\S]*?)</${tag}>`),
  );
  assert.ok(result, `${id} is a native ${tag}`);
  assert.equal(html.match(new RegExp(`id="${id}"`, "g"))?.length, 1);
  return result[0];
}

test("sunset dock exposes labeled native flight and music actions", () => {
  const actions = {
    "sunset-prev": "上一段",
    "sunset-play": "暂停飞行",
    "sunset-restart": "重新开始",
    "sunset-next": "下一段",
    "sunset-camera": "机位：电影",
    "music-toggle": "开启配乐",
  };
  for (const [id, label] of Object.entries(actions)) {
    const button = element(id, "button");
    assert.match(button, /type="button"/);
    assert.ok(button.includes(label), `${id} has a visible action label`);
  }
  for (const id of [
    "sunset-play-label",
    "sunset-camera-label",
    "music-toggle-label",
  ]) {
    element(id, "span");
  }
  assert.match(element("music-toggle", "button"), /aria-pressed="false"/);
});

test("bootstrap shell shows no playback claim before scene startup and keeps bounded volume", () => {
  const volume = html.match(/<input\b(?=[^>]*\bid="music-volume")[^>]*>/)?.[0];
  assert.ok(volume, "music-volume is a native input");
  for (const attribute of [
    'type="range"',
    'min="0"',
    'max="100"',
    'value="35"',
    'aria-label="配乐音量"',
  ]) {
    assert.ok(volume.includes(attribute), `volume declares ${attribute}`);
  }
  const status = element("music-status", "span");
  assert.match(status, /原曲 · 未开启/);
  assert.doesNotMatch(status, /aria-live/);
});

test("song card credits the original artist, offers an explicit clip, and loads no iframe eagerly", () => {
  const source = element("music-source", "select");
  assert.match(source, /value="original"[\s\S]*原版整曲/);
  assert.match(source, /value="clip"[\s\S]*视频片段/);
  assert.match(element("music-card", "section"), /rumination[\s\S]*BAANDIT!/);
  assert.match(element("music-track-link", "a"), /https:\/\/soundcloud.com\/user-133547811\/rumination/);
  assert.match(element("music-player-mount", "div"), /hidden/);
  assert.doesNotMatch(html, /<iframe/);
  assert.match(element("music-player-details", "details"), /<summary>[\s\S]*官方播放器/);
  assert.match(readFileSync("src/main.js", "utf8"), /closest\("button,a,summary"\)/);
  element("notes-disclaimer", "p");
});

test("expanded desktop music player sits beside the aircraft instead of across its center", () => {
  assert.match(style, /@media\s*\(min-width:\s*1000px\)[\s\S]*\.soundtrack-card:has\(#music-player-mount:not\(\[hidden\]\)\)\s*\{[^}]*position:\s*absolute;[^}]*left:\s*0;[^}]*width:\s*350px/s);
});

test("only the reference edition shows the dock and suppresses its duplicate camera switch", () => {
  element("sunset-dock", "section");
  assert.match(style, /\.sunset-dock\s*\{[^}]*display:\s*none/s);
  assert.match(
    style,
    /\.reference-film\s+\.sunset-dock\s*\{[^}]*display:\s*flex/s,
  );
  assert.match(
    style,
    /\.reference-film\s+\.camera-switch\s*\{[^}]*display:\s*none/s,
  );
  assert.match(html, /<body class="reference-film">/);
});

test("the expanded footer participates in a stack below the dock", () => {
  assert.match(
    html,
    /class="sunset-controls-stack"[\s\S]*id="reference-shot"[\s\S]*id="sunset-dock"[\s\S]*id="film-controls"/,
  );
  assert.match(style, /\.sunset-controls-stack\s*\{[^}]*display:\s*contents/s);
  assert.match(
    style,
    /\.reference-film\s+\.sunset-controls-stack\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column/s,
  );
  assert.match(
    style,
    /\.reference-film\s+\.film-controls\s*\{[^}]*position:\s*relative/s,
  );
  assert.match(
    style,
    /\.reference-film\.controls-open\s+\.film-controls\s*\{[^}]*display:\s*block/s,
  );
  assert.match(html, /just breathe\./);
});

test("dock styling provides touch targets, focus visibility, and a compact two-row layout", () => {
  assert.match(
    style,
    /\.sunset-dock\s+button\s*\{[^}]*min-height:\s*44px;[^}]*min-width:\s*44px/s,
  );
  assert.match(style, /\.sunset-dock\s+button:focus-visible/);
  assert.match(
    style,
    /\.reference-film\s+\.sunset-dock\s*\{[^}]*max-width:\s*850px/s,
  );
  assert.match(
    style,
    /@media\s*\(max-width:\s*760px\)[\s\S]*\.reference-film\s+\.sunset-dock\s*\{[^}]*flex-direction:\s*column/s,
  );
  assert.match(style, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test("portrait tablets use the same two-row dock as narrow screens", () => {
  assert.ok(
    /@media\s*\(max-width:\s*760px\),\s*\(orientation:\s*portrait\)\s*\{/.test(
      style,
    ),
    "the dock's responsive breakpoint includes portrait orientation",
  );
});

test("reference toasts stay above controls while classic keeps its bottom placement", () => {
  const referenceRules = [
    ...style.matchAll(/\.reference-film\s+#toast\s*\{([^}]+)\}/g),
  ];
  assert.equal(
    referenceRules.length,
    2,
    "reference toast has desktop and narrow-screen rules",
  );
  assert.ok(
    /top:\s*110px/.test(referenceRules[0][1]),
    "desktop reference toast sits below the brand",
  );
  assert.ok(
    /bottom:\s*auto/.test(referenceRules[0][1]),
    "reference toast releases its old bottom anchor",
  );
  assert.ok(
    /top:\s*145px/.test(referenceRules[1][1]),
    "mobile reference toast clears the upper controls",
  );
  assert.ok(
    /^#toast\s*\{[^}]*bottom:\s*205px/m.test(style),
    "classic toast keeps its desktop position",
  );
});
