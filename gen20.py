#!/usr/bin/env python3
"""Generate 20ft trailer background SVG — v3
Changes from v2:
  - Removed detailed gradient wheels
  - Simplified hitch/tongue to match Pan American style (smaller, A-frame)
  - Added visible axle bars
  - Added red propane/gas tank elements below floor
"""

import math, pathlib

S   = 50          # px per foot
FT  = 20          # trailer length in feet
W   = 14          # wall thickness (px)
H   = 7           # interior height (feet)
GAP = 150         # gap between views

BOX_W = FT * S                    # 1000
INT_H = H * S                     # 350
BOX_H = W + INT_H + W             # 378

MARGIN_L = 200
MARGIN_T = 48

# ── positions ─────────────────────────────────────────────────
R_TOP  = MARGIN_T
R_BOT  = R_TOP + BOX_H            # 426
R_FLOOR = R_TOP + W + INT_H       # 412

L_TOP  = R_BOT + GAP              # 576
L_BOT  = L_TOP + BOX_H            # 954
L_FLOOR = L_TOP + W + INT_H       # 940

CANVAS_W = MARGIN_L + BOX_W + 210
CANVAS_H = L_BOT + 110

# ── wheel / axle positions (fraction of trailer length from hitch end) ─────
# Pan American places wheels roughly at 65-70% from front
AXLE_POS = 0.67   # fraction from tongue end
AXLE_X_RIGHT = MARGIN_L + int(BOX_W * AXLE_POS)   # right view, tongue is right
AXLE_X_LEFT  = MARGIN_L + BOX_W - int(BOX_W * AXLE_POS)  # left view, mirrored

# ── helpers ────────────────────────────────────────────────────
lines = []
def L(s): lines.append(s)

def grid(x0, y0, w, h, cols, rows):
    """Draw light grid inside the box."""
    L(f'<g stroke="#d3d8df" stroke-width="0.6">')
    dx = S
    for i in range(1, cols):
        xx = x0 + i * dx
        L(f'<line x1="{xx}" y1="{y0}" x2="{xx}" y2="{y0+h}"/>')
    dy = S
    for j in range(1, rows):
        yy = y0 + j * dy
        L(f'<line x1="{x0}" y1="{yy}" x2="{x0+w}" y2="{yy}"/>')
    L('</g>')

def walls(x, y, bw, bh, floor_y):
    """Cross-hatch walls + floor."""
    L(f'<rect x="{x}" y="{y}" width="{bw}" height="{W}" fill="url(#wall)" stroke="#1a1a1a" stroke-width="1.6"/>')
    L(f'<rect x="{x}" y="{y}" width="{W}" height="{bh}" fill="url(#wall)" stroke="#1a1a1a" stroke-width="1.6"/>')
    L(f'<rect x="{x+bw-W}" y="{y}" width="{W}" height="{bh}" fill="url(#wall)" stroke="#1a1a1a" stroke-width="1.6"/>')
    L(f'<rect x="{x}" y="{floor_y}" width="{bw}" height="{W}" fill="url(#floor)" stroke="#111" stroke-width="1.4"/>')
    L(f'<rect x="{x}" y="{y}" width="{bw}" height="{bh}" fill="none" stroke="#111" stroke-width="2"/>')
    L(f'<rect x="{x+W}" y="{y+W}" width="{bw-2*W}" height="{bh-2*W}" fill="none" stroke="#222" stroke-width="1.1"/>')

def col_labels(x0, y_text, count, reverse=False):
    """Foot labels along the top/bottom of box."""
    for i in range(count):
        n = (count - i) if reverse else (i + 1)
        cx = x0 + W + i * S + S / 2
        L(f'<text x="{cx}" y="{y_text}" text-anchor="middle" font-size="12.5" font-weight="600" fill="#2a2a2a">{n}</text>')

def row_labels(x_text, y0, count):
    """Height labels (7 down to 1)."""
    for j in range(count):
        cy = y0 + W + j * S + S / 2 + 4
        n = H - j
        L(f'<text x="{x_text}" y="{cy}" text-anchor="middle" font-size="12.5" font-weight="600" fill="#2a2a2a">{n}</text>')

