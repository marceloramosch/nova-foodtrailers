// Genera un blueprint 2D (vista de planta) en SVG para un tamano de trailer.
// No es un plano de ingenieria - es un sketch a escala para ventas y
// referencia rapida de distribucion de equipo, con regla de medicion,
// cuadricula y pie de pagina de cotizacion.

const NOVA_BLUE = "#2D6BC4";
const NOVA_DARK = "#0D2244";
const NOVA_SILVER = "#C8D8F0";
const NOVA_GRID = "#E4ECFB";

function renderBlueprintSVG(size) {
  const scale = 36; // px por pie
  const marginLeft = 1.5;
  const marginRight = 1;
  const titleSpace = 0.6;
  const rulerSpace = 0.5;
  const hoodSpace = 1.3;
  const wheelSpace = 1.6;
  const labelSpace = 0.9;
  const footerSpace = 1.9;

  const totalLength = size.length + size.porch;
  const wFt = marginLeft + totalLength + marginRight;
  const hFt = titleSpace + rulerSpace + hoodSpace + size.width + wheelSpace + labelSpace + footerSpace;

  const W = wFt * scale;
  const H = hFt * scale;
  const toX = (ft) => (marginLeft + ft) * scale;
  const toY = (ft) => (titleSpace + rulerSpace + hoodSpace + ft) * scale;
  const px = (ft) => ft * scale;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif">`;

  // Titulo
  svg += textLabel(toX(size.length / 2), px(titleSpace * 0.65), `NOVA FOOD TRAILER ${size.label}`, 14, NOVA_DARK, true);

  // Regla de medicion (en pies)
  const rulerY = px(titleSpace + rulerSpace * 0.75);
  svg += `<line x1="${toX(0)}" y1="${rulerY}" x2="${toX(totalLength)}" y2="${rulerY}" stroke="${NOVA_DARK}" stroke-width="1"/>`;
  for (let ft = 0; ft <= totalLength; ft++) {
    const x = toX(ft);
    svg += `<line x1="${x}" y1="${rulerY - 4}" x2="${x}" y2="${rulerY + 4}" stroke="${NOVA_DARK}" stroke-width="1"/>`;
    if (ft < totalLength) {
      svg += textLabel(x + px(0.5), rulerY - 6, String(ft + 1), 8, NOVA_DARK, false);
    }
  }

  // Cuerpo del trailer
  svg += `<rect x="${toX(0)}" y="${toY(0)}" width="${px(size.length)}" height="${px(size.width)}"
    fill="${NOVA_SILVER}" stroke="${NOVA_DARK}" stroke-width="3"/>`;

  // Cuadricula interior (1 pie x 1 pie)
  for (let ft = 1; ft < size.length; ft++) {
    svg += `<line x1="${toX(ft)}" y1="${toY(0)}" x2="${toX(ft)}" y2="${toY(size.width)}" stroke="${NOVA_GRID}" stroke-width="1"/>`;
  }
  for (let ft = 1; ft < size.width; ft++) {
    svg += `<line x1="${toX(0)}" y1="${toY(ft)}" x2="${toX(size.length)}" y2="${toY(ft)}" stroke="${NOVA_GRID}" stroke-width="1"/>`;
  }

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

  // Cajas de equipo, con nombre del equipo dentro de cada caja
  placed.forEach((item) => {
    const boxW = px(item.w);
    const boxH = px(equipHeight);
    const cx = toX(item.x + item.w / 2);
    const cy = toY(equipHeight / 2);
    svg += `<rect x="${toX(item.x)}" y="${toY(0)}" width="${boxW}" height="${boxH}"
      fill="${NOVA_BLUE}" fill-opacity="0.18" stroke="${NOVA_DARK}" stroke-width="1.5"/>`;
    svg += equipmentLabel(cx, cy, item.name, boxW, boxH);
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

  // Pie de pagina: branding + lineas de firma para cotizacion
  const footerY0 = H - px(footerSpace);
  svg += `<line x1="${toX(-marginLeft + 0.2)}" y1="${footerY0}" x2="${toX(totalLength + marginRight - 0.2)}" y2="${footerY0}"
    stroke="${NOVA_SILVER}" stroke-width="2"/>`;

  svg += textLabel(toX(0), footerY0 + px(0.45), "NOVA FOOD TRAILERS", 13, NOVA_BLUE, true).replace('text-anchor="middle"', 'text-anchor="start"');
  svg += textLabel(toX(0), footerY0 + px(0.8), `Modelo ${size.label}  -  $${size.price.toLocaleString("en-US")}`, 10, NOVA_DARK, false)
    .replace('text-anchor="middle"', 'text-anchor="start"');

  const sigW = px(totalLength * 0.32);
  const sigY = footerY0 + px(1.55);
  const sig1X = toX(totalLength) - sigW * 2 - px(0.4);
  const sig2X = toX(totalLength) - sigW;
  svg += `<line x1="${sig1X}" y1="${sigY}" x2="${sig1X + sigW}" y2="${sigY}" stroke="${NOVA_DARK}" stroke-width="1"/>`;
  svg += textLabel(sig1X + sigW / 2, sigY + 14, "FIRMA CLIENTE", 9, NOVA_DARK, false);
  svg += `<line x1="${sig2X}" y1="${sigY}" x2="${sig2X + sigW}" y2="${sigY}" stroke="${NOVA_DARK}" stroke-width="1"/>`;
  svg += textLabel(sig2X + sigW / 2, sigY + 14, "REPRESENTANTE DE VENTAS", 9, NOVA_DARK, false);

  svg += `</svg>`;
  return svg;
}

// Dibuja el nombre del equipo dentro de su caja, ajustando el texto en
// varias lineas cortas para que quepa sin salirse de la caja.
function equipmentLabel(cx, cy, name, boxW, boxH) {
  const fontSize = 9;
  const lineHeight = fontSize * 1.15;
  const availW = boxW - 6;
  const availH = boxH - 6;

  let lines = wrapText(name, availW, fontSize);
  const maxLines = Math.max(1, Math.floor(availH / lineHeight));
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.length > 3 ? last.slice(0, last.length - 1) + "…" : last + "…";
  }

  const startY = cy - ((lines.length - 1) / 2) * lineHeight;
  let textEl = `<text x="${cx}" y="${startY}" font-size="${fontSize}" fill="${NOVA_DARK}" text-anchor="middle" font-weight="700">`;
  lines.forEach((line, i) => {
    textEl += `<tspan x="${cx}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`;
  });
  textEl += "</text>";
  return textEl;
}

// Reparte un texto en lineas que quepan dentro de un ancho dado (px),
// estimando el ancho de cada caracter segun el tamano de fuente.
function wrapText(text, maxWidthPx, fontSize) {
  const charW = fontSize * 0.55;
  const maxChars = Math.max(3, Math.floor(maxWidthPx / charW));
  const words = String(text).split(" ");
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });
  if (current) lines.push(current);
  return lines;
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
