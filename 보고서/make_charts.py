# -*- coding: utf-8 -*-
import csv, json
from datetime import date, datetime
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm

plt.rcParams['font.family'] = 'Malgun Gothic'
plt.rcParams['axes.unicode_minus'] = False
plt.rcParams['font.size'] = 11

BASE = r"D:\프로젝트\창원_AI데이터_공모전\기상데이터"
OUT = r"D:\프로젝트\창원_AI데이터_공모전\보고서\차트"

# palette (from dataviz reference, light mode)
C_BLUE = '#2a78d6'
C_ORANGE = '#eb6834'
C_GREEN = '#1baf7a'
C_GOOD = '#0ca30c'
C_CRIT = '#d03b3b'
C_MUTED = '#8f7f83'
C_ACCENT = '#b8577c'
C_ACCENT_SOFT = '#f2dce4'
C_GRID = '#e4dcd6'
C_INK = '#241b1e'

with open(f'{BASE}/dashboard_data.json', encoding='utf-8') as f:
    DATA = json.load(f)

# ---------- Chart 1: Timeline / Gantt ----------
fig, ax = plt.subplots(figsize=(9.2, 6.4), dpi=200)
years = [d['year'] for d in DATA['timeline']]
y0 = date(2001,1,1)

def doy(dstr):
    y,m,dd = map(int, dstr.split('-'))
    return (date(2001,m,dd) - y0).days

for i, rec in enumerate(DATA['timeline']):
    yy = rec['year']
    row = len(years) - 1 - i  # reverse so 2011 at bottom->top order like report (2011 top)
    row = i  # keep natural order, 2011 at top
    ypos = row
    if rec['fstart'] and rec['fend']:
        x1, x2 = doy(rec['fstart']), doy(rec['fend'])
        ax.barh(ypos, x2-x1, left=x1, height=0.55, color=C_ACCENT_SOFT, edgecolor=C_ACCENT, linewidth=1.1, zorder=2)
    else:
        ax.text(doy('2001-04-01'), ypos, '축제 취소(코로나)', va='center', ha='center', fontsize=8.5, color=C_MUTED, style='italic', zorder=2)

    if rec['gaehwa']:
        gx = doy(rec['gaehwa'])
        ax.scatter([gx], [ypos], s=42, color=C_BLUE, zorder=4, edgecolor='white', linewidth=0.8)
        if rec['manbal']:
            mx = doy(rec['manbal'])
            ax.plot([gx, mx], [ypos, ypos], color=C_MUTED, linewidth=1.3, alpha=0.4, zorder=1)

    if rec['manbal']:
        mx = doy(rec['manbal'])
        if rec['fstart'] and rec['fend']:
            hit = rec['fstart'] <= rec['manbal'] <= rec['fend']
        else:
            hit = None
        color = C_MUTED if hit is None else (C_GOOD if hit else C_CRIT)
        ax.scatter([mx], [ypos], s=64, color=color, zorder=5, edgecolor='white', linewidth=0.9)

ax.set_yticks(range(len(years)))
ax.set_yticklabels(years, fontsize=10)
ax.invert_yaxis()
xt = [doy(f'2001-{m:02d}-{dd:02d}') for m,dd in [(3,10),(3,15),(3,20),(3,25),(3,31),(4,5),(4,10),(4,15)]]
xl = ['3/10','3/15','3/20','3/25','3/31','4/5','4/10','4/15']
ax.set_xticks(xt); ax.set_xticklabels(xl, fontsize=9.5)
ax.set_xlim(doy('2001-03-08'), doy('2001-04-17'))
ax.grid(axis='x', color=C_GRID, linewidth=0.8, zorder=0)
ax.set_axisbelow(True)
for spine in ['top','right','left']:
    ax.spines[spine].set_visible(False)
ax.spines['bottom'].set_color('#c3c2b7')
ax.set_title('진해군항제 개최기간 vs 벚꽃 개화·만발일 (2011–2026)', fontsize=12.5, fontweight='bold', pad=14, loc='left')

from matplotlib.lines import Line2D
from matplotlib.patches import Patch
legend_elems = [
    Patch(facecolor=C_ACCENT_SOFT, edgecolor=C_ACCENT, label='축제 개최기간'),
    Line2D([0],[0], marker='o', color='w', markerfacecolor=C_BLUE, markersize=8, label='개화일'),
    Line2D([0],[0], marker='o', color='w', markerfacecolor=C_GOOD, markersize=9, label='만발일(축제기간 적중)'),
    Line2D([0],[0], marker='o', color='w', markerfacecolor=C_CRIT, markersize=9, label='만발일(조기만개)'),
]
ax.legend(handles=legend_elems, loc='upper center', bbox_to_anchor=(0.5, -0.09), ncol=2, frameon=False, fontsize=9.5)
plt.tight_layout()
plt.savefig(f'{OUT}/chart1_timeline.png', bbox_inches='tight', facecolor='white')
plt.close()