def chassis_rail(x, y, w):
    """Steel chassis rail under the floor."""
    L(f'<rect x="{x+10}" y="{y}" width="{w-20}" height="5" fill="url(#metal)" stroke="#2a2a2a" stroke-width="0.8"/>')

def axle_assembly(cx, floor_y, side="right"):
    """Draw axle bar and simple small wheels (Pan American style).
    cx = center x of axle assembly.
    Axle span ~120px (~2.4ft), simple thin rectangles for wheels."""
    ay = floor_y + W + 6   # just below floor
    half_span = 60          # 60px each side of center

    # Axle bar (horizontal)
    L(f'<line x1="{cx-half_span-5}" y1="{ay}" x2="{cx+half_span+5}" y2="{ay}" stroke="#333" stroke-width="3.5"/>')

    # Leaf springs (small angled lines)
    for dx in [-30, 30]:
        sx = cx + dx
        L(f'<path d="M{sx-18},{ay-1} Q{sx},{ay-6} {sx+18},{ay-1}" fill="none" stroke="#555" stroke-width="1.8"/>')

    # Simple wheels (small filled rectangles — side view, like Pan American)
    ww, wh = 14, 26   # wheel width and height (side view rectangle)
    for wx in [cx - half_span, cx + half_span - ww]:
        wy = ay - wh // 2
        L(f'<rect x="{wx}" y="{wy}" width="{ww}" height="{wh}" rx="3" fill="#2a2a2a" stroke="#111" stroke-width="1.2"/>')
        # hub cap
        hcx = wx + ww // 2
        hcy = ay
        L(f'<circle cx="{hcx}" cy="{hcy}" r="4" fill="#555" stroke="#333" stroke-width="0.8"/>')

def hitch_tongue_right(x_end, floor_y):
    """Hitch — right side. 3.5ft tongue (175px)."""
    ty = floor_y + W // 2

    tongue_len = 175
    L(f'<line x1="{x_end}" y1="{ty}" x2="{x_end + tongue_len}" y2="{ty}" stroke="#444" stroke-width="5"/>')

    # Coupler post (vertical)
    cp_x = x_end + tongue_len - 6
    L(f'<rect x="{cp_x}" y="{ty-10}" width="7" height="20" rx="1" fill="url(#metal)" stroke="#333" stroke-width="1.2"/>')

    # Ball coupler hook
    hx = cp_x + 7
    L(f'<path d="M{hx},{ty} q12,0 12,-8 q0,-7 -9,-7" fill="none" stroke="#2f2f2f" stroke-width="3.2"/>')

    # Safety chains (two curved dashed lines from tongue to ground)
    ch_x = x_end + 20
    L(f'<path d="M{cp_x},{ty+6} q-10,16 -{tongue_len//2-5},12" fill="none" stroke="#888" stroke-width="1.2" stroke-dasharray="2.5,2"/>')

    # Jack stand
    jx = x_end + 24
    L(f'<rect x="{jx-2}" y="{ty+6}" width="5" height="46" rx="1" fill="url(#metal)" stroke="#2a2a2a" stroke-width="0.8"/>')
    L(f'<circle cx="{jx}" cy="{ty+56}" r="7" fill="#8c929b" stroke="#5a5f66" stroke-width="1.5"/>')

def hitch_tongue_left(x_start, floor_y):
    """Hitch — left side (mirrored). 3.5ft tongue (175px)."""
    ty = floor_y + W // 2

    tongue_len = 175
    L(f'<line x1="{x_start - tongue_len}" y1="{ty}" x2="{x_start}" y2="{ty}" stroke="#444" stroke-width="5"/>')

    cp_x = x_start - tongue_len - 1
    L(f'<rect x="{cp_x}" y="{ty-10}" width="7" height="20" rx="1" fill="url(#metal)" stroke="#333" stroke-width="1.2"/>')

    hx = cp_x
    L(f'<path d="M{hx},{ty} q-12,0 -12,-8 q0,-7 9,-7" fill="none" stroke="#2f2f2f" stroke-width="3.2"/>')

    L(f'<path d="M{cp_x+7},{ty+6} q10,16 {tongue_len//2-5},12" fill="none" stroke="#888" stroke-width="1.2" stroke-dasharray="2.5,2"/>')

    jx = x_start - 24
    L(f'<rect x="{jx-2}" y="{ty+6}" width="5" height="46" rx="1" fill="url(#metal)" stroke="#2a2a2a" stroke-width="0.8"/>')
    L(f'<circle cx="{jx}" cy="{ty+56}" r="7" fill="#8c929b" stroke="#5a5f66" stroke-width="1.5"/>')

