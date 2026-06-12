// Genera blueprints 2D en SVG para un tamano de trailer, con tres vistas
// independientes (para mostrarse en pestanas):
//  1) "kitchen"  - vista interior de la pared de cocina (elevacion, equipo)
//  2) "top"      - vista superior / planta
//  3) "service"  - vista interior de la pared de servicio (elevacion)
// No es un plano de ingenieria - es un sketch a escala para ventas y
// referencia rapida de distribucion de equipo, con regla de medicion,
// cuadricula y pie de pagina de cotizacion.

const NOVA_BLUE = "#2D6BC4";
const NOVA_DARK = "#0D2244";
const NOVA_SILVER = "#C8D8F0";
const NOVA_GRID = "#E4ECFB";

const SCALE = 36; // px por pie
const MARGIN_LEFT = 1.5;
const MARGIN_RIGHT = 1;
const TITLE_SPACE = 0.6;
const RULER_SPACE = 0.5;
const FOOTER_SPACE = 1.9;
const ELEV_HEIGHT = 7; // altura interior del trailer (pies) en vistas laterales
const COUNTER_HEIGHT = 2.8; // altura de mostradores/equipo en vistas laterales

// Devuelve las 3 vistas como SVG independientes: { kitchen, top, service }
function renderBlueprintViews(size) {
  const totalLength = size.length + size.porch;

  // Linea de equipo (pared trasera / "back")
  const items = size.equipment.back;
  const kitchenLen = size.length - 1; // 0.5 ft margen en cada extremo
  const sumFt = items.reduce((a, i) => a + i.ft, 0);
  const widthScale = sumFt > kitchenLen ? kitchenLen / sumFt : 1;

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

  return {
    kitchen: renderKitchenView(size, totalLength, placed, hoodStart, hoodEnd),
    top: renderTopView(size, totalLength, kitchenLen, placed),
    service: renderServiceView(size, totalLength, kitchenLen),
  };
}

// Compatibilidad: por defecto devuelve la vista superior (planta)
function renderBlueprintSVG(size) {
  return renderBlueprintViews(size).top;
}

function px(ft) {
  return ft * SCALE;
}

function makeToX() {
  return (ft) => (MARGIN_LEFT + ft) * SCALE;
}

// Cabecera comun: titulo + regla de medicion en pies
function renderHeader(toX, totalLength, title) {
  let svg = textLabel(toX(totalLength / 2), px(TITLE_SPACE * 0.65), title, 14, NOVA_DARK, true);

  const rulerY = px(TITLE_SPACE + RULER_SPACE * 0.75);
  svg += `<line x1="${toX(0)}" y1="${rulerY}" x2="${toX(totalLength)}" y2="${rulerY}" stroke="${NOVA_DARK}" stroke-width="1"/>`;
  for (let ft = 0; ft <= totalLength; ft++) {
    const x = toX(ft);
    svg += `<line x1="${x}" y1="${rulerY - 4}" x2="${x}" y2="${rulerY + 4}" stroke="${NOVA_DARK}" stroke-width="1"/>`;
    if (ft < totalLength) {
      svg += textLabel(x + px(0.5), rulerY - 6, String(ft + 1), 8, NOVA_DARK, false);
    }
  }
  return svg;
}