# ---------- Chart 2: Deviation trend ----------
fig, ax = plt.subplots(figsize=(9.2, 3.6), dpi=200)
trend = DATA['trend']
yrs = [d['year'] for d in trend]
devs = [d['dev'] for d in trend]
ax.axhline(0, color='#cabfb9', linewidth=1.2, zorder=1)
ax.plot(yrs, devs, color=C_BLUE, linewidth=2, zorder=3, solid_capstyle='round')
colors = [C_BLUE if d < 0 else C_ORANGE for d in devs]
ax.scatter(yrs, devs, s=26, color=colors, zorder=4, edgecolor='white', linewidth=0.6)
ax.grid(axis='y', color=C_GRID, linewidth=0.8, zorder=0)
ax.set_axisbelow(True)
for spine in ['top','right']:
    ax.spines[spine].set_visible(False)
ax.set_ylabel('평년 대비 편차(일)', fontsize=10)
ax.set_xlim(1999, 2027)
ax.set_title('개화일 평년(1991~2020) 대비 편차 추이 (2000–2026, 창원관측소)', fontsize=12.5, fontweight='bold', pad=12, loc='left')
ax.text(0.99, 0.03, '음수 = 평년보다 빠름', transform=ax.transAxes, ha='right', fontsize=9, color=C_MUTED)
plt.tight_layout()
plt.savefig(f'{OUT}/chart2_trend.png', bbox_inches='tight', facecolor='white')
plt.close()

# ---------- Chart 3: Scatter validation ----------
fig, ax = plt.subplots(figsize=(6.4, 6.4), dpi=200)
def to_doy(dstr):
    y,m,dd = map(int, dstr.split('-'))
    return (date(2001,m,dd) - date(2001,3,1)).days

for gname, color, marker in [('개화', C_BLUE, 'o'), ('만발', C_ORANGE, '^')]:
    pts = DATA['scatter'][gname]
    xs = [to_doy(p['actual']) for p in pts]
    ys = [to_doy(p['pred']) for p in pts]
    ax.scatter(xs, ys, s=52, color=color, alpha=0.85, edgecolor='white', linewidth=0.8, label=f'{gname} (n={len(pts)})', marker=marker, zorder=3)

lims = [-14, 42]
ax.plot(lims, lims, color='#c3c2b7', linewidth=1.3, linestyle='--', zorder=1)
ax.set_xlim(lims); ax.set_ylim(lims)
ticks = [to_doy(f'2001-{m:02d}-{dd:02d}') for m,dd in [(3,5),(3,15),(3,25),(4,4),(4,14)]]
tlabels = ['3/5','3/15','3/25','4/4','4/14']
ax.set_xticks(ticks); ax.set_xticklabels(tlabels, fontsize=9.5)
ax.set_yticks(ticks); ax.set_yticklabels(tlabels, fontsize=9.5)
ax.set_xlabel('실제일', fontsize=10.5)
ax.text(-0.12, 1.0, '예측일', transform=ax.transAxes, fontsize=10.5, ha='left', va='top')
ax.grid(color=C_GRID, linewidth=0.8, zorder=0)
ax.set_axisbelow(True)
for spine in ['top','right']:
    ax.spines[spine].set_visible(False)
ax.set_aspect('equal')
ax.legend(loc='upper left', frameon=False, fontsize=10)
ax.set_title('예측일 vs 실제일 (leave-one-out 교차검증)', fontsize=12.5, fontweight='bold', pad=12, loc='left')
plt.tight_layout()
plt.savefig(f'{OUT}/chart3_scatter.png', bbox_inches='tight', facecolor='white')
plt.close()

# ---------- Chart 4: Regional correlation ----------
fig, ax = plt.subplots(figsize=(8.4, 4.2), dpi=200)
items = sorted(DATA['regional_corr'].items(), key=lambda x: x[1])
names = [k for k,v in items]
vals = [v for k,v in items]
bars = ax.barh(names, vals, color=C_GREEN, height=0.6, zorder=3)
for name, v in zip(names, vals):
    ax.text(v + 0.012, names.index(name), f'{v:.3f}', va='center', fontsize=9.5, color=C_INK)
ax.set_xlim(0, 1.08)
ax.grid(axis='x', color=C_GRID, linewidth=0.8, zorder=0)
ax.set_axisbelow(True)
for spine in ['top','right']:
    ax.spines[spine].set_visible(False)
ax.set_xlabel('상관계수 (r)', fontsize=10.5)
ax.set_title('창원 개화편차 vs 인접 8개 지점 상관계수', fontsize=12.5, fontweight='bold', pad=12, loc='left')
plt.tight_layout()
plt.savefig(f'{OUT}/chart4_regional.png', bbox_inches='tight', facecolor='white')
plt.close()

print("done")