def bumper_plumbing(x, floor_y, side="left"):
    """Bumper and plumbing stub on the rear wall side."""
    by = floor_y - 6
    if side == "left":
        # Left side of right view (rear)
        bx = x - 4
        L(f'<rect x="{bx}" y="{floor_y}" width="12" height="{W}" fill="#5a5a5a" stroke="#2a2a2a" stroke-width="1.4"/>')
        # Plumbing
        px = bx - 8
        L(f'<line x1="{px}" y1="{by}" x2="{px}" y2="{by+50}" stroke="#444" stroke-width="3"/>')
        L(f'<line x1="{px}" y1="{by+38}" x2="{px+18}" y2="{by+38}" stroke="#444" stroke-width="2.6"/>')
        L(f'<line x1="{px+2}" y1="{by+28}" x2="{px+14}" y2="{by+28}" stroke="#444" stroke-width="4"/>')
        L(f'<circle cx="{px+22}" cy="{by+38}" r="4.5" fill="none" stroke="#444" stroke-width="1.6"/>')
    else:
        # Right side of left view (rear)
        bx = x + BOX_W + W - 8
        L(f'<rect x="{bx}" y="{floor_y}" width="12" height="{W}" fill="#5a5a5a" stroke="#2a2a2a" stroke-width="1.4"/>')
        px = bx + 20
        L(f'<line x1="{px}" y1="{by}" x2="{px}" y2="{by+50}" stroke="#444" stroke-width="3"/>')
        L(f'<line x1="{px-18}" y1="{by+38}" x2="{px}" y2="{by+38}" stroke="#444" stroke-width="2.6"/>')
        L(f'<line x1="{px-14}" y1="{by+28}" x2="{px-2}" y2="{by+28}" stroke="#444" stroke-width="4"/>')
        L(f'<circle cx="{px-22}" cy="{by+38}" r="4.5" fill="none" stroke="#444" stroke-width="1.6"/>')

def orientation_box(x, y, arrow_dir):
    """Small box showing front/hitch direction."""
    L(f'<rect x="{x}" y="{y}" width="44" height="40" rx="3" fill="#fff" stroke="#1a1a1a" stroke-width="1.8"/>')
    L(f'<text x="{x+16}" y="{y+27}" text-anchor="middle" font-size="22" fill="#1a1a1a">&#8593;</text>')
    if arrow_dir == "right":
        L(f'<polygon points="{x+34},{y+12} {x+44},{y+20} {x+34},{y+28}" fill="#1a1a1a"/>')
    else:
        L(f'<polygon points="{x+10},{y+12} {x},{y+20} {x+10},{y+28}" fill="#1a1a1a"/>')

# ══════════════════════════════════════════════════════════════
#  BUILD SVG
# ══════════════════════════════════════════════════════════════
L(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS_W} {CANVAS_H}" width="{CANVAS_W}" height="{CANVAS_H}" font-family="Arial, Helvetica, sans-serif">')
L('<defs>')
L('  <pattern id="wall" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">')
L('    <rect width="7" height="7" fill="#e9ecef"/>')
L('    <line x1="0" y1="0" x2="0" y2="7" stroke="#2b2b2b" stroke-width="1.1"/>')
L('  </pattern>')
L('  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">')
L('    <stop offset="0%" stop-color="#3a3a3a"/>')
L('    <stop offset="100%" stop-color="#1c1c1c"/>')
L('  </linearGradient>')
L('  <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">')
L('    <stop offset="0%" stop-color="#777"/>')
L('    <stop offset="50%" stop-color="#555"/>')
L('    <stop offset="100%" stop-color="#3d3d3d"/>')
L('  </linearGradient>')
L('</defs>')

# Background
L(f'<rect width="{CANVAS_W}" height="{CANVAS_H}" fill="#ffffff"/>')

# ── RIGHT VIEW ────────────────────────────────────────────────
rx, ry = MARGIN_L, R_TOP
int_x, int_y = rx + W, ry + W

