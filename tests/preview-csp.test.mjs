import assert from 'node:assert/strict';
import test from 'node:test';
import { parse } from 'parse5';
import * as implementation from '../scripts/preview-csp.mjs';

const provider = 'https://busuanzi.ibruce.info';

function patch(html) {
  assert.equal(typeof implementation.patchPreviewCsp, 'function', 'patchPreviewCsp must be implemented');
  return implementation.patchPreviewCsp(html);
}

function* nodes(node) {
  yield node;
  for (const child of node.childNodes ?? []) yield* nodes(child);
}

function contents(html) {
  return [...nodes(parse(html))].filter((node) => node.tagName === 'meta'
    && node.attrs.some(({ name, value }) => name === 'http-equiv' && value.toLowerCase() === 'content-security-policy'))
    .map((node) => node.attrs.find(({ name }) => name === 'content')?.value);
}

function directives(policy) {
  const result = new Map();
  for (const part of policy.split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/u);
    if (name && !result.has(name.toLowerCase())) result.set(name.toLowerCase(), sources);
  }
  return result;
}

const page = (policy) => `<!doctype html><html lang="en"><head><meta http-equiv="Content-Security-Policy" content="${policy}"><title>Keep &amp; title</title></head><body>🍃\r\n<script>const markup = '<meta content="fake">';</script></body></html>`;

test('leaves pages with no CSP byte-for-byte unchanged', () => {
  const html = '<!doctype html><head><meta name="description" content="default-src none"><meta http-equiv="Content-Security-Policy-Report-Only" content="default-src none"></head><body>Keep</body>';
  assert.equal(patch(html), html);
});

test('ignores fake CSP markup inside comments, scripts and inert templates', () => {
  const fake = '<meta http-equiv="Content-Security-Policy" content="default-src none">';
  const html = `<!doctype html><head><!-- ${fake} --><script>const example = '${fake}';</script><template>${fake}</template></head><body>Keep</body>`;
  assert.equal(patch(html), html);
});

for (const [name, value] of [
  ['leading space', ' Content-Security-Policy'],
  ['trailing space', 'Content-Security-Policy '],
  ['surrounding spaces', ' content-security-policy '],
  ['leading tab', '\tContent-Security-Policy'],
  ['trailing tab', 'Content-Security-Policy\t'],
  ['line feeds', '\nContent-Security-Policy\n'],
  ['carriage returns', '\rContent-Security-Policy\r'],
  ['form feeds', '\fContent-Security-Policy\f'],
  ['encoded whitespace', '&#9;Content-Security-Policy&#32;'],
]) {
  test(`leaves padded non-enforcing http-equiv values byte-for-byte unchanged: ${name}`, () => {
    const html = `<!doctype html><head><meta http-equiv="${value}" content="default-src &#39;none&#39;" data-keep="yes"></head><body>Keep\r\n</body>`;
    assert.equal(patch(html), html);
  });
}

const bodyCsp = '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;" data-keep="yes">';
for (const [name, body] of [
  ['direct body child after an explicit empty head', bodyCsp],
  ['nested body descendant', `<section>${bodyCsp}</section>`],
  ['stray head markup inside the body', `<head>${bodyCsp}</head>`],
]) {
  test(`leaves non-enforcing CSP byte-for-byte unchanged: ${name}`, () => {
    const html = `<!doctype html><html><head></head><body>Keep\r\n${body}</body></html>`;
    assert.equal(patch(html), html);
  });
}

test('patches a head CSP without changing the body CSP in the same document', () => {
  const html = `<!doctype html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'"></head><body>${bodyCsp}</body>`;
  const expected = `<!doctype html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${provider}; frame-src 'self'; media-src blob:"></head><body>${bodyCsp}</body>`;
  assert.equal(patch(html), expected);
});

test('patches an enforcing CSP in an implicit head without adding head markup', () => {
  const html = '<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;"><main>Keep</main>';
  const expected = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${provider}; frame-src 'self'; media-src blob:"><main>Keep</main>`;
  assert.equal(patch(html), expected);
});

