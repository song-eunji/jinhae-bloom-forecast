const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, AlignmentType, ImageRun, PageBreak, VerticalAlign,
  LevelFormat, convertInchesToTwip
} = require("docx");

const CHART_DIR = "차트";
const SHOT_DIR = "스크린샷";

function img(file, widthPx, heightPx) {
  return new ImageRun({
    type: "png",
    data: fs.readFileSync(`${CHART_DIR}/${file}`),
    transformation: { width: widthPx, height: heightPx },
  });
}

function shot(file, widthPx, heightPx) {
  return new ImageRun({
    type: "png",
    data: fs.readFileSync(`${SHOT_DIR}/${file}`),
    transformation: { width: widthPx, height: heightPx },
  });
}

function h(text, level) {
  return new Paragraph({ text, heading: level, spacing: { before: 320, after: 140 } });
}

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 21, ...opts })],
    spacing: { after: 160, line: 300 },
  });
}

function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 21 })],
    numbering: { reference: "main-bullets", level: 0 },
    spacing: { after: 90, line: 290 },
  });
}

function caption(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 18, color: "666666", italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
  });
}

function centerImg(file, w, h) {
  return new Paragraph({
    children: [img(file, w, h)],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 },
  });
}

function centerShot(file, w, h) {
  return new Paragraph({
    children: [shot(file, w, h)],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 },
  });
}

const cellShade = (hex) => ({ fill: hex, type: ShadingType.CLEAR });

function mkTable(headers, rows, colWidths) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((htext, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: cellShade("2A3B4C"),
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: [new Paragraph({
        children: [new TextRun({ text: htext, bold: true, size: 19, color: "FFFFFF" })],
      })],
    })),
  });
  const bodyRows = rows.map((r, ri) => new TableRow({
    children: r.map((c, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: cellShade(ri % 2 === 0 ? "F7F5F3" : "FFFFFF"),
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 70, bottom: 70, left: 100, right: 100 },
      children: [new Paragraph({ children: [new TextRun({ text: String(c), size: 19 })] })],
    })),
  }));
  return new Table({
    width: { size: colWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...bodyRows],
  });
}