// Pie de pagina comun: branding + lineas de firma para cotizacion
function renderFooter(toX, totalLength, footerY0, size) {
  let svg = `<line x1="${toX(-MARGIN_LEFT + 0.2)}" y1="${footerY0}" x2="${toX(totalLength + MARGIN_RIGHT - 0.2)}" y2="${footerY0}"
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

  return svg;
}

// ===== Vista superior (planta) =====
function renderTopView(size, totalLength, kitchenLen, placed) {
  const hoodSpace = 0.6;
  const wheelSpace = 1.6;
  const labelSpace = 0.9;
  const equipHeight = 2.3;

  const hFt = TITLE_SPACE + RULER_SPACE + hoodSpace + size.width + wheelSpace + labelSpace + FOOTER_SPACE;
  const wFt = MARGIN_LEFT + totalLength + MARGIN_RIGHT;
  const W = wFt * SCALE;
  const H = hFt * SCALE;
  const toX = makeToX();
  const toY = (ft) => (TITLE_SPACE + RULER_SPACE + hoodSpace + ft) * SCALE;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif">`;
  svg += renderHeader(toX, totalLength, `NOVA FOOD TRAILER ${size.label} - VISTA SUPERIOR (PLANTA)`);

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
    const doorY = toY(size.width * 0.15);
    svg += `<line x1="${px0 + px(size.porch) / 2}" y1="${doorY}" x2="${px0 + px(size.porch) / 2}" y2="${doorY + px(size.width * 0.7)}"
      stroke="${NOVA_DARK}" stroke-width="1.5" stroke-dasharray="3,3"/>`;
  }

  // Cajas de equipo, con nombre del equipo dentro de cada caja
  placed.forEach((item) => {
    const boxW = px(item.w);
    const boxH = px(equipHeight);
    svg += renderEquipmentBox(toX(item.x), toY(0), boxW, boxH, item.name);
  });

  // Ventanas de servicio en la pared frontal ("front")
  if (size.serviceWindows > 0) {
    const winW = Math.min(2, kitchenLen / size.serviceWindows / 1.5);
    const gapWin = kitchenLen / size.serviceWindows;
    for (let i = 0; i < size.serviceWindows; i++) {
      const cx = 0.5 + gapWin * (i + 0.5);
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
    svg += `<rect x="${toX(ax) - px(0.3)}" y="${toY(0) - px(0.45)}" width="${px(0.6)}" height="${px(0.4)}"
      fill="${NOVA_DARK}" rx="2"/>`;
    svg += `<rect x="${toX(ax) - px(0.3)}" y="${toY(size.width) + px(0.05)}" width="${px(0.6)}" height="${px(0.4)}"
      fill="${NOVA_DARK}" rx="2"/>`;
  }
  svg += textLabel(toX(axleZoneStart + (axleZoneEnd - axleZoneStart) / 2), toY(size.width) + px(1.3),
    `${size.axles} EJES - ${size.axleCapacity} LB c/u`, 10, NOVA_DARK, true);

  svg += renderFooter(toX, totalLength, H - px(FOOTER_SPACE), size);
  svg += `</svg>`;
  return svg;
}

// ===== Vista interior pared de cocina (elevacion con equipo) =====
function renderKitchenView(size, totalLength, placed, hoodStart, hoodEnd) {
  const gapBelow = 0.3;
  const hFt = TITLE_SPACE + RULER_SPACE + ELEV_HEIGHT + gapBelow + FOOTER_SPACE;
  const wFt = MARGIN_LEFT + totalLength + MARGIN_RIGHT;
  const W = wFt * SCALE;
  const H = hFt * SCALE;
  const toX = makeToX();
  const topY = px(TITLE_SPACE + RULER_SPACE);
  const floorY = topY + px(ELEV_HEIGHT);
  const counterTopY = floorY - px(COUNTER_HEIGHT);

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif">`;
  svg += renderHeader(toX, totalLength, `NOVA FOOD TRAILER ${size.label} - PARED DE COCINA (EQUIPO)`);

  // Contorno de la pared
  svg += `<rect x="${toX(0)}" y="${topY}" width="${px(size.length)}" height="${px(ELEV_HEIGHT)}"
    fill="#ffffff" stroke="${NOVA_DARK}" stroke-width="2"/>`;

  // Linea de mostrador
  svg += `<line x1="${toX(0)}" y1="${counterTopY}" x2="${toX(size.length)}" y2="${counterTopY}"
    stroke="${NOVA_DARK}" stroke-width="1" stroke-dasharray="4,3"/>`;

  // Campana extractora
  if (hoodStart !== null) {
    const hoodY = topY + px(0.3);
    const hoodH = counterTopY - hoodY - px(0.1);
    svg += `<rect x="${toX(hoodStart)}" y="${hoodY}" width="${px(hoodEnd - hoodStart)}" height="${hoodH}"
      fill="none" stroke="${NOVA_BLUE}" stroke-width="1.5" stroke-dasharray="5,3"/>`;
    svg += textLabel(toX((hoodStart + hoodEnd) / 2), hoodY + 14, "CAMPANA EXTRACTORA", 10, NOVA_BLUE, false);
  }

  // Muebles/equipo a la altura de mostrador
  placed.forEach((item) => {
    const boxW = px(item.w);
    const boxH = px(COUNTER_HEIGHT);
    svg += renderEquipmentBox(toX(item.x), counterTopY, boxW, boxH, item.name);
  });

  svg += renderFooter(toX, totalLength, H - px(FOOTER_SPACE), size);
  svg += `</svg>`;
  return svg;
}

