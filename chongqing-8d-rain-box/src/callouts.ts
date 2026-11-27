import * as THREE from 'three';
import { CalloutAnchor } from './types';

export const CHONGQING_CAD_CALLOUTS: CalloutAnchor[] = [
  // Left 4 CAD Callout Cards (top -> bottom)
  {
    id: 'cableway',
    code: 'TIER +1 · A01',
    elevation: '+21m',
    title: '长江索道 · 空中客车',
    desc: '红白复古轿厢与X型钢桁架塔，凌空掠过山城屋脊',
    side: 'left',
    tier: 'sky',
    localPos: new THREE.Vector3(-4.2, 20.6, -1.2),
  },
  {
    id: 'monorail',
    code: 'TIER +1 · A02',
    elevation: '+13m',
    title: '2号线跨座式单轨',
    desc: '四节编组绿银流线列车，橡胶轮裙跨抱高架轨道梁',
    side: 'left',
    tier: 'sky',
    localPos: new THREE.Vector3(-5.2, 13.8, -4.9),
  },
  {
    id: 'diaojiaolou',
    code: 'TIER 0 · B01',
    elevation: '+4m',
    title: '巴渝吊脚楼 · 重庆老火锅',
    desc: '小青瓦飞檐、美人靠廊台与九宫格热气实景内堂',
    side: 'left',
    tier: 'street',
    localPos: new THREE.Vector3(-7.6, 4.2, 0.8),
  },
  {
    id: 'subway',
    code: 'TIER -1 · C01',
    elevation: '-10m',
    title: '穿山地铁 · 洪崖雨巷站',
    desc: '盾构拱肋站台、黄盲道与红银流线型地铁剖面',
    side: 'left',
    tier: 'subway',
    localPos: new THREE.Vector3(-5.0, -7.2, 4.0),
  },
  // Right 4 CAD Callout Cards (top -> bottom)
  {
    id: 'liziba',
    code: 'TIER +1 · A03',
    elevation: '+16m',
    title: '李子坝单轨穿楼',
    desc: '7层马赛克居民楼、凸出防盗网与三至五层镂空涵洞',
    side: 'right',
    tier: 'sky',
    localPos: new THREE.Vector3(6.8, 15.8, -1.7),
  },
  {
    id: 'banyan',
    code: 'TIER 0 · B02',
    elevation: '+4m',
    title: '山城黄桷树 · 青石梯坎',
    desc: '青苔堡坎气生根、羽状枝叶冠层与雨夜青石阶梯',
    side: 'right',
    tier: 'street',
    localPos: new THREE.Vector3(1.8, 5.2, -0.8),
  },
  {
    id: 'taxi',
    code: 'TIER 0 · B03',
    elevation: '0m',
    title: '黄色“法拉利”与湿润街巷',
    desc: '渝A黄色出租车、霓虹水洼倒影、雨伞行人与电瓶车',
    side: 'right',
    tier: 'street',
    localPos: new THREE.Vector3(4.5, 1.1, 5.2),
  },
  {
    id: 'cave',
    code: 'TIER -1 · C02',
    elevation: '-10m',
    title: '防空洞地下老火锅',
    desc: '1969人防红砖拱洞、爱迪生灯串与沸腾九宫格餐桌',
    side: 'right',
    tier: 'subway',
    localPos: new THREE.Vector3(7.6, -6.5, 4.5),
  },
];

interface CardNode {
  anchor: CalloutAnchor;
  el: HTMLDivElement;
  line: SVGPathElement;
  dot: SVGCircleElement;
  ring: SVGCircleElement;
}

export class CadCalloutOverlay {
  private layerEl: HTMLElement;
  private svgEl: SVGSVGElement;
  private cardsContainer: HTMLElement;
  private nodes: CardNode[] = [];
  private visible = false;

  private readonly cardWidth = 224;
  private readonly sideMargin = 20;
  private readonly minGap = 10;
  private readonly tmpVec = new THREE.Vector3();

  constructor() {
    this.layerEl = document.getElementById('callout-layer')!;
    this.svgEl = document.getElementById('callout-svg') as unknown as SVGSVGElement;
    this.cardsContainer = document.getElementById('callout-cards')!;
    this.buildDOM();
  }

  private buildDOM(): void {
    const svgNS = 'http://www.w3.org/2000/svg';
    this.cardsContainer.innerHTML = '';
    this.svgEl.innerHTML = '';

    for (const anchor of CHONGQING_CAD_CALLOUTS) {
      const card = document.createElement('div');
      card.className = `cad-card side-${anchor.side}`;
      card.dataset.id = anchor.id;
      card.innerHTML = `
        <div class="cad-card-head">
          <span class="cad-code">${anchor.code}</span>
          <span class="cad-elev">${anchor.elevation}</span>
        </div>
        <div class="cad-title">${anchor.title}</div>
        <div class="cad-desc">${anchor.desc}</div>
      `;
      this.cardsContainer.appendChild(card);

      const line = document.createElementNS(svgNS, 'path');
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke', 'rgba(218, 180, 114, 0.78)');
      line.setAttribute('stroke-width', '1.35');

      const ring = document.createElementNS(svgNS, 'circle');
      ring.setAttribute('r', '5.5');
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', 'rgba(242, 209, 146, 0.85)');
      ring.setAttribute('stroke-width', '1.2');

      const dot = document.createElementNS(svgNS, 'circle');
      dot.setAttribute('r', '2.5');
      dot.setAttribute('fill', '#ffe7b3');

      this.svgEl.appendChild(line);
      this.svgEl.appendChild(ring);
      this.svgEl.appendChild(dot);

      this.nodes.push({ anchor, el: card, line, dot, ring });
    }
  }