test('patches only the real content value while retaining all surrounding HTML bytes', () => {
  const policy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:";
  const html = page(policy);
  const expected = "default-src 'none'; script-src 'unsafe-inline' " + provider
    + "; style-src 'unsafe-inline'; img-src data: blob:; frame-src 'self'; media-src blob:";
  assert.equal(patch(html), page(expected));
  const result = directives(contents(patch(html))[0]);
  assert.deepEqual(result.get('default-src'), ["'none'"]);
  assert.deepEqual(result.get('style-src'), ["'unsafe-inline'"]);
  assert.deepEqual(result.get('img-src'), ['data:', 'blob:']);
  assert.equal(result.has('connect-src'), false);
});

test('extends script-src-elem only when it already exists', () => {
  const original = "default-src 'none'; script-src 'self' 'nonce-abcd'; script-src-elem https://cdn.example.test 'sha256-abc'; frame-src 'none'; media-src 'none'";
  const result = directives(contents(patch(page(original)))[0]);
  assert.deepEqual(result.get('script-src'), ["'self'", "'nonce-abcd'", provider]);
  assert.deepEqual(result.get('script-src-elem'), ['https://cdn.example.test', "'sha256-abc'", provider]);
  assert.deepEqual(result.get('frame-src'), ["'self'"]);
  assert.deepEqual(result.get('media-src'), ['blob:']);
  assert.equal(directives(contents(patch(page("default-src 'self'")))[0]).has('script-src-elem'), false);
});

test('preserves every default source when materializing script, frame and media restrictions', () => {
  const original = "default-src 'self' https://assets.example.test data:; style-src 'unsafe-inline'; object-src 'none'";
  const result = directives(contents(patch(page(original)))[0]);
  assert.deepEqual(result.get('default-src'), ["'self'", 'https://assets.example.test', 'data:']);
  assert.deepEqual(result.get('script-src'), ["'self'", 'https://assets.example.test', 'data:', provider]);
  assert.deepEqual(result.get('frame-src'), ["'self'", 'https://assets.example.test', 'data:']);
  assert.deepEqual(result.get('media-src'), ["'self'", 'https://assets.example.test', 'data:', 'blob:']);
  assert.deepEqual(result.get('object-src'), ["'none'"]);
});

test('frame-src inherits child-src before default-src', () => {
  const original = "default-src https://default.example.test; child-src https://child.example.test blob:; media-src https://media.example.test";
  const result = directives(contents(patch(page(original)))[0]);
  assert.deepEqual(result.get('frame-src'), ['https://child.example.test', 'blob:', "'self'"]);
  assert.deepEqual(result.get('child-src'), ['https://child.example.test', 'blob:']);
  assert.deepEqual(result.get('media-src'), ['https://media.example.test', 'blob:']);
});

test('does not introduce restrictions where an absent directive has no fallback', () => {
  for (const original of ['', "img-src data:; style-src 'unsafe-inline'", 'upgrade-insecure-requests; base-uri https://example.test']) {
    const html = page(original);
    assert.equal(patch(html), html);
  }
});

test('preserves unrelated directive bytes, including report URLs with entities', () => {
  const original = "default-src 'none';  script-src   'unsafe-inline'  ;\n\tconnect-src https://api.example.test; report-uri /csp?a=1&amp;b=2; sandbox allow-scripts; worker-src blob:; base-uri 'none'";
  const output = patch(page(original));
  assert.ok(output.includes(";\n\tconnect-src https://api.example.test; report-uri /csp?a=1&amp;b=2; sandbox allow-scripts; worker-src blob:; base-uri 'none'"));
  assert.doesNotMatch(output, /unsafe-eval/u);
  assert.doesNotMatch(contents(output)[0], /(?:^|\s)\*(?:\s|;|$)/u);
});