# Shadow
L(f'<rect x="{rx+3}" y="{ry+3}" width="{BOX_W}" height="{BOX_H}" fill="#000" opacity="0.06"/>')
# Interior white
L(f'<rect x="{int_x}" y="{int_y}" width="{BOX_W-2*W}" height="{INT_H}" fill="#ffffff"/>')
# Grid
grid(int_x, int_y, BOX_W - 2*W, INT_H, FT, H)
# Walls
walls(rx, ry, BOX_W, BOX_H, R_FLOOR)
# Labels
col_labels(rx, ry - 7, FT, reverse=False)
row_labels(rx - 12, ry, H)

# Bumper (left = rear for right view)
bumper_plumbing(rx, R_FLOOR, side="left")

# Chassis rail
chassis_rail(rx, R_FLOOR + W + 2, BOX_W)

# Axle assembly
axle_assembly(AXLE_X_RIGHT, R_FLOOR, side="right")

# Hitch tongue (right end)
hitch_tongue_right(rx + BOX_W, R_FLOOR)

# Ground line
ground_y = R_FLOOR + W + 52
L(f'<line x1="10" y1="{ground_y}" x2="{CANVAS_W-10}" y2="{ground_y}" stroke="#b4bac1" stroke-width="0.8" stroke-dasharray="7,5"/>')

# Label
L(f'<text x="{rx + BOX_W - 4}" y="{ground_y+20}" text-anchor="end" font-size="13" font-weight="700" fill="#1a1a2e" letter-spacing="1">INTERIOR VIEW - RIGHT</text>')

# Orientation box (top-right, arrow pointing right = tongue direction)
orientation_box(rx + BOX_W + 18, ry - 4, "right")

# ── LEFT VIEW ─────────────────────────────────────────────────
lx, ly = MARGIN_L, L_TOP
lint_x, lint_y = lx + W, ly + W

# Shadow
L(f'<rect x="{lx+3}" y="{ly+3}" width="{BOX_W}" height="{BOX_H}" fill="#000" opacity="0.06"/>')
# Interior white
L(f'<rect x="{lint_x}" y="{lint_y}" width="{BOX_W-2*W}" height="{INT_H}" fill="#ffffff"/>')
# Grid
grid(lint_x, lint_y, BOX_W - 2*W, INT_H, FT, H)
# Walls
walls(lx, ly, BOX_W, BOX_H, L_FLOOR)
# Labels (reversed numbering)
col_labels(lx, ly - 7, FT, reverse=True)
row_labels(lx + BOX_W + 2, ly, H)

# Bumper (right = rear for left view)
bumper_plumbing(lx, L_FLOOR, side="right")

# Chassis rail
chassis_rail(lx, L_FLOOR + W + 2, BOX_W)

# Axle assembly
axle_assembly(AXLE_X_LEFT, L_FLOOR, side="left")

# Hitch tongue (left end)
hitch_tongue_left(lx, L_FLOOR)

# Ground line
ground_y2 = L_FLOOR + W + 52
L(f'<line x1="10" y1="{ground_y2}" x2="{CANVAS_W-10}" y2="{ground_y2}" stroke="#b4bac1" stroke-width="0.8" stroke-dasharray="7,5"/>')

# Label
L(f'<text x="{lx + BOX_W - 4}" y="{ground_y2+20}" text-anchor="end" font-size="13" font-weight="700" fill="#1a1a2e" letter-spacing="1">INTERIOR VIEW - LEFT</text>')

# Orientation box (top-left, arrow pointing left = tongue direction)
orientation_box(lx - 52, ly - 4, "left")

# ── Branding ──────────────────────────────────────────────────
L(f'<text x="10" y="22" font-size="15" font-weight="800" fill="#0D2244" letter-spacing="1">NOVA FOOD TRAILERS</text>')
L(f'<text x="{CANVAS_W-12}" y="22" text-anchor="end" font-size="12" font-weight="700" fill="#2a2a2a">{FT} FT &#183; SHELL (walls incl.)</text>')

L('</svg>')

# ── write ─────────────────────────────────────────────────────
svg = "\n".join(lines)
out = pathlib.Path("templates/backgrounds/trailer_20ft.svg")
out.write_text(svg)
print(f"✓ wrote {out}  ({len(svg)} bytes)")
