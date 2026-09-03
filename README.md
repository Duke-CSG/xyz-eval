# XYZ HR Portal

XYZ 인사 통합 포털. GitHub Pages 정적 호스팅.

## 구성
- `index.html` — 메인 (3개 탭)
- `hr.css` — 스타일
- `hr.js` — MVC 렌더링 + 채용 대시보드 로직
- `data.js` — 채용 데이터 + 조직도 데이터 (이 파일만 교체하면 갱신)

## 3개 탭
1. **홈 · MVC** — 전사 Mission·Vision·Core Value 5개 + 조직별 미션
2. **평가 · 보상** — duke-csg.github.io/xyz-eval 를 iframe으로 임베드
3. **채용 현황** — 채용 대시보드 (KPI · 진단 매트릭스 · 지원자 추이 · 전형 퍼널 · 채용 목록)

## 배포 방법 (별도 저장소 권장)
평가·보상(xyz-eval)과 다른 새 저장소를 만드세요. 예: `xyz-hr`

1. GitHub에서 새 저장소 `xyz-hr` 생성 (Public)
2. `hr-portal/` 폴더 안의 파일 4개를 저장소 루트에 업로드
   (index.html, hr.css, hr.js, data.js)
3. Settings → Pages → Branch: main / root → Save
4. `https://duke-csg.github.io/xyz-hr/` 로 접속

## 평가·보상 임베드
- 홈포털의 "평가·보상" 탭은 `https://duke-csg.github.io/xyz-eval/`를 iframe으로 불러옵니다.
- GitHub Pages는 iframe 임베드를 허용하므로 정상 작동합니다.
- xyz-eval 주소가 바뀌면 index.html의 iframe src와 링크를 수정하세요.

## 채용 데이터 갱신
`data.js`의 `RECRUIT` 객체를 최신 엑셀에서 추출한 값으로 교체.
구조: reqs(채용요청), funnel(전형), quad(사분면), trend(지원자추이)

## 주의 (인사 데이터)
채용 데이터에 실제 지원자 개인정보는 없지만, 채용 계획(직무·소요일 등)이 
포함됩니다. 민감하면 Private 저장소 + 유료 플랜 또는 사내 호스팅을 고려하세요.
