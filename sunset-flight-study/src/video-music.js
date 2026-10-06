/** Load the original soundtrack extracted from the reference video. */
export async function loadVideoMusic({ context, signal } = {}) {
  signal?.throwIfAborted();
  if (typeof context?.decodeAudioData !== "function")
    throw new Error("Audio decoding is not supported in this browser");
  const response = await fetch(
    new URL("./assets/reference-soundtrack.m4a", import.meta.url),
    { signal },
  );
  if (!response.ok)
    throw new Error(`Video soundtrack failed to load (${response.status})`);
  const bytes = await response.arrayBuffer();
  signal?.throwIfAborted();
  if (!bytes.byteLength) throw new Error("Video soundtrack is empty");
  const decoded = await context.decodeAudioData(bytes);
  // decodeAudioData cannot be interrupted; discard its result after disposal.
  signal?.throwIfAborted();
  if (
    !decoded ||
    !Number.isFinite(decoded.sampleRate) ||
    decoded.sampleRate <= 0 ||
    !Number.isFinite(decoded.duration) ||
    decoded.duration <= 0 ||
    !Number.isInteger(decoded.length) ||
    decoded.length <= 0 ||
    ![1, 2].includes(decoded.numberOfChannels)
  )
    throw new Error("Invalid or unsupported video soundtrack audio");
  const channels = Array.from({ length: 2 }, (_, index) =>
    decoded.getChannelData(Math.min(index, decoded.numberOfChannels - 1)),
  );
  for (const channel of channels) {
    if (
      !(channel instanceof Float32Array) ||
      channel.length !== decoded.length ||
      !channel.every(Number.isFinite)
    )
      throw new Error("Invalid video soundtrack PCM data");
  }
  return {
    sampleRate: decoded.sampleRate,
    duration: decoded.duration,
    channels,
  };
}
