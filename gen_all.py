#!/usr/bin/env python3
"""Generate trailer background SVGs for all sizes (10–30ft).
Same approved style as the 20ft version: cross-hatch walls, grid,
straight-bar tongue hitch, axle assembly, bumper/plumbing."""

import pathlib

SIZES = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]

S   = 50
W   = 14
H   = 7
GAP = 150
TONGUE_LEN = 175  # 3.5ft — fixed for all sizes

INT_H = H * S
BOX_H = W + INT_H + W
MARGIN_L = 200
MARGIN_T = 48


def generate(ft):
    BOX_W = ft * S
    R_TOP  = MARGIN_T
    R_FLOOR = R_TOP + W + INT_H
    R_BOT  = R_TOP + BOX_H
    L_TOP  = R_BOT + GAP
    L_FLOOR = L_TOP + W + INT_H
    L_BOT  = L_TOP + BOX_H
    CANVAS_W = MARGIN_L + BOX_W + 210
    CANVAS_H = L_BOT + 110

    AXLE_POS = 0.67
    AXLE_X_RIGHT = MARGIN_L + int(BOX_W * AXLE_POS)
    AXLE_X_LEFT  = MARGIN_L + BOX_W - int(BOX_W * AXLE_POS)

    lines = []
    def O(s): lines.append(s)

    # ── helpers ────────────────────────────────────────────
    def grid(x0, y0, w, h, cols, rows):
        O('<g stroke="#d3d8df" stroke-width="0.6">')
        for i in range(1, cols):
            xx = x0 + i * S
            O(f'<line x1="{xx}" y1="{y0}" x2="{xx}" y2="{y0+h}"/>')
        for j in range(1, rows):
            yy = y0 + j * S
            O(f'<line x1="{x0}" y1="{yy}" x2="{x0+w}" y2="{yy}"/>')
        O('</g>')

    def walls(x, y, bw, bh, floor_y):
        O(f'<rect x="{x}" y="{y}" width="{bw}" height="{W}" fill="url(#wall)" stroke="#1a1a1a" stroke-width="1.6"/>')
        O(f'<rect x="{x}" y="{y}" width="{W}" height="{bh}" fill="url(#wall)" stroke="#1a1a1a" stroke-width="1.6"/>')
        O(f'<rect x="{x+bw-W}" y="{y}" width="{W}" height="{bh}" fill="url(#wall)" stroke="#1a1a1a" stroke-width="1.6"/>')
        O(f'<rect x="{x}" y="{floor_y}" width="{bw}" height="{W}" fill="url(#floor)" stroke="#111" stroke-width="1.4"/>')
        O(f'<rect x="{x}" y="{y}" width="{bw}" height="{bh}" fill="none" stroke="#111" stroke-width="2"/>')
        O(f'<rect x="{x+W}" y="{y+W}" width="{bw-2*W}" height="{bh-2*W}" fill="none" stroke="#222" stroke-width="1.1"/>')

    def col_labels(x0, y_text, count, reverse=False):
        for i in range(count):
            n = (count - i) if reverse else (i + 1)
            cx = x0 + W + i * S + S / 2
            O(f'<text x="{cx}" y="{y_text}" text-anchor="middle" font-size="12.5" font-weight="600" fill="#2a2a2a">{n}</text>')

    def row_labels(x_text, y0):
        for j in range(H):
            cy = y0 + W + j * S + S / 2 + 4
            n = H - j
            O(f'<text x="{x_text}" y="{cy}" text-anchor="middle" font-size="12.5" font-weight="600" fill="#2a2a2a">{n}</text>')

    def chassis_rail(x, y, w):
        O(f'<rect x="{x+10}" y="{y}" width="{w-20}" height="5" fill="url(#metal)" stroke="#2a2a2a" stroke-width="0.8"/>')

    def axle_assembly(cx, floor_y):
        ay = floor_y + W + 6
        half_span = 60
        O(f'<line x1="{cx-half_span-5}" y1="{ay}" x2="{cx+half_span+5}" y2="{ay}" stroke="#333" stroke-width="3.5"/>')
        for dx in [-30, 30]:
            sx = cx + dx
            O(f'<path d="M{sx-18},{ay-1} Q{sx},{ay-6} {sx+18},{ay-1}" fill="none" stroke="#555" stroke-width="1.8"/>')
        ww, wh = 14, 26
        for wx in [cx - half_span, cx + half_span - ww]:
            wy = ay - wh // 2
            O(f'<rect x="{wx}" y="{wy}" width="{ww}" height="{wh}" rx="3" fill="#2a2a2a" stroke="#111" stroke-width="1.2"/>')
            hcx = wx + ww // 2
            O(f'<circle cx="{hcx}" cy="{ay}" r="4" fill="#555" stroke="#333" stroke-width="0.8"/>')

    def hitch_right(x_end, floor_y):
        bar_h = 16
        bar_y = floor_y + (W - bar_h) // 2
        tip_x = x_end + TONGUE_LEN
        O(f'<rect x="{x_end}" y="{bar_y}" width="{TONGUE_LEN}" height="{bar_h}" fill="#222" stroke="#111" stroke-width="2"/>')
        cp_w, cp_h = 22, 24
        cp_x = tip_x - 4
        cp_y = bar_y + (bar_h - cp_h) // 2
        O(f'<rect x="{cp_x}" y="{cp_y}" width="{cp_w}" height="{cp_h}" rx="2" fill="#333" stroke="#111" stroke-width="2.2"/>')
        bx = cp_x + cp_w
        by = bar_y + bar_h // 2
        O(f'<circle cx="{bx + 6}" cy="{by}" r="5" fill="#555" stroke="#222" stroke-width="2"/>')
        O(f'<circle cx="{bx + 6}" cy="{by}" r="2" fill="#333"/>')
        jx = x_end + int(TONGUE_LEN * 0.4)
        jack_top = bar_y + bar_h
        jack_h = 70
        jack_w = 10
        O(f'<rect x="{jx - jack_w//2}" y="{jack_top}" width="{jack_w}" height="{jack_h}" fill="#444" stroke="#222" stroke-width="1.8"/>')
        foot_y = jack_top + jack_h
        O(f'<rect x="{jx - 10}" y="{foot_y}" width="20" height="5" rx="1" fill="#555" stroke="#222" stroke-width="1.4"/>')
        O(f'<line x1="{jx - 10}" y1="{jack_top + 8}" x2="{jx + 10}" y2="{jack_top + 8}" stroke="#333" stroke-width="3"/>')
        O(f'<circle cx="{jx + 10}" cy="{jack_top + 8}" r="3" fill="#555" stroke="#333" stroke-width="1"/>')
        for cx in [x_end + int(TONGUE_LEN * 0.6), x_end + int(TONGUE_LEN * 0.7)]:
            cy = bar_y + bar_h
            O(f'<path d="M{cx},{cy} q-4,12 0,22 q4,8 -2,14" fill="none" stroke="#444" stroke-width="2" stroke-dasharray="3,2"/>')

    def hitch_left(x_start, floor_y):
        bar_h = 16
        bar_y = floor_y + (W - bar_h) // 2
        tip_x = x_start - TONGUE_LEN
        O(f'<rect x="{tip_x}" y="{bar_y}" width="{TONGUE_LEN}" height="{bar_h}" fill="#222" stroke="#111" stroke-width="2"/>')
        cp_w, cp_h = 22, 24
        cp_x = tip_x - cp_w + 4
        cp_y = bar_y + (bar_h - cp_h) // 2
        O(f'<rect x="{cp_x}" y="{cp_y}" width="{cp_w}" height="{cp_h}" rx="2" fill="#333" stroke="#111" stroke-width="2.2"/>')
        bx = cp_x
        by = bar_y + bar_h // 2
        O(f'<circle cx="{bx - 6}" cy="{by}" r="5" fill="#555" stroke="#222" stroke-width="2"/>')
        O(f'<circle cx="{bx - 6}" cy="{by}" r="2" fill="#333"/>')
        jx = x_start - int(TONGUE_LEN * 0.4)
        jack_top = bar_y + bar_h
        jack_h = 70
        jack_w = 10
        O(f'<rect x="{jx - jack_w//2}" y="{jack_top}" width="{jack_w}" height="{jack_h}" fill="#444" stroke="#222" stroke-width="1.8"/>')
        foot_y = jack_top + jack_h
        O(f'<rect x="{jx - 10}" y="{foot_y}" width="20" height="5" rx="1" fill="#555" stroke="#222" stroke-width="1.4"/>')
        O(f'<line x1="{jx - 10}" y1="{jack_top + 8}" x2="{jx + 10}" y2="{jack_top + 8}" stroke="#333" stroke-width="3"/>')
        O(f'<circle cx="{jx - 10}" cy="{jack_top + 8}" r="3" fill="#555" stroke="#333" stroke-width="1"/>')
        for cx in [x_start - int(TONGUE_LEN * 0.6), x_start - int(TONGUE_LEN * 0.7)]:
            cy = bar_y + bar_h
            O(f'<path d="M{cx},{cy} q4,12 0,22 q-4,8 2,14" fill="none" stroke="#444" stroke-width="2" stroke-dasharray="3,2"/>')

    def bumper_plumbing(x, floor_y, side):
        by = floor_y - 6
        if side == "left":
            bx = x - 4
            O(f'<rect x="{bx}" y="{floor_y}" width="12" height="{W}" fill="#5a5a5a" stroke="#2a2a2a" stroke-width="1.4"/>')
            px = bx - 8
            O(f'<line x1="{px}" y1="{by}" x2="{px}" y2="{by+50}" stroke="#444" stroke-width="3"/>')
            O(f'<line x1="{px}" y1="{by+38}" x2="{px+18}" y2="{by+38}" stroke="#444" stroke-width="2.6"/>')
            O(f'<line x1="{px+2}" y1="{by+28}" x2="{px+14}" y2="{by+28}" stroke="#444" stroke-width="4"/>')
            O(f'<circle cx="{px+22}" cy="{by+38}" r="4.5" fill="none" stroke="#444" stroke-width="1.6"/>')
        else:
            bx = x + BOX_W + W - 8
            O(f'<rect x="{bx}" y="{floor_y}" width="12" height="{W}" fill="#5a5a5a" stroke="#2a2a2a" stroke-width="1.4"/>')
            px = bx + 20
            O(f'<line x1="{px}" y1="{by}" x2="{px}" y2="{by+50}" stroke="#444" stroke-width="3"/>')
            O(f'<line x1="{px-18}" y1="{by+38}" x2="{px}" y2="{by+38}" stroke="#444" stroke-width="2.6"/>')
            O(f'<line x1="{px-14}" y1="{by+28}" x2="{px-2}" y2="{by+28}" stroke="#444" stroke-width="4"/>')
            O(f'<circle cx="{px-22}" cy="{by+38}" r="4.5" fill="none" stroke="#444" stroke-width="1.6"/>')

    def orientation_box(x, y, arrow_dir):
        O(f'<rect x="{x}" y="{y}" width="44" height="40" rx="3" fill="#fff" stroke="#1a1a1a" stroke-width="1.8"/>')
        O(f'<text x="{x+16}" y="{y+27}" text-anchor="middle" font-size="22" fill="#1a1a1a">&#8593;</text>')
        if arrow_dir == "right":
            O(f'<polygon points="{x+34},{y+12} {x+44},{y+20} {x+34},{y+28}" fill="#1a1a1a"/>')
        else:
            O(f'<polygon points="{x+10},{y+12} {x},{y+20} {x+10},{y+28}" fill="#1a1a1a"/>')

    # ══════════════════════════════════════════════════════
    #  BUILD SVG
    # ══════════════════════════════════════════════════════
    O(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS_W} {CANVAS_H}" width="{CANVAS_W}" height="{CANVAS_H}" font-family="Arial, Helvetica, sans-serif">')
    O('<defs>')
    O('  <pattern id="wall" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">')
    O('    <rect width="7" height="7" fill="#e9ecef"/>')
    O('    <line x1="0" y1="0" x2="0" y2="7" stroke="#2b2b2b" stroke-width="1.1"/>')
    O('  </pattern>')
    O('  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">')
    O('    <stop offset="0%" stop-color="#3a3a3a"/>')
    O('    <stop offset="100%" stop-color="#1c1c1c"/>')
    O('  </linearGradient>')
    O('  <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">')
    O('    <stop offset="0%" stop-color="#777"/>')
    O('    <stop offset="50%" stop-color="#555"/>')
    O('    <stop offset="100%" stop-color="#3d3d3d"/>')
    O('  </linearGradient>')
    O('</defs>')

    O(f'<rect width="{CANVAS_W}" height="{CANVAS_H}" fill="#ffffff"/>')

    # ── RIGHT VIEW ──────────────────────────────────────
    rx, ry = MARGIN_L, R_TOP
    int_x, int_y = rx + W, ry + W

    O(f'<rect x="{rx+3}" y="{ry+3}" width="{BOX_W}" height="{BOX_H}" fill="#000" opacity="0.06"/>')
    O(f'<rect x="{int_x}" y="{int_y}" width="{BOX_W-2*W}" height="{INT_H}" fill="#ffffff"/>')
    grid(int_x, int_y, BOX_W - 2*W, INT_H, ft, H)
    walls(rx, ry, BOX_W, BOX_H, R_FLOOR)
    col_labels(rx, ry - 7, ft, reverse=False)
    row_labels(rx - 12, ry)
    bumper_plumbing(rx, R_FLOOR, side="left")
    chassis_rail(rx, R_FLOOR + W + 2, BOX_W)
    axle_assembly(AXLE_X_RIGHT, R_FLOOR)
    hitch_right(rx + BOX_W, R_FLOOR)

    ground_y = R_FLOOR + W + 52
    O(f'<line x1="10" y1="{ground_y}" x2="{CANVAS_W-10}" y2="{ground_y}" stroke="#b4bac1" stroke-width="0.8" stroke-dasharray="7,5"/>')
    O(f'<text x="{rx + BOX_W - 4}" y="{ground_y+20}" text-anchor="end" font-size="13" font-weight="700" fill="#1a1a2e" letter-spacing="1">INTERIOR VIEW - RIGHT</text>')
    orientation_box(rx + BOX_W + 18, ry - 4, "right")

    # ── LEFT VIEW ───────────────────────────────────────
    lx, ly = MARGIN_L, L_TOP
    lint_x, lint_y = lx + W, ly + W

    O(f'<rect x="{lx+3}" y="{ly+3}" width="{BOX_W}" height="{BOX_H}" fill="#000" opacity="0.06"/>')
    O(f'<rect x="{lint_x}" y="{lint_y}" width="{BOX_W-2*W}" height="{INT_H}" fill="#ffffff"/>')
    grid(lint_x, lint_y, BOX_W - 2*W, INT_H, ft, H)
    walls(lx, ly, BOX_W, BOX_H, L_FLOOR)
    col_labels(lx, ly - 7, ft, reverse=True)
    row_labels(lx + BOX_W + 2, ly)
    bumper_plumbing(lx, L_FLOOR, side="right")
    chassis_rail(lx, L_FLOOR + W + 2, BOX_W)
    axle_assembly(AXLE_X_LEFT, L_FLOOR)
    hitch_left(lx, L_FLOOR)

    ground_y2 = L_FLOOR + W + 52
    O(f'<line x1="10" y1="{ground_y2}" x2="{CANVAS_W-10}" y2="{ground_y2}" stroke="#b4bac1" stroke-width="0.8" stroke-dasharray="7,5"/>')
    O(f'<text x="{lx + BOX_W - 4}" y="{ground_y2+20}" text-anchor="end" font-size="13" font-weight="700" fill="#1a1a2e" letter-spacing="1">INTERIOR VIEW - LEFT</text>')
    orientation_box(lx - 52, ly - 4, "left")

    # ── Branding ────────────────────────────────────────
    O(f'<text x="10" y="22" font-size="15" font-weight="800" fill="#0D2244" letter-spacing="1">NOVA FOOD TRAILERS</text>')
    O(f'<text x="{CANVAS_W-12}" y="22" text-anchor="end" font-size="12" font-weight="700" fill="#2a2a2a">{ft} FT &#183; SHELL (walls incl.)</text>')

    O('</svg>')
    return "\n".join(lines)


# ── Generate all sizes ──────────────────────────────────
out_dir = pathlib.Path("templates/backgrounds")
out_dir.mkdir(parents=True, exist_ok=True)

for ft in SIZES:
    svg = generate(ft)
    path = out_dir / f"trailer_{ft}ft.svg"
    path.write_text(svg)
    print(f"  ✓ {path}  ({len(svg):,} bytes)")

print(f"\nDone — {len(SIZES)} trailer backgrounds generated.")
