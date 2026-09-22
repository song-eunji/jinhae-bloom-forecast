# -*- coding: utf-8 -*-
import json
from datetime import date

with open('전국_병합_벚나무.json', encoding='utf-8') as f:
    DATA = json.load(f)

# approximate station latitude (deg N), for bloom-front (south->north) analysis
LAT = {
    '제주': 33.51, '서귀포': 33.25, '여수': 34.74, '목포': 34.82, '거제': 34.89,
    '통영': 34.85, '남해': 34.85, '부산': 35.10, '진주': 35.16, '창원': 35.23,
    '밀양': 35.49, '광주': 35.17, '전주': 35.82, '대구': 35.87, '합천': 35.57,
    '거창': 35.68, '산청': 35.41, '대전': 36.37, '청주': 36.64, '서울': 37.57,
    '수원': 37.29, '동두천': 37.90, '원주': 37.34, '춘천': 37.90, '홍천': 37.70,
    '강릉': 37.75, '인제': 38.07, '철원': 38.15, '태백': 37.16, '영월': 37.18,
    '속초': 38.25, '동해': 37.51, '북강릉': 37.80, '북춘천': 37.94,
}

def doy(dstr):
    y, m, d = map(int, dstr.split('-'))
    return (date(2001, m, d) - date(2001, 1, 1)).days

# mean 개화 day-of-year per station (index 1 in each row = 개화일)
station_mean = {}
for stn, rows in DATA.items():
    vals = []
    for r in rows:
        if len(r) > 1 and r[1]:
            vals.append(doy(r[1]))
    if vals:
        station_mean[stn] = sum(vals) / len(vals)

with open('national_bloomfront.txt', 'w', encoding='utf-8') as out:
    out.write(f"{'지점':8}{'위도':>8}{'평균개화일(DOY)':>16}{'평균개화일':>14}\n")
    rows = []
    for stn, mean_doy in station_mean.items():
        if stn in LAT:
            rows.append((stn, LAT[stn], mean_doy))
    rows.sort(key=lambda x: x[1])
    for stn, lat, md in rows:
        d0 = date(2001,1,1)
        from datetime import timedelta
        actual_date = d0 + timedelta(days=round(md))
        out.write(f"{stn:8}{lat:>8.2f}{md:>16.1f}{actual_date.strftime('%m/%d'):>14}\n")

    # correlation lat vs bloom day
    xs = [r[1] for r in rows]; ys = [r[2] for r in rows]
    n = len(xs)
    mx, my = sum(xs)/n, sum(ys)/n
    cov = sum((a-mx)*(b-my) for a,b in zip(xs,ys))/n
    sx = (sum((a-mx)**2 for a in xs)/n)**0.5
    sy = (sum((b-my)**2 for b in ys)/n)**0.5
    r = cov/(sx*sy)
    slope = cov / (sx**2)
    out.write(f"\n위도-개화일 상관계수 r = {r:.3f}\n")
    out.write(f"위도 1도당 개화 지연: 약 {slope:.1f}일\n")
    # rank of 창원
    ranked = sorted(rows, key=lambda x: x[2])
    for i, (stn, lat, md) in enumerate(ranked):
        if stn == '창원':
            out.write(f"\n창원의 전국 개화순위: {i+1}위 / {len(ranked)}개 지점 (빠른 순)\n")

json.dump(rows, open('bloomfront_data.json','w',encoding='utf-8'), ensure_ascii=False)
print("done")
