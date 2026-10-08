# Shared preview dependencies

The publisher inlines the following pinned libraries in each preview. Their original source copyright notices are retained. Initialization is lazy, on the first share request; no sharing-library CDN request is made by the visitor.

- **html2canvas 1.4.1** — https://github.com/niklasvh/html2canvas — MIT. Package LICENSE: Copyright (c) 2012 Niklas von Hertzen. The distributed 1.4.1 build also carries Copyright (c) 2022 Niklas von Hertzen.
- **qrcode-generator 1.4.4** — https://github.com/kazuhikoarase/qrcode-generator — MIT. Copyright (c) 2009 Kazuhiko Arase. The word “QR Code” is a registered trademark of DENSO WAVE INCORPORATED.

Development-only **jsQR 1.4.0** (https://github.com/cozmo/jsQR, Apache-2.0) decodes the generated pixels in tests. It is not shipped in the shared runtime. Its license remains in the installed package.

Busuanzi is an external pageview service, not a screenshot dependency. No vendor script runs in the preview's top-level document. Service behavior and availability are controlled by its operator; see the repository README for disclosure and opt-out conditions.

## MIT License — html2canvas and qrcode-generator

Copyright (c) 2012, 2022 Niklas von Hertzen

Copyright (c) 2009 Kazuhiko Arase

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
