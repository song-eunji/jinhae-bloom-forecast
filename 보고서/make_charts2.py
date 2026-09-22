# -*- coding: utf-8 -*-
import json
from datetime import date, timedelta
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

plt.rcParams['font.family'] = 'Malgun Gothic'
plt.rcParams['axes.unicode_minus'] = False
plt.rcParams['font.size'] = 11

WEATHER_DIR = r"D:\프로젝트\창원_AI데이터_공모전\기상데이터"
OUT = r"D:\프로젝트\창원_AI데이터_공모전\보고서\차트"

C_BLUE = '#2a78d6'
C_ORANGE = '#eb6834'
C_GREEN = '#1baf7a'
C_ACCENT = '#b8577c'
C_MUTED = '#8f7f83'
C_GRID = '#e4dcd6'
C_GOOD = '#0ca30c'
C_CRIT = '#d03b3b'

# ---------- Chart 5: National bloom front ----------
with open(f'{WEATHER_DIR}/bloomfront_data.json', encoding='utf-8') as f:
    rows = json.load(f)  # [name, lat, mean_doy]

fig, ax = plt.subplots(figsize=(8.6, 5.6), dpi=200)
xs = [r[1] for r in rows]
ys = [r[2] for r in rows]
names = [r[0] for r in rows]

colors = [C_ACCENT if n == '창원' else C_BLUE for n in names]
sizes = [90 if n == '창원' else 40 for n in names]
ax.scatter(xs, ys, s=sizes, c=colors, zorder=4, edgecolor='white', linewidth=0.8)

# regression line
n = len(xs)
mx, my = sum(xs)/n, sum(ys)/n
cov = sum((a-mx)*(b-my) for a,b in zip(xs,ys))/n
varx = sum((a-mx)**2 for a in xs)/n
slope = cov/varx
intercept = my - slope*mx
xr = [min(xs)-0.3, max(xs)+0.3]
yr = [slope*x+intercept for x in xr]
ax.plot(xr, yr, color=C_MUTED, linewidth=1.4, linestyle='--', zorder=2)

label_offsets = {
    '창원': (18, -16), '제주': (0, 10), '서울': (0, 10), '강릉': (0, -14),
    '대전': (0, 10), '부산': (-16, 10), '전주': (0, 10),
}
for name, lat, md in rows:
    if name in label_offsets:
        dx, dy = label_offsets[name]
        ax.annotate(name, (lat, md), textcoords="offset points", xytext=(dx, dy),
                    ha=('left' if name=='창원' else 'center'), fontsize=9.5,
                    fontweight=('bold' if name=='창원' else 'normal'),
                    color=(C_ACCENT if name=='창원' else '#444'))

ax.set_xlabel('관측지점 위도(°N) — 남쪽 → 북쪽', fontsize=10.5)
ax.set_ylabel('평균 개화일 (1/1부터 경과일수)', fontsize=10.5)
yticks = [60, 75, 90, 105]
ylabels = []
for yt in yticks:
    d = date(2001,1,1) + timedelta(days=yt)
    ylabels.append(d.strftime('%m/%d'))
ax.set_yticks(yticks); ax.set_yticklabels(ylabels)
ax.grid(color=C_GRID, linewidth=0.8, zorder=0)
ax.set_axisbelow(True)
for spine in ['top','right']:
    ax.spines[spine].set_visible(False)
ax.set_title('전국 33개 지점 벚꽃 평균 개화일 vs 위도 (2000–2026 평균)', fontsize=12.5, fontweight='bold', pad=12, loc='left')
ax.text(0.02, 0.96, 'r = 0.780  ·  위도 1도당 약 5.5일 지연\n창원(진해)은 전국 4위로 빠른 개화 지역',
        transform=ax.transAxes, fontsize=9.5, va='top', color='#444',
        bbox=dict(boxstyle='round,pad=0.4', facecolor='#f7f5f3', edgecolor=C_GRID))
plt.tight_layout()
plt.savefig(f'{OUT}/chart5_bloomfront.png', bbox_inches='tight', facecolor='white')
plt.close()

# ---------- Chart 6: Optimal window backtest ----------
with open(f'{WEATHER_DIR}/dashboard_data.json', encoding='utf-8') as f:
    D = json.load(f)

def doy(dstr):
    y,m,d = map(int, dstr.split('-'))
    return (date(2001,m,d) - date(2001,1,1)).days

rows2 = []
for rec in D['timeline']:
    if not rec['manbal'] or not rec['fstart']:
        continue
    y,m,d = map(int, rec['manbal'].split('-'))
    manbal = date(2001,m,d)
    rec_start = manbal - timedelta(days=5)
    rec_end = manbal + timedelta(days=4)
    fy,fm,fd = map(int, rec['fstart'].split('-'))
    fey,fem,fed = map(int, rec['fend'].split('-'))
    fstart = date(2001,fm,fd)
    fend = date(2001,fem,fed)
    shift = (fstart - rec_start).days
    hit = fstart <= manbal <= fend
    rows2.append((rec['year'], fstart, fend, rec_start, rec_end, shift, hit))

fig, ax = plt.subplots(figsize=(9.0, 5.2), dpi=200)
d0 = date(2001,1,1)
for i, (y, fs, fe, rs, re_, shift, hit) in enumerate(rows2):
    row = i
    ax.barh(row, (fe-fs).days, left=(fs-d0).days, height=0.32, color='#d8d4d0', zorder=3, label='실제 축제기간' if i==0 else None)
    ax.barh(row-0.36, (re_-rs).days, left=(rs-d0).days, height=0.32, color=C_ACCENT, alpha=0.55, zorder=3, label='모델 권장기간' if i==0 else None)
    color = C_GOOD if hit else C_CRIT
    ax.annotate(f'{shift:+d}일', xy=((fs-d0).days, row), xytext=(6,0), textcoords='offset points',
                va='center', fontsize=9, color=color, fontweight='bold')

ax.set_yticks([i-0.18 for i in range(len(rows2))])
ax.set_yticklabels([str(r[0]) for r in rows2], fontsize=10)
ax.invert_yaxis()
xt = [doy(f'2001-{m:02d}-{d:02d}') for m,d in [(3,15),(3,22),(3,29),(4,5),(4,12)]]
xl = ['3/15','3/22','3/29','4/5','4/12']
ax.set_xticks(xt); ax.set_xticklabels(xl)
ax.grid(axis='x', color=C_GRID, linewidth=0.8, zorder=0)
ax.set_axisbelow(True)
for spine in ['top','right','left']:
    ax.spines[spine].set_visible(False)
ax.legend(loc='upper center', bbox_to_anchor=(0.5,-0.09), ncol=2, frameon=False, fontsize=9.5)
ax.set_title('실제 축제기간 vs 모델 권장기간 역산 비교 (숫자=시작일 차이)', fontsize=12.5, fontweight='bold', pad=12, loc='left')
plt.tight_layout()
plt.savefig(f'{OUT}/chart6_backtest.png', bbox_inches='tight', facecolor='white')
plt.close()

print("done")
