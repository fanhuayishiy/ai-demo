import { parse } from 'parse5';

const provider = 'https://busuanzi.ibruce.info';
const asciiWhitespace = /[\t\n\f\r ]+/u;

function* walk(node) {
  yield node;
  // Template contents are inert, and are deliberately not traversed.
  for (const child of node.childNodes ?? []) yield* walk(child);
}

function extendPolicy(policy) {
  const segments = policy.split(';');
  const directives = new Map();
  for (const [index, segment] of segments.entries()) {
    const match = /^([\t\n\f\r ]*)([a-zA-Z0-9-]+)([\t\n\f\r ][\s\S]*)?$/u.exec(segment);
    if (!match) continue;
    const name = match[2].toLowerCase();
    // CSP ignores repeated directives after their first occurrence.
    if (!directives.has(name)) directives.set(name, { index, match, sources: (match[3] ?? '').split(asciiWhitespace).filter(Boolean) });
  }
  const additions = [];
  const includes = (sources, source) => sources.some((item) => item.toLowerCase() === source.toLowerCase());
  const withoutNone = (sources) => sources.filter((source) => source.toLowerCase() !== "'none'");

  function permit(name, source, fallbackNames = []) {
    const existing = directives.get(name);
    if (existing) {
      if (includes(existing.sources, source)) return;
      const segment = segments[existing.index];
      const trailing = /[\t\n\f\r ]*$/u.exec(segment)[0];
      if (includes(existing.sources, "'none'")) {
        // 'none' cannot be combined with a real source. Keep the original
        // fallback directive untouched, and remove it only from this list.
        segments[existing.index] = existing.match[1] + existing.match[2] + ' '
          + [...withoutNone(existing.sources), source].join(' ') + trailing;
      } else {
        segments[existing.index] = segment.slice(0, segment.length - trailing.length) + ' ' + source + trailing;
      }
      return;
    }

    const fallback = fallbackNames.map((candidate) => directives.get(candidate)).find(Boolean);
    // Without an applicable directive/fallback, this resource type is already
    // unrestricted. Adding a new restriction would break unrelated app assets.
    if (!fallback) return;
    const sources = withoutNone(fallback.sources);
    if (!includes(sources, source)) sources.push(source);
    additions.push(`${name} ${sources.join(' ')}`);
  }

  permit('script-src', provider, ['default-src']);
  permit('script-src-elem', provider);
  permit('frame-src', "'self'", ['child-src', 'default-src']);
  permit('media-src', 'blob:', ['default-src']);
  const amended = segments.join(';');
  if (!additions.length) return amended;
  const separator = /;[\t\n\f\r ]*$/u.test(amended) ? ' ' : '; ';
  return amended + separator + additions.join('; ');
}

function encodeAttribute(value, quote) {
  const escaped = value.replace(/&/gu, '&amp;');
  return quote === "'" ? escaped.replace(/'/gu, '&#39;') : escaped.replace(/"/gu, '&quot;');
}

/** Patch only actual enforcing CSP attribute values, never reserialize HTML. */
export function patchPreviewCsp(html) {
  const document = parse(html, { sourceCodeLocationInfo: true });
  const replacements = [];
  for (const node of walk(document)) {
    if (node.tagName !== 'meta' || node.namespaceURI !== 'http://www.w3.org/1999/xhtml') continue;
    // Only direct children of the HTML head enforce CSP, including an implicit head.
    if (node.parentNode?.tagName !== 'head' || node.parentNode.namespaceURI !== node.namespaceURI) continue;
    const attributes = new Map(node.attrs.map(({ name, value }) => [name, value]));
    if (attributes.get('http-equiv')?.toLowerCase() !== 'content-security-policy') continue;
    const value = attributes.get('content');
    const location = node.sourceCodeLocation?.attrs?.content;
    if (value === undefined || !location) continue;
    const amended = extendPolicy(value);
    if (amended === value) continue;
    const raw = html.slice(location.startOffset, location.endOffset);
    const prefix = /^[^\s=]+[\t\n\f\r ]*=[\t\n\f\r ]*/u.exec(raw);
    if (!prefix) continue;
    const quote = raw[prefix[0].length];
    if (quote === '"' || quote === "'") {
      replacements.push({ start: location.startOffset + prefix[0].length + 1, end: location.endOffset - 1, text: encodeAttribute(amended, quote) });
    } else {
      replacements.push({ start: location.startOffset + prefix[0].length, end: location.endOffset, text: `"${encodeAttribute(amended, '"')}"` });
    }
  }
  let output = html;
  for (const { start, end, text } of replacements.sort((a, b) => b.start - a.start)) {
    output = output.slice(0, start) + text + output.slice(end);
  }
  return output;
}