// 붙임2(분석보고서 서식) 공식 양식처럼, 대항목마다 테두리 박스로 감싼다.
const CONTENT_WIDTH = 9638; // 11906(A4) - 1134*2(margin)
function box(children, borderColor = "7A3654") {
  const border = { style: BorderStyle.SINGLE, size: 6, color: borderColor };
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            margins: { top: 220, bottom: 220, left: 220, right: 220 },
            borders: { top: border, bottom: border, left: border, right: border },
            children,
          }),
        ],
      }),
    ],
  });
}
function spacer() {
  return new Paragraph({ spacing: { after: 320 } });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "main-bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: convertInchesToTwip(0.28), hanging: convertInchesToTwip(0.18) },
              },
            },
          },
        ],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: "맑은 고딕", size: 21 } },
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal",
        run: { size: 30, bold: true, color: "1A1A1A" },
        paragraph: { spacing: { before: 400, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "B8577C" } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal",
        run: { size: 25, bold: true, color: "7A3654" },
        paragraph: { spacing: { before: 320, after: 140 } } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal",
        run: { size: 22, bold: true, color: "1A1A1A" },
        paragraph: { spacing: { before: 220, after: 100 } } },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    children: [
      // 표지
      new Paragraph({ spacing: { before: 600, after: 200 }, children: [new TextRun({ text: "2026년 창원시 AI·데이터 활용 공모전", size: 20, color: "888888" })] }),
      new Paragraph({
        spacing: { after: 300 },
        children: [new TextRun({ text: "분석보고서", size: 22, bold: true, color: "B8577C" })],
      }),
      new Paragraph({
        spacing: { after: 500 },
        children: [new TextRun({
          text: "적산온도 기반 진해 벚꽃 개화·만발 예측과\n축제 일정 미스매치 정량화",
          size: 36, bold: true,
        })],
      }),

      // Ⅰ. 제안과제명 — 공식 서식과 동일하게 박스 처리
      box([
        p("Ⅰ. 제안과제명 :", { bold: true, size: 23, color: "7A3654" }),
        p("적산온도(Degree-Day) 모델을 활용한 진해 벚꽃 개화·만발일 예측 및 진해군항제 개최시기 미스매치 정량화 분석"),
      ]),
      spacer(),

      new Paragraph({ children: [new PageBreak()] }),

      h("Ⅱ. 세부 내용", HeadingLevel.HEADING_1),

      // ◦ 분석 개요
      box([
        h("◦ 분석 개요", HeadingLevel.HEADING_2),
        h("가. 분석 목적", HeadingLevel.HEADING_3),
        p("진해군항제는 연간 250만~412만 명이 방문하는 전국 최대 규모의 봄 축제이나, 개최일이 사전에 고정 공지되는 반면 벚꽃 개화시기는 그해 기온에 따라 해마다 변동한다. 본 분석은 다음 네 가지를 목적으로 한다."),
        bullet("기상 데이터 기반의 벚꽃 개화·만발(만개)일 예측 모델을 구축하고 정확도를 검증한다."),
        bullet("2011~2026년 진해군항제 개최기간과 실제 개화·만발일을 대조하여 '미스매치(조기만개)' 발생률을 정량화한다."),
        bullet("전국 33개 지점과 비교해 창원(진해)이 전국적 맥락에서 얼마나 이른 개화 지역인지 공간적으로 분석한다."),
        bullet("예측 모델을 실제 축제 일정 결정에 적용했을 경우의 결과를 역산 시뮬레이션하고, 예측의 불확실성 범위까지 제시하여 실제 축제 운영에 활용 가능한 구체적 방안을 제시한다."),

        h("나. 배경 및 필요성", HeadingLevel.HEADING_3),
        p("진해군항제는 2011~2019년 매년 4월 1일~10일로 고정 개최되었다. 그러나 이 기간 중 다수 연도(2013, 2018, 2019년)에 벚꽃이 축제 시작 전 이미 만개를 지나쳐, 방문객이 절정기를 놓치는 문제가 반복적으로 제기되었다. 이에 창원시는 2023년부터 개최일을 3월 말로 앞당기는 조정을 시행했다."),
        p("그러나 이러한 조정은 매년의 경험과 단기 예보에 의존해 왔으며, 장기적·정량적 예측 체계는 부재했다. 특히 기후변화로 국내 벚꽃 개화시기가 전반적으로 빨라지는 추세 속에서(본 분석 3장에서 확인, 이승호·이경미(2003)[2]도 동일한 추세를 보고함), 데이터에 기반해 매년 반복 가능한 예측 프로세스를 마련하는 것이 시급하다."),
        p("실제로 일본에서는 Nagai 등(2019)[6]이 두 도시를 대상으로 벚꽃 개화시기와 축제 개최기간의 일치도를 과거·현재·미래 기후 조건에서 평가한 바 있어, '개화-축제 미스매치'는 국내외적으로 이미 학술적으로 다뤄지고 있는 문제다. 본 분석은 이 문제의식을 진해군항제라는 국내 최대 사례에 적용하고, 나아가 실제 정책 결정에 바로 쓸 수 있는 역산 시뮬레이션까지 확장했다는 점에서 차별점을 갖는다."),
      ]),
      spacer(),

      // ◦ 분석 결과 상세 내용
      box([
        h("◦ 분석 결과 상세 내용", HeadingLevel.HEADING_2),
        h("가. 분석데이터", HeadingLevel.HEADING_3),
        mkTable(
          ["데이터명", "출처", "기간", "내용"],
          [
            ["ASOS 일자료", "기상청 기상자료개방포털\n(Open API)", "2000~2026", "창원(155지점) 일평균·최고·최저기온"],
            ["계절관측 자료", "기상청 기상자료개방포털", "2000~2026", "전국 33개 지점(경남 인접 8개 지점 포함) 벚나무 발아·개화·만발일, 평년대비 편차(평비)"],
            ["진해군항제 방문객현황", "창원시 데이터포털", "2013~2019", "축제명, 개최기간, 방문객수"],
            ["진해군항제 개최기간", "언론보도 종합", "2011~2026", "연도별 정확한 개최 시작·종료일"],
          ],
          [2400, 3000, 1800, 2600]
        ),
        p(""),
        p("특히 계절관측 자료는 기상청이 매년 표준목(관측 기준이 되는 나무)을 대상으로 직접 관측·발표하는 1차 공식 자료로, 1991~2020년 평년값 대비 편차(평비)까지 함께 제공되어 신뢰도가 높다."),

        h("나. 분석툴", HeadingLevel.HEADING_3),
        bullet("Python: 기상청 Open API 호출, 데이터 수집·정제, 통계분석(적산온도 계산, 교차검증, 상관분석)"),
        bullet("matplotlib: 결과 시각화"),

        h("다. 알고리즘 및 방법론", HeadingLevel.HEADING_3),
        p("[적산온도(Degree-Day Sum) 모델] 매년 특정 기준일부터 일평균기온이 기저온도를 초과하는 값을 누적하여, 누적값이 임계값에 도달하는 날짜를 개화(또는 만발) 예측일로 산정하는 생물계절학의 표준 기법이다. 이 방식은 교토 벚꽃의 1,200년 개화 기록을 기온으로 역산한 Aono & Kazui(2008)[3] 등 국제 학계에서도 검증된 접근이다. 기준일·기저온도·임계값은 leave-one-out 교차검증(연도별로 하나씩 제외하며 검증)을 통해 예측오차(MAE)가 최소가 되도록 그리드서치로 최적화했다."),
        bullet("개화 예측 모델: 2월 10일부터 누적 시작, 기저온도 0℃, 표본 n=27(2000~2026)"),
        bullet("만발(만개) 예측 모델: 2월 15일부터 누적 시작, 기저온도 1℃, 표본 n=15(2011~2026, 2015년 결측 제외)"),
        p("[강건성 검증] 창원의 연도별 개화편차(평년 대비 빠름/느림)가 우연한 관측 오차가 아니라 실제 지역 기후 신호인지 확인하기 위해, 인접 8개 관측지점(거제·거창·남해·밀양·산청·진주·통영·합천)의 개화편차와 연도별 상관계수를 계산했다."),
        p("[전국 공간분석] 전국 33개 계절관측 지점의 평균 개화일과 관측지점 위도 간 회귀분석을 실시하여, 창원이 전국적으로 어느 정도로 이른 개화 지역인지 정량적으로 위치시켰다. 국내 벚꽃 개화의 공간적 예측은 진향곤 등(2017)[1]이 기상변수에 공간구조를 결합한 회귀모형으로 개화시기 변동의 약 88%를 설명한 선행연구가 있다."),
        p("[역산 시뮬레이션] 만발 예측일을 기준으로 '모델 권장 축제기간(예측 만발일 -5일 ~ +4일)'을 연도별로 산출하고, 실제 선택된 축제기간과 시작일 차이·기간 중첩일수를 비교해 실제 정책 결정이 모델 대비 얼마나 최적에 가까웠는지 역산했다."),
        p("[예측 불확실성] leave-one-out 교차검증에서 산출된 연도별 잔차(예측치-실제치)의 경험적 분포로부터 10~90백분위수를 구해, 점 예측이 아닌 80% 예측구간을 함께 제시했다."),

        h("라. 결과 시각화", HeadingLevel.HEADING_3),
        centerImg("chart1_timeline.png", 470, 330),
        caption("[그림 1] 진해군항제 개최기간과 실제 개화·만발일 비교 (2011~2026)"),

        centerImg("chart2_trend.png", 470, 184),
        caption("[그림 2] 개화일 평년(1991~2020) 대비 편차 추이 (2000~2026)"),

        centerImg("chart3_scatter.png", 340, 340),
        caption("[그림 3] 예측일 vs 실제일 산점도 (leave-one-out 교차검증)"),

        centerImg("chart4_regional.png", 440, 220),
        caption("[그림 4] 창원 개화편차 vs 인접 8개 지점 상관계수"),
      ]),
      spacer(),

      new Paragraph({ children: [new PageBreak()] }),

      // ◦ 결과 해석 및 시사점
      box([
        h("◦ 결과 해석 및 시사점", HeadingLevel.HEADING_2),

        h("가. 예측 모델 성능", HeadingLevel.HEADING_3),
        mkTable(
          ["모델", "표본수", "예측오차(MAE)", "오차 3일 이내 비율"],
          [
            ["개화 예측", "n=27", "1.59일", "81% (22/27)"],
            ["만발(만개) 예측", "n=15", "2.20일", "80% (12/15)"],
          ],
          [3200, 2000, 2800, 2800]
        ),
        p(""),
        p("두 모델 모두 leave-one-out 교차검증 기준으로, 학습에 사용하지 않은 연도에 대한 실제 예측 성능이다. 오차 1.6~2.2일 수준은 생물계절 예측 연구 기준으로도 실전에 투입 가능한 정확도다."),

        h("나. 지역 기후 신호 검증", HeadingLevel.HEADING_3),
        p("창원의 개화편차와 인접 8개 지점 간 상관계수는 평균 0.885(최소 0.810, 최대 0.960)로 매우 높게 나타났다. 이는 창원의 개화시기 이상(異常)이 관측소 고유의 노이즈가 아니라 경남 전역이 함께 움직이는 실제 지역 기후 신호임을 의미하며, 모델의 신뢰도를 뒷받침한다."),

        h("다. 축제 일정 미스매치 정량화", HeadingLevel.HEADING_3),
        mkTable(
          ["구분", "기간", "조기만개(축제 전 만개) 발생률"],
          [
            ["고정기간", "2011~2019년 (매년 4/1~4/10)", "38% (8개년 중 3개년: 2013·2018·2019)"],
            ["조정기간", "2023~2026년 (개최일 매년 조정)", "0% (4개년 전부 적중)"],
          ],
          [2000, 4400, 4400]
        ),
        p(""),
        p("창원시가 2023년부터 시행한 개최일 조정은 실제로 뚜렷한 효과가 있었다. 다만 이 조정은 매년의 정성적 판단에 의존해 왔으며, 본 분석의 예측 모델(오차 1.6~2.2일)을 활용하면 이 판단 과정을 정량적이고 반복 가능한 절차로 전환할 수 있다."),

        h("라. 전국 개화전선 분석 — 창원의 전국적 위치", HeadingLevel.HEADING_3),
        p("창원만 따로 놓고 보면 이 도시의 개화시기가 이르다는 사실이 갖는 의미를 판단하기 어렵다. 이에 전국 33개 계절관측 지점(강원~제주)의 2000~2026년 평균 개화일을 관측지점 위도와 함께 분석했다. 위도와 평균 개화일 간 상관계수는 r=0.780으로 뚜렷한 남고북저(南早北遲)의 개화전선이 확인되며, 위도 1도당 평균 약 5.5일씩 개화가 늦어지는 것으로 나타났다. 국내 벚꽃 개화의 지리적 이동 자체는 Chung 등(2009)[5]과 Hur 등(2014)[4]이 각각 도시화 보정 기온자료와 IPCC AR5 하강규모모델로 이미 규명한 바 있으며, 본 분석 결과는 이러한 선행연구의 남고북저 패턴과 방향이 일치한다."),
        p("이 전국 분포에서 창원은 평균 개화일 기준 전국 33개 지점 중 4위로, 국내에서 손꼽히게 이른 개화 지역에 속한다. 전국 평균 수준의 감각으로 축제 일정을 잡으면 구조적으로 늦어질 수밖에 없는 지역이라는 뜻이며, 이는 2011~2019년 고정기간 동안 조기만개가 반복됐던 현상을 뒷받침하는 배경 설명이 된다."),

        centerImg("chart5_bloomfront.png", 440, 288),
        caption("[그림 5] 전국 33개 지점 평균 개화일 vs 위도 — 창원은 4위로 이른 개화 지역"),

        h("마. 최적 축제기간 역산 시뮬레이션", HeadingLevel.HEADING_3),
        p("모델의 만발 예측일을 기준으로 '모델 권장 축제기간'(예측 만발일 -5일~+4일, 실제 축제와 동일한 약 10일 길이)을 연도별로 역산하고, 실제 선택된 축제기간과 비교했다."),
        mkTable(
          ["연도", "실제 축제기간", "모델 권장기간", "시작일 차이", "판정"],
          [
            ["2013", "4/1~4/10", "3/24~4/2", "+8일", "미스매치"],
            ["2018", "4/1~4/10", "3/26~4/4", "+6일", "미스매치"],
            ["2019", "4/1~4/10", "3/22~3/31", "+10일", "미스매치"],
            ["2023~2026(평균)", "-", "-", "+2일", "적중(4개년 전부)"],
          ],
          [2600, 2600, 2600, 2000, 2000]
        ),
        p(""),
        p("2019년의 경우 모델 기준으로는 실제보다 축제를 10일 앞당겼어야 이상적이었으며, 실제 축제기간과 모델 권장기간이 단 하루도 겹치지 않았다(0일 중첩). 반면 2023년 이후에는 시작일 차이가 +1~+3일 수준으로 좁혀져, 정성적 판단만으로도 상당히 근접한 결정을 내려왔음을 확인할 수 있다. 다만 이 근접도를 매년 안정적으로 재현하려면 정량 모델의 보조가 필요하다."),

        centerImg("chart6_backtest.png", 460, 266),
        caption("[그림 6] 실제 축제기간 vs 모델 권장기간 역산 비교 (숫자=시작일 차이)"),

        h("바. 예측 불확실성(신뢰구간)", HeadingLevel.HEADING_3),
        p("leave-one-out 교차검증의 연도별 잔차 분포를 이용해 점 예측이 아닌 80% 예측구간을 함께 제시할 수 있다. 개화 모델의 80% 예측구간은 [-1.4일, +4.0일], 만발 모델은 [-3.0일, +3.6일]이다."),
        p("예를 들어 2026년의 경우 모델은 개화일을 3월 22일(80% 구간 3/21~3/26), 만발일을 3월 27일(80% 구간 3/24~3/31)로 예측했다. 실제 관측된 개화일은 3월 24일, 만발일은 3월 30일로 두 값 모두 80% 예측구간 안에 포함되었다. 이처럼 범위로 제시하면 단일 날짜보다 실제 의사결정(축제 홍보 시작 시점, 예비 프로그램 준비 등)에 활용하기 안전하다."),

        h("사. 분석의 한계", HeadingLevel.HEADING_3),
        p("미스매치와 방문객 수의 상관관계를 검증하고자 했으나, 방문객 데이터가 2013~2019년 6개년으로 표본이 부족하고 이 기간 방문객 수 자체가 지속적으로 증가하는 추세(홍보 강화 등 외부요인)와 뒤섞여 있어, 통계적으로 유의한 관계를 확인하지 못했다(상관계수 r=+0.90이 산출되었으나 표본 부족으로 인과관계 해석은 불가능). 이는 향후 검색량 트렌드 등 대체 지표로 보완이 필요한 부분으로 남겨둔다."),
        p("또한 개화 이후 관상 가능 기간(낙화 시점)은 강수·바람 등 단기 기상 요인에 크게 좌우되어 장기예측이 원천적으로 불가능하다. 이 부분은 4장의 활용방안에서 별도로 다룬다."),
        p("역산 시뮬레이션의 '모델 권장기간(-5일~+4일)'은 실제 축제와 동일한 약 10일 길이를 유지하기 위한 단순화된 가정이며, 관람객 동선·행사 준비기간 등 운영상의 제약은 반영하지 않았다."),
      ]),
      spacer(),

      new Paragraph({ children: [new PageBreak()] }),

      // ◦ 활용방안 및 기대효과
      box([
        h("◦ 활용방안 및 기대효과", HeadingLevel.HEADING_2),
        h("가. 축제 일정 기획 지원", HeadingLevel.HEADING_3),
        p("매년 1~2월 시점에 그해 1~2월 기온 추이를 입력해 잠정 개화·만발 예측일을 산출, 축제 개최일을 정량적 근거로 조정할 수 있다. 기존의 경험적 판단을 대체하는 것이 아니라, 담당자의 의사결정을 뒷받침하는 정량 지표로 활용한다."),

        h("나. 실시간 방문 안내 서비스로 확장", HeadingLevel.HEADING_3),
        p("개화 이후 관상 가능 기간은 강수·바람 등 단기 기상에 좌우되어 장기예측이 불가능하다. 대신 이원화된 접근이 현실적이다."),
        bullet("장기(나우캐스팅): 시즌이 진행되며 누적되는 실제 기온 데이터로 개화·만발 예측일을 지속 갱신한다."),
        bullet("단기(실시간 연동): 만발이 임박한 시점부터 기상청 단기·중기예보 API를 연동해 \"이번 주 강수 예보 있음, 지금 방문을 권장\" 형태의 실시간 안내를 제공한다."),

        h("다. AI·데이터 활용 데모: 인터랙티브 예측 시뮬레이터", HeadingLevel.HEADING_3),
        p("본 분석에 사용한 적산온도 모델과 leave-one-out 검증 로직을 웹 브라우저에서 직접 실행되는 인터랙티브 페이지로 구현했다. 2000~2026년 중 원하는 연도와 예측 대상(개화/만발)을 선택하면, 그 해를 제외한 나머지 연도로 학습한 임계값을 실시간으로 계산하고, 일별 적산기온 누적 곡선과 함께 예측일·실제 관측일·오차를 즉시 시각화한다. 전국 33개 지점의 개화전선을 지도 형태로 보여주는 시각화도 포함했다. 이는 보고서에 담긴 정적 수치가 아니라, 본 분석의 핵심 로직이 실제로 작동하는 과정 자체를 확인할 수 있도록 만든 것이다."),

        centerShot("demo_shot1_hero.png", 480, 353),
        caption("[그림 7] 데모 화면 ① — 연도·예측대상 선택 시 실시간으로 계산되는 적산기온 누적곡선과 leave-one-out 검증 결과"),

        p("같은 페이지에 일별 기온을 직접 입력하면 예측하는 기능도 함께 제공한다. 축제 담당자가 날짜별 실측 평균기온을 직접 입력하거나 CSV 파일로 일괄 업로드하면, 입력된 날짜는 실측값을, 입력되지 않은 날짜(시작일과 마지막 입력일 사이의 공백 및 그 이후 구간)는 2000~2026년 같은 날짜의 평년 기온으로 채워 적산온도를 끝까지 계산하고 예상 개화·만발일을 산출한다. 이때 예상일과 함께, 만발 예측일을 기준으로 한 '예상 축제 추천기간(만발일 -5일~+4일)'도 3장 마절의 역산 시뮬레이션과 동일한 방식으로 함께 제시해, 담당자가 곧바로 축제 일정 검토에 참고할 수 있도록 했다. 과거 연도의 실측 일별 기온을 그대로 입력값으로 대입해 역으로 검증한 결과, 입력 구간이 3월 초까지 늘어나면 예측오차가 대부분 0~2일 수준으로 좁혀졌다."),

        centerShot("demo_shot2_forecast.png", 480, 336),
        caption("[그림 8] 데모 화면 ② — 일별 기온 입력/CSV 업로드 시 산출되는 예상일·예상 축제 추천기간·누적 진행률"),

        p("전국 33개 관측지점의 평균 개화일을 실제 시도 경계 위에 표시해, 창원(진해)이 전국적으로 얼마나 이른 개화 지역인지 한눈에 비교할 수 있는 지도 시각화도 포함했다(3장 라절과 동일한 분석 결과)."),

        centerShot("demo_shot3_map.png", 480, 298),
        caption("[그림 9] 데모 화면 ③ — 전국 33개 관측지점 개화전선과 창원의 위치(전국 4위)"),

        p("데모 주소: https://song-eunji.github.io/jinhae-bloom-forecast/", { bold: true, color: "7A3654" }),

        h("라. 광역 관광벨트로의 확장", HeadingLevel.HEADING_3),
        p("인접 8개 지점과의 높은 상관관계(r=0.885)는 경남 전역의 벚꽃 개화가 유사한 패턴으로 움직임을 보여준다. 이를 활용해 진해-거제-통영 등 인근 지자체와 개화시기 정보를 공유하는 광역 벚꽃 관광벨트 시기 조율에도 응용할 수 있다."),
        p("나아가 창원이 전국 4위의 이른 개화 지역이라는 점(3장 라절)은, 진해군항제가 남부 벚꽃 시즌의 '개막전' 역할을 할 수 있음을 시사한다. 동일한 예측 방법론을 전국 계절관측 지점에 적용하면 창원을 시작으로 북상하는 전국 벚꽃 축제 일정을 순차적으로 예측·공유하는 모델로도 확장 가능하다."),

        h("마. 수익모델 및 지속가능성", HeadingLevel.HEADING_3),
        p("본 예측체계는 창원시 내부 행정도구에 그치지 않고, 아래와 같은 방식으로 수익을 창출하거나 예산 부담 없이 지속 운영될 수 있는 구조로 설계할 수 있다."),
        mkTable(
          ["모델", "내용", "수익/절감 주체"],
          [
            ["B2G 모델 라이선싱", "동일 방법론(적산온도 모델+역산 시뮬레이션 로직)을 여의도 봄꽃축제, 경주벚꽃축제 등 벚꽃 축제를 운영하는 타 지자체에 유상 이전·자문", "창원시(지적재산 수익)"],
            ["관광 플랫폼 제휴", "네이버지도·카카오맵 등에 '진해 벚꽃 실시간 예보' 위젯을 제공하고, 인근 상점·숙박 쿠폰 연계 수수료를 지역 상권과 배분", "창원시+지역 소상공인"],
            ["프리미엄 알림/컨설팅", "일반 시민에게는 무료 개화알림을 제공하되, 여행사·단체관광 대상 맞춤 방문일 컨설팅(신뢰구간 기반 최적 방문일 추천)은 유료 API로 제공", "관광 스타트업/여행사 제휴"],
            ["예산 절감 효과", "혼잡도 예측 기반 인력·안전요원 배치 최적화, 조기만개로 인한 취소·재홍보 비용 예방", "창원시(직접 예산 절감)"],
          ],
          [2400, 5000, 2400]
        ),
        p(""),
        p("특히 B2G 라이선싱 모델은 초기 투자 비용이 이미 본 분석으로 회수된 상태에서, 방법론만 이전하면 되므로 추가 데이터 수집·모델 재구축 비용이 거의 들지 않는다는 점에서 현실성이 높다. 전국 33개 지점 데이터가 이미 공개되어 있어(3장 라절), 타 지역 적용 시에도 별도의 관측 인프라 구축 없이 기존 기상청 계절관측 자료만으로 확장할 수 있다."),

        h("바. 기대효과", HeadingLevel.HEADING_3),
        bullet("조기만개로 인한 관광 손실 및 방문객 실망 방지"),
        bullet("정확한 사전 정보 제공을 통한 방문 시기 분산 및 혼잡도 완화"),
        bullet("경험·감에 의존하던 축제 행정을 데이터 기반 의사결정 체계로 전환"),
        bullet("동일 방법론을 마산가고파국화축제 등 창원시 내 다른 계절 축제로 확장 적용 가능"),
        bullet("B2G 라이선싱·플랫폼 제휴를 통한 신규 수익원 창출 및 지역 소상공인과의 상생 구조 마련"),
      ]),
      spacer(),

      new Paragraph({ children: [new PageBreak()] }),

      // ◦ 활용데이터 및 참고 문헌 출처 등
      box([
        h("◦ 활용데이터 및 참고 문헌 출처 등", HeadingLevel.HEADING_2),
        h("가. 활용 데이터", HeadingLevel.HEADING_3),
        bullet("기상청 기상자료개방포털(data.kma.go.kr) — 지상(종관) ASOS 일자료 Open API"),
        bullet("기상청 기상자료개방포털(data.kma.go.kr) — 계절관측 자료(식물: 벚나무), 전국 33개 지점"),
        bullet("창원시 데이터포털(bigdata.changwon.go.kr) — 경상남도 창원시_창원시 축제 방문객현황"),
        bullet("경남신문, \"[궁금타] 군항제에 벚꽃 만개할까?\", 2018.3.21."),
        bullet("SBS뉴스 외 언론보도(2023~2026년 진해군항제 개최기간 확인)"),

        h("나. 참고문헌", HeadingLevel.HEADING_3),
        bullet("[1] 진향곤·김상완·김용구 (2017), \"국내 벚꽃 개화 및 단풍 시기에 대한 공간예측\", 응용통계연구, 30(3), 417-426."),
        bullet("[2] 이승호·이경미 (2003), \"기온 변화에 따른 벚꽃 개화시기의 변화 경향\", 환경영향평가, 12(1), 45-54."),
        bullet("[3] Aono, Y., & Kazui, K. (2008). Phenological data series of cherry tree flowering in Kyoto, Japan, and its application to reconstruction of springtime temperatures since the 9th century. International Journal of Climatology, 28(7), 905-914. DOI: 10.1002/joc.1594"),
        bullet("[4] Hur, J., Ahn, J.-B., & Shim, K.-M. (2014). The change of cherry first-flowering date over South Korea projected from downscaled IPCC AR5 simulation. International Journal of Climatology, 34(8), 2308-2319. DOI: 10.1002/joc.3839"),
        bullet("[5] Chung, U., Jung, J.E., Seo, H.C., & Yun, J.I. (2009). Using urban effect corrected temperature data and a tree phenology model to project geographical shift of cherry flowering date in South Korea. Climatic Change, 93, 447-463."),
        bullet("[6] Nagai, S., Saitoh, T.M., & Yoshitake, S. (2019). Cultural ecosystem services provided by flowering of cherry trees under climate change: a case study of the relationship between the periods of flowering and festivals. International Journal of Biometeorology, 63(4), 485-495. DOI: 10.1007/s00484-019-01719-9"),
      ]),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("진해벚꽃_개화예측_분석보고서_v7.docx", buf);
  console.log("written");
});
