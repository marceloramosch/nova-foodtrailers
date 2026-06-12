// Genera un blueprint 2D (vista de planta) en SVG para un tamano de trailer.
// No es un plano de ingenieria - es un sketch a escala para ventas y
// referencia rapida de distribucion de equipo.

const NOVA_BLUE = "#2D6BC4";
const NOVA_DARK = "#0D2244";
const NOVA_SILVER = "#C8D8F0";

function renderBlueprintSVG(size) {
  const scale = 36; // px por pie
  const marginLeft = 1.5;
  const marginRight = 1;
  const hoodSpace = 1.3;
  const wheelSpace = 1.6;
  const labelSpace = 0.9;

  const totalLength = size.length + size.porch;
  const wFt = marginLeft + totalLength + marginRight;
  const hFt = hoodSpace + size.width + wheelSpace + labelSpace;

  const W = wFt * scale;
  const H = hFt * scale;
  const toX = (ft) => (marginLeft + ft) * scale;
  const toY = (ft) => (hoodSpace + ft) * scale;
  const px = (ft) => ft * scale;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif">`;

  // Cuerpo del trailer
  svg += `<rect x="${toX(0)}" y="${toY(0)}" width="${px(size.length)}" height="${px(size.width)}"
    fill="${NOVA_SILVER}" stroke="${NOVA_DARK}" stroke-width="3"/>`;

  // Porch
  if (size.porch > 0) {
    const px0 = toX(size.length);
    svg += `<rect x="${px0}" y="${toY(0)}" width="${px(size.porch)}" height="${px(size.width)}"
      fill="#ffffff" stroke="${NOVA_DARK}" stroke-width="2" stroke-dasharray="6,4"/>`;
    svg += textLabel(px0 + px(size.porch) / 2, toY(size.width / 2), "PORCH", 13, NOVA_DARK, true);
    // doble puerta del porch
    const doorY = toY(size.width * 0.15);
    svg += `<line x1="${px0 + px(size.porch) / 2}" y1="${doorY}" x2="${px0 + px(size.porch) / 2}" y2="${doorY + px(size.width * 0.7)}"
      stroke="${NOVA_DARK}" stroke-width="1.5" stroke-dasharray="3,3"/>`;
  }

  // Linea de equipo (pared trasera / "back")
  const items = size.equipment.back;
  const kitchenLen = size.length - 1; // 0.5 ft margen en cada extremo
  const sumFt = items.reduce((a, i) => a + i.ft, 0);
  const widthScale = sumFt > kitchenLen ? kitchenLen / sumFt : 1;
  const equipHeight = 2.3;

  let cursor = 0.5;
  const placed = [];
  items.forEach((item, idx) => {
    const w = item.ft * widthScale;
    placed.push({ ...item, x: cursor, w, num: idx + 1 });
    cursor += w;
  });

  // Campana sobre los items marcados con hood:true que sean contiguos
  let hoodStart = null;
  let hoodEnd = null;
  placed.forEach((item) => {
    if (item.hood) {
      if (hoodStart === null) hoodStart = item.x;
      hoodEnd = item.x + item.w;
    }
  });
  if (hoodStart !== null) {
    svg += `<rect x="${toX(hoodStart)}" y="${toY(0) - px(0.9)}" width="${px(hoodEnd - hoodStart)}" height="${px(0.8)}"
      fill="none" stroke="${NOVA_BLUE}" stroke-width="1.5" stroke-dasharray="5,3"/>`;
    svg += textLabel(toX((hoodStart + hoodEnd) / 2), toY(0) - px(0.95), "CAMPANA EXTRACTORA", 11, NOVA_BLUE, false);
  }

  // Cajas de equipo
  placed.forEach((item) => {
    svg += `<rect x="${toX(item.x)}" y="${toY(0)}" width="${px(item.w)}" height="${px(equipHeight)}"
      fill="${NOVA_BLUE}" fill-opacity="0.18" stroke="${NOVA_DARK}" stroke-width="1.5"/>`;
    svg += textLabel(toX(item.x + item.w / 2), toY(equipHeight / 2) + 5, String(item.num), 14, NOVA_DARK, true);
  });

  // Ventanas de servicio en la pared frontal ("front")
  if (size.serviceWindows > 0) {
    const winW = Math.min(2, kitchenLen / size.serviceWindows / 1.5);
    const gap = kitchenLen / size.serviceWindows;
    for (let i = 0; i < size.serviceWindows; i++) {
      const cx = 0.5 + gap * (i + 0.5);
      svg += `<rect x="${toX(cx - winW / 2)}" y="${toY(size.width) - px(0.15)}" width="${px(winW)}" height="${px(0.3)}"
        fill="#ffffff" stroke="${NOVA_BLUE}" stroke-width="2"/>`;
      svg += textLabel(toX(cx), toY(size.width) + px(0.55), "VENTANA SERVICIO", 9, NOVA_BLUE, false);
    }
  }

  // Puerta de entrada (extremo izquierdo de la pared frontal)
  svg += `<rect x="${toX(0.1)}" y="${toY(size.width) - px(0.15)}" width="${px(0.8)}" height="${px(0.3)}"
    fill="#ffffff" stroke="${NOVA_DARK}" stroke-width="2"/>`;
  svg += textLabel(toX(0.5), toY(size.width) + px(0.55), "PUERTA", 9, NOVA_DARK, false);

  // Ejes y llantas
  const axleZoneStart = size.length * 0.55;
  const axleZoneEnd = size.length - 0.8;
  const step = size.axles > 1 ? (axleZoneEnd - axleZoneStart) / (size.axles - 1) : 0;
  for (let i = 0; i < size.axles; i++) {
    const ax = size.axles === 1 ? (axleZoneStart + axleZoneEnd) / 2 : axleZoneStart + step * i;
    // llanta superior
    svg += `<rect x="${toX(ax) - px(0.3)}" y="${toY(0) - px(0.45)}" width="${px(0.6)}" height="${px(0.4)}"
      fill="${NOVA_DARK}" rx="2"/>`;
    // llanta inferior
    svg += `<rect x="${toX(ax) - px(0.3)}" y="${toY(size.width) + px(0.05)}" width="${px(0.6)}" height="${px(0.4)}"
      fill="${NOVA_DARK}" rx="2"/>`;
  }
  svg += textLabel(toX(axleZoneStart + (axleZoneEnd - axleZoneStart) / 2), toY(size.width) + px(1.3),
    `${size.axles} EJES - ${size.axleCapacity} LB c/u`, 10, NOVA_DARK, true);

  // Titulo
  svg += textLabel(toX(size.length / 2), toY(0) - px(0.95) - (hoodStart !== null ? px(1) : 0),
    `NOVA FOOD TRAILER ${size.label}`, 13, NOVA_DARK, true);

  svg += `</svg>`;
  return svg;
}

function textLabel(x, y, text, size, color, bold) {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="middle"
    font-weight="${bold ? 700 : 400}">${escapeXml(text)}</text>`;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

if (typeof module !== "undefined") {
  module.exports = { renderBlueprintSVG };
}