// ===== Vista interior pared de servicio (elevacion: puerta + ventanas) =====
function renderServiceView(size, totalLength, kitchenLen) {
  const gapBelow = 0.3;
  const hFt = TITLE_SPACE + RULER_SPACE + ELEV_HEIGHT + gapBelow + FOOTER_SPACE;
  const wFt = MARGIN_LEFT + totalLength + MARGIN_RIGHT;
  const W = wFt * SCALE;
  const H = hFt * SCALE;
  const toX = makeToX();
  const topY = px(TITLE_SPACE + RULER_SPACE);
  const floorY = topY + px(ELEV_HEIGHT);
  const counterTopY = floorY - px(COUNTER_HEIGHT);

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif">`;
  svg += renderHeader(toX, totalLength, `NOVA FOOD TRAILER ${size.label} - PARED DE SERVICIO`);

  // Contorno de la pared
  svg += `<rect x="${toX(0)}" y="${topY}" width="${px(size.length)}" height="${px(ELEV_HEIGHT)}"
    fill="#ffffff" stroke="${NOVA_DARK}" stroke-width="2"/>`;

  // Mostrador continuo
  svg += `<rect x="${toX(0)}" y="${counterTopY}" width="${px(size.length)}" height="${px(COUNTER_HEIGHT)}"
    fill="${NOVA_SILVER}" fill-opacity="0.5" stroke="${NOVA_DARK}" stroke-width="1.5"/>`;
  svg += textLabel(toX(size.length / 2), counterTopY + px(COUNTER_HEIGHT) / 2 + 4, "MOSTRADOR", 10, NOVA_DARK, false);

  // Puerta de entrada
  const doorW = px(0.8);
  const doorH = px(ELEV_HEIGHT - 0.4);
  svg += `<rect x="${toX(0.1)}" y="${topY + px(0.2)}" width="${doorW}" height="${doorH}"
    fill="#ffffff" stroke="${NOVA_DARK}" stroke-width="1.5" stroke-dasharray="4,2"/>`;
  svg += textLabel(toX(0.5), topY + px(ELEV_HEIGHT) - 6, "PUERTA", 9, NOVA_DARK, false);

  // Ventanas de servicio
  if (size.serviceWindows > 0) {
    const winW = Math.min(2, kitchenLen / size.serviceWindows / 1.5);
    const gapWin = kitchenLen / size.serviceWindows;
    const winTopY = topY + px(1.5);
    const winH = counterTopY - winTopY;
    for (let i = 0; i < size.serviceWindows; i++) {
      const cx = 0.5 + gapWin * (i + 0.5);
      svg += `<rect x="${toX(cx - winW / 2)}" y="${winTopY}" width="${px(winW)}" height="${winH}"
        fill="${NOVA_BLUE}" fill-opacity="0.1" stroke="${NOVA_BLUE}" stroke-width="2"/>`;
      svg += textLabel(toX(cx), winTopY - 6, "VENTANA SERVICIO", 9, NOVA_BLUE, false);
    }
  }

  svg += renderFooter(toX, totalLength, H - px(FOOTER_SPACE), size);
  svg += `</svg>`;
  return svg;
}

// Dibuja la caja de un equipo: el rectangulo, un icono representativo
// (si el tipo de equipo se reconoce y hay espacio) y el nombre debajo.
function renderEquipmentBox(x, y, boxW, boxH, name) {
  let svg = `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}"
    fill="${NOVA_BLUE}" fill-opacity="0.18" stroke="${NOVA_DARK}" stroke-width="1.5"/>`;

  const type = detectEquipmentType(name);
  const minSide = Math.min(boxW, boxH);
  if (type && minSide >= 28) {
    const iconAreaH = boxH * 0.55;
    const s = Math.min(boxW - 8, iconAreaH - 6);
    const iconX = x + (boxW - s) / 2;
    const iconY = y + 4;
    svg += drawEquipmentIcon(type, iconX, iconY, s);

    const labelY = y + iconAreaH + 4;
    const labelH = boxH - iconAreaH - 4;
    svg += equipmentLabel(x + boxW / 2, labelY + labelH / 2, name, boxW, labelH);
  } else {
    svg += equipmentLabel(x + boxW / 2, y + boxH / 2, name, boxW, boxH);
  }
  return svg;
}

// Identifica el tipo de equipo a partir de su nombre, para elegir el
// icono representativo correcto.
function detectEquipmentType(name) {
  const n = String(name).toLowerCase();
  if (n.includes("freidora")) return "fryer";
  if (n.includes("plancha")) return "griddle";
  if (n.includes("parrilla")) return "grill";
  if (n.includes("estufa") || n.includes("horno")) return "stove";
  if (n.includes("hielo")) return "ice";
  if (n.includes("fregadero") || n.includes("lavamanos")) return "sink";
  if (n.includes("congelador") || n.includes("refrigerador")) return "fridge";
  if (n.includes("vapor")) return "steamtable";
  if (n.includes("mesa fria") || n.includes("prep")) return "preptable";
  return null;
}