test('already patched CSP is byte-for-byte idempotent', () => {
  const original = page("default-src 'none';script-src 'unsafe-inline';frame-src 'self';media-src blob:;");
  const once = patch(original);
  assert.equal(patch(once), once);
  assert.equal(contents(once)[0].split(provider).length - 1, 1);
});

test('does not duplicate preexisting allowed sources', () => {
  const original = page(`default-src 'none'; script-src ${provider}; script-src-elem ${provider}; frame-src 'self'; media-src blob:`);
  assert.equal(patch(original), original);
});

test('patches every actual enforcing CSP meta independently', () => {
  const html = `<html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'"><meta http-equiv="Content-Security-Policy" content="default-src https://cdn.example.test"></head><body>Keep</body></html>`;
  const policies = contents(patch(html)).map(directives);
  assert.equal(policies.length, 2);
  for (const policy of policies) {
    assert.ok(policy.get('script-src').includes(provider));
    assert.ok(policy.get('frame-src').includes("'self'"));
    assert.ok(policy.get('media-src').includes('blob:'));
  }
});

test('supports case-insensitive attributes and directive names without reserializing the page', () => {
  const html = `<HTML><HEAD><META DATA-x='keep' CONTENT = "DeFaUlT-SrC 'none'; SCRIPT-SRC 'unsafe-inline'" HTTP-EQUIV='content-security-policy'></HEAD><BODY>Keep\r\n</BODY></HTML>`;
  const expected = `<HTML><HEAD><META DATA-x='keep' CONTENT = "DeFaUlT-SrC 'none'; SCRIPT-SRC 'unsafe-inline' ${provider}; frame-src 'self'; media-src blob:" HTTP-EQUIV='content-security-policy'></HEAD><BODY>Keep\r\n</BODY></HTML>`;
  assert.equal(patch(html), expected);
});

test('single-quoted content safely escapes CSP quotes and preserves attribute delimiters', () => {
  const html = "<html><head><meta http-equiv='Content-Security-Policy' content = 'default-src &#39;none&#39;; report-uri /csp?a=1&amp;b=2' data-preserved='yes'></head><body>Keep</body></html>";
  const output = patch(html);
  assert.ok(output.includes("content = 'default-src &#39;none&#39;; report-uri /csp?a=1&amp;b=2;"));
  assert.ok(output.includes("frame-src &#39;self&#39;"));
  assert.ok(output.endsWith("' data-preserved='yes'></head><body>Keep</body></html>"));
  assert.deepEqual(directives(contents(output)[0]).get('default-src'), ["'none'"]);
  assert.equal(patch(output), output);
});

test('unquoted content becomes safely quoted while preserving neighboring attributes', () => {
  const html = '<html><head><meta http-equiv=Content-Security-Policy content=default-src&#32;&#39;none&#39; data-stay=unchanged></head><body>Keep</body></html>';
  const output = patch(html);
  assert.ok(output.includes('content="default-src'));
  assert.ok(output.endsWith('" data-stay=unchanged></head><body>Keep</body></html>'));
  assert.deepEqual(directives(contents(output)[0]).get('script-src'), [provider]);
  assert.equal(patch(output), output);
});

test('missing content attribute remains untouched', () => {
  const html = '<meta http-equiv="Content-Security-Policy"><main>Keep</main>';
  assert.equal(patch(html), html);
});

test('duplicate directives retain first-wins semantics and ignored duplicates remain untouched', () => {
  const original = "default-src 'none'; script-src 'self'; script-src https://ignored.example.test; frame-src 'none'; frame-src https://ignored-frame.example.test";
  const output = patch(page(original));
  const result = directives(contents(output)[0]);
  assert.deepEqual(result.get('script-src'), ["'self'", provider]);
  assert.deepEqual(result.get('frame-src'), ["'self'"]);
  assert.ok(output.includes('; script-src https://ignored.example.test;'));
  assert.ok(output.includes('; frame-src https://ignored-frame.example.test;'));
});
