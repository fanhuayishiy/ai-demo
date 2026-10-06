import { renderFlightMusic } from "./music.js";

// The pure composition/renderer is shared with Node tests. Transfer ownership of
// the PCM arrays instead of copying 8 MB of stereo audio back to the UI thread.
self.onmessage = ({ data }) => {
  try {
    const audio = renderFlightMusic({ sampleRate: data.sampleRate });
    self.postMessage(
      audio,
      audio.channels.map((channel) => channel.buffer),
    );
  } catch (error) {
    self.postMessage({ error: `Music rendering failed: ${error.message}` });
  }
};