// Dibuja un icono de linea simple (estilo sketch) dentro de un cuadro de
// lado "s" con esquina superior izquierda en (x, y).
function drawEquipmentIcon(type, x, y, s) {
  switch (type) {
    case "griddle":
      return iconGriddle(x, y, s);
    case "grill":
      return iconGrill(x, y, s);
    case "fryer":
      return iconFryer(x, y, s);
    case "stove":
      return iconStove(x, y, s);
    case "sink":
      return iconSink(x, y, s);
    case "fridge":
      return iconFridge(x, y, s);
    case "steamtable":
      return iconSteamTable(x, y, s);
    case "preptable":
      return iconPrepTable(x, y, s);
    case "ice":
      return iconIce(x, y, s);
    default:
      return "";
  }
}

function iconBox(x, y, s) {
  return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="none" stroke="${NOVA_DARK}" stroke-width="1"/>`;
}

// Plancha: superficie con lineas de coccion
function iconGriddle(x, y, s) {
  let svg = iconBox(x, y, s);
  for (let i = 1; i <= 3; i++) {
    const ly = y + (s * i) / 4;
    svg += `<line x1="${x + s * 0.1}" y1="${ly}" x2="${x + s * 0.9}" y2="${ly}" stroke="${NOVA_DARK}" stroke-width="0.8"/>`;
  }
  return svg;
}

// Parrilla: rejilla
function iconGrill(x, y, s) {
  let svg = iconBox(x, y, s);
  for (let i = 1; i <= 3; i++) {
    const lx = x + (s * i) / 4;
    svg += `<line x1="${lx}" y1="${y + s * 0.1}" x2="${lx}" y2="${y + s * 0.9}" stroke="${NOVA_DARK}" stroke-width="0.8"/>`;
  }
  for (let i = 1; i <= 2; i++) {
    const ly = y + (s * i) / 3;
    svg += `<line x1="${x + s * 0.05}" y1="${ly}" x2="${x + s * 0.95}" y2="${ly}" stroke="${NOVA_DARK}" stroke-width="0.8"/>`;
  }
  return svg;
}

// Freidora: canastas con malla y agarradera
function iconFryer(x, y, s) {
  let svg = iconBox(x, y, s);
  const bw = s * 0.36;
  const top = y + s * 0.18;
  const bottom = y + s * 0.85;
  [0.08, 0.56].forEach((off) => {
    const bx = x + s * off;
    svg += `<polygon points="${bx},${top} ${bx + bw},${top} ${bx + bw * 0.85},${bottom} ${bx + bw * 0.15},${bottom}"
      fill="none" stroke="${NOVA_DARK}" stroke-width="0.8"/>`;
    svg += `<line x1="${bx + bw * 0.1}" y1="${top + (bottom - top) * 0.35}" x2="${bx + bw * 0.9}" y2="${top + (bottom - top) * 0.35}" stroke="${NOVA_DARK}" stroke-width="0.6"/>`;
    svg += `<line x1="${bx + bw * 0.15}" y1="${top + (bottom - top) * 0.65}" x2="${bx + bw * 0.85}" y2="${top + (bottom - top) * 0.65}" stroke="${NOVA_DARK}" stroke-width="0.6"/>`;
    svg += `<line x1="${bx + bw * 0.5}" y1="${top}" x2="${bx + bw * 0.5}" y2="${y + s * 0.05}" stroke="${NOVA_DARK}" stroke-width="0.8"/>`;
  });
  return svg;
}

// Estufa con horno: quemadores arriba, puerta de horno abajo
function iconStove(x, y, s) {
  let svg = iconBox(x, y, s);
  const topH = s * 0.42;
  [0.28, 0.72].forEach((cxf) => {
    [0.32, 0.78].forEach((cyf) => {
      svg += `<circle cx="${x + s * cxf}" cy="${y + topH * cyf}" r="${s * 0.09}" fill="none" stroke="${NOVA_DARK}" stroke-width="0.8"/>`;
    });
  });
  const ovenY = y + topH + s * 0.05;
  const ovenH = s - topH - s * 0.1;
  svg += `<rect x="${x + s * 0.08}" y="${ovenY}" width="${s * 0.84}" height="${ovenH}" fill="none" stroke="${NOVA_DARK}" stroke-width="0.8"/>`;
  svg += `<line x1="${x + s * 0.08}" y1="${ovenY + ovenH * 0.3}" x2="${x + s * 0.92}" y2="${ovenY + ovenH * 0.3}" stroke="${NOVA_DARK}" stroke-width="0.6"/>`;
  svg += `<rect x="${x + s * 0.35}" y="${ovenY + ovenH * 0.6}" width="${s * 0.3}" height="${ovenH * 0.1}" fill="${NOVA_DARK}"/>`;
  return svg;
}

// Fregadero: tarjas con drenaje y llave
function iconSink(x, y, s) {
  let svg = iconBox(x, y, s);
  svg += `<path d="M ${x + s * 0.5} ${y + s * 0.08} v ${s * 0.1} a ${s * 0.08} ${s * 0.08} 0 0 0 ${s * 0.16} 0 v -${s * 0.06}"
    fill="none" stroke="${NOVA_DARK}" stroke-width="0.8"/>`;
  const basinW = s * 0.34;
  [0.08, 0.54].forEach((off) => {
    svg += `<rect x="${x + s * off}" y="${y + s * 0.35}" width="${basinW}" height="${s * 0.5}" rx="3"
      fill="none" stroke="${NOVA_DARK}" stroke-width="0.8"/>`;
    svg += `<circle cx="${x + s * off + basinW / 2}" cy="${y + s * 0.78}" r="${s * 0.03}" fill="${NOVA_DARK}"/>`;
  });
  return svg;
}

// Refrigerador / congelador: puertas con manijas
function iconFridge(x, y, s) {
  let svg = iconBox(x, y, s);
  svg += `<line x1="${x}" y1="${y + s * 0.45}" x2="${x + s}" y2="${y + s * 0.45}" stroke="${NOVA_DARK}" stroke-width="0.8"/>`;
  svg += `<rect x="${x + s * 0.85}" y="${y + s * 0.12}" width="${s * 0.06}" height="${s * 0.22}" fill="${NOVA_DARK}"/>`;
  svg += `<rect x="${x + s * 0.85}" y="${y + s * 0.55}" width="${s * 0.06}" height="${s * 0.32}" fill="${NOVA_DARK}"/>`;
  return svg;
}

// Mesa de vapor: pozos para charolas
function iconSteamTable(x, y, s) {
  let svg = iconBox(x, y, s);
  const n = 3;
  for (let i = 0; i < n; i++) {
    const wellX = x + s * (0.06 + (i * 0.88) / n);
    svg += `<rect x="${wellX}" y="${y + s * 0.2}" width="${s * 0.88 / n - 2}" height="${s * 0.6}" rx="2"
      fill="none" stroke="${NOVA_DARK}" stroke-width="0.8"/>`;
  }
  return svg;
}

// Mesa fria / prep table: superficie de trabajo + unidad refrigerada
function iconPrepTable(x, y, s) {
  let svg = iconBox(x, y, s);
  svg += `<rect x="${x + s * 0.1}" y="${y + s * 0.1}" width="${s * 0.8}" height="${s * 0.35}" fill="none" stroke="${NOVA_DARK}" stroke-width="0.8"/>`;
  svg += `<rect x="${x + s * 0.15}" y="${y + s * 0.55}" width="${s * 0.3}" height="${s * 0.3}" fill="none" stroke="${NOVA_DARK}" stroke-width="0.8"/>`;
  svg += `<rect x="${x + s * 0.55}" y="${y + s * 0.55}" width="${s * 0.3}" height="${s * 0.3}" fill="none" stroke="${NOVA_DARK}" stroke-width="0.8"/>`;
  return svg;
}

// Maquina de hielo: cubos + dispensador
function iconIce(x, y, s) {
  let svg = iconBox(x, y, s);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const cx2 = x + s * 0.12 + c * (s * 0.28);
      const cy2 = y + s * 0.14 + r * (s * 0.3);
      svg += `<rect x="${cx2}" y="${cy2}" width="${s * 0.18}" height="${s * 0.18}" fill="none" stroke="${NOVA_BLUE}" stroke-width="0.8"/>`;
    }
  }
  svg += `<rect x="${x + s * 0.25}" y="${y + s * 0.82}" width="${s * 0.5}" height="${s * 0.08}" fill="${NOVA_DARK}"/>`;
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
  module.exports = { renderBlueprintSVG, renderBlueprintViews };
}