  public setVisible(v: boolean): void {
    this.visible = v;
    this.layerEl.classList.toggle('visible', v);
    this.layerEl.setAttribute('aria-hidden', v ? 'false' : 'true');
  }

  public update(
    camera: THREE.Camera,
    tierGroups: { sky: THREE.Object3D; street: THREE.Object3D; subway: THREE.Object3D },
    viewportW: number,
    viewportH: number
  ): void {
    if (!this.visible) return;

    this.svgEl.setAttribute('viewBox', `0 0 ${viewportW} ${viewportH}`);

    // Safe vertical corridor strictly clearing top HUD header/pills AND bottom control dock
    const topSafe = 122;
    const bottomSafe = viewportH - 88;

    const layoutSide = (side: 'left' | 'right') => {
      const items = this.nodes
        .filter((n) => n.anchor.side === side)
        .map((n) => {
          const parent = tierGroups[n.anchor.tier];
          this.tmpVec.copy(n.anchor.localPos);
          parent.localToWorld(this.tmpVec);
          this.tmpVec.project(camera);

          const ax = (this.tmpVec.x * 0.5 + 0.5) * viewportW;
          const ay = (-this.tmpVec.y * 0.5 + 0.5) * viewportH;
          const h = Math.max(66, n.el.offsetHeight || 72);
          return { node: n, ax, ay, h, y: ay - h * 0.5 };
        });

      // Sort strictly top-to-bottom by projected anchor Y
      items.sort((a, b) => a.ay - b.ay);

      // Pass 1: Clamp to topSafe and push downward so zero overlaps exist
      for (let i = 0; i < items.length; i++) {
        if (i === 0) {
          items[i].y = Math.max(topSafe, items[i].y);
        } else {
          items[i].y = Math.max(items[i].y, items[i - 1].y + items[i - 1].h + this.minGap);
        }
      }

      // Pass 2: Clamp bottom card inside bottomSafe and push upward if needed
      for (let i = items.length - 1; i >= 0; i--) {
        if (i === items.length - 1) {
          items[i].y = Math.min(items[i].y, bottomSafe - items[i].h);
        } else {
          items[i].y = Math.min(items[i].y, items[i + 1].y - items[i].h - this.minGap);
        }
        items[i].y = Math.max(topSafe, items[i].y);
      }

      // Apply exact DOM positions & stepped CAD SVG leader lines
      const cardX = side === 'left' ? this.sideMargin : viewportW - this.sideMargin - this.cardWidth;
      for (const item of items) {
        const { node, ax, ay, h, y } = item;
        node.el.style.left = `${Math.round(cardX)}px`;
        node.el.style.top = `${Math.round(y)}px`;

        const clampedAx = THREE.MathUtils.clamp(ax, 12, viewportW - 12);
        const clampedAy = THREE.MathUtils.clamp(ay, 12, viewportH - 12);

        const edgeX = side === 'left' ? cardX + this.cardWidth : cardX;
        const edgeY = y + h * 0.5;
        const elbowX = side === 'left' ? edgeX + 24 : edgeX - 24;

        node.line.setAttribute(
          'd',
          `M ${edgeX.toFixed(1)} ${edgeY.toFixed(1)} L ${elbowX.toFixed(1)} ${edgeY.toFixed(1)} L ${clampedAx.toFixed(1)} ${clampedAy.toFixed(1)}`
        );
        node.dot.setAttribute('cx', clampedAx.toFixed(1));
        node.dot.setAttribute('cy', clampedAy.toFixed(1));
        node.ring.setAttribute('cx', clampedAx.toFixed(1));
        node.ring.setAttribute('cy', clampedAy.toFixed(1));
      }
    };

    layoutSide('left');
    layoutSide('right');
  }

  public computeQualityMetrics(viewportW: number, viewportH: number): {
    calloutCount: number;
    calloutOverlaps: number;
    calloutOutOfBounds: number;
  } {
    if (!this.visible) {
      return { calloutCount: 0, calloutOverlaps: 0, calloutOutOfBounds: 0 };
    }

    const cardRects = this.nodes.map((n) => n.el.getBoundingClientRect());
    const hudIds = ['hud-header', 'hud-topright', 'hud-dock'];
    const hudRects = hudIds
      .map((id) => document.getElementById(id)?.getBoundingClientRect())
      .filter((r): r is DOMRect => Boolean(r));

    let overlaps = 0;
    let outOfBounds = 0;

    const intersects = (a: DOMRect, b: DOMRect) =>
      a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;

    for (let i = 0; i < cardRects.length; i++) {
      const r = cardRects[i];
      if (r.left < 0 || r.top < 0 || r.right > viewportW || r.bottom > viewportH) {
        outOfBounds++;
      }
      // Card-vs-card overlap
      for (let j = i + 1; j < cardRects.length; j++) {
        if (intersects(r, cardRects[j])) overlaps++;
      }
      // Card-vs-HUD overlap
      for (const hr of hudRects) {
        if (intersects(r, hr)) overlaps++;
      }
    }

    return {
      calloutCount: cardRects.length,
      calloutOverlaps: overlaps,
      calloutOutOfBounds: outOfBounds,
    };
  }
}
