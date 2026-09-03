// XYZ 평가·보상 시스템 샘플 데이터
// 실제 운영 시 이 파일만 교체하면 됨

const ORG = {
  groups: {
    "R&D그룹": {
      teams: {
        "로봇지능화팀": ["김서연","이준호","박민지"],
        "로봇자동화팀": ["최우진","정하늘","강도현","윤서준"],
        "로봇디자인팀": ["임채원","한지우"]
      }
    },
    "로봇사업그룹": {
      teams: {
        "영업팀": ["오세훈","신유나"],
        "운영팀": ["배준영","곽민서","조은채"]
      }
    },
    "신사업그룹": {
      teams: {
        "사업개발팀": ["남기태","문서영"],
        "정부사업팀": ["구본우"]
      }
    }
  }
};

// 직무 매핑 (동일 직무자 그룹핑용)
const JOB = {
  "김서연":"연구개발","이준호":"연구개발","박민지":"연구개발",
  "최우진":"연구개발","정하늘":"연구개발","강도현":"연구개발","윤서준":"연구개발",
  "임채원":"디자인","한지우":"디자인",
  "오세훈":"영업","신유나":"영업",
  "배준영":"운영","곽민서":"운영","조은채":"운영",
  "남기태":"사업개발","문서영":"사업개발","구본우":"정부사업"
};

// 평가 문항 (인재상/공통/직무) — 콘텐츠는 이후 확장
const ITEMS = {
  "인재상": [
    {id:"cv1", name:"고객 집착", q:"고객·사용자 관점을 근거로 판단하는가"},
    {id:"cv2", name:"완결의 그릿", q:"맡은 일을 디테일까지 끝까지 완결하는가"},
    {id:"cv3", name:"속도와 실행", q:"빠르게 실행하고 현장에서 개선하는가"},
    {id:"cv4", name:"분석적 사고", q:"데이터·논리로 판단하는가"},
    {id:"cv5", name:"주도와 팀워크", q:"주도적으로 일하며 팀에 정렬하는가"}
  ],
  "공통역량": [
    {id:"cc1", name:"커뮤니케이션", q:"명확히 소통하고 적시에 공유하는가"},
    {id:"cc2", name:"문제해결", q:"본질을 파악하고 해결책을 만드는가"},
    {id:"cc3", name:"자기주도 성장", q:"피드백을 수용하고 개선하는가"}
  ],
  "직무역량": [
    {id:"jc1", name:"직무 전문성", q:"직무 수행에 필요한 전문 지식·노하우를 갖췄는가"},
    {id:"jc2", name:"성과 창출", q:"기대 성과를 꾸준히 창출하는가"},
    {id:"jc3", name:"직무 완성도", q:"결과물의 양적·질적 완성도가 높은가"}
  ]
};

// 페이밴드 (경계선 방식) — 등급 경계에 연차·연봉을 찍고, 각 등급 상/중/하에 평균연봉 표기
// 연차: D 1~2 / C 3~4 / B 5~6 / A 7~8 / S 9+
const PAYBAND = [
  {grade:"S", years:"9년차 이상", sub:{상:10500, 중:9500, 하:8800}},
  {grade:"A", years:"7~8년차",   sub:{상:8300,  중:7800, 하:7300}},
  {grade:"B", years:"5~6년차",   sub:{상:6800,  중:6200, 하:5700}},
  {grade:"C", years:"3~4년차",   sub:{상:5300,  중:4800, 하:4300}},
  {grade:"D", years:"1~2년차",   sub:{상:4000,  중:3600, 하:3200}}
];
// 등급 사이 경계 (수직선 눈금: 좌=연차, 우=연봉). 위에서 아래로.
const PB_BOUNDARIES = [
  {top:"S", bot:"A", year:"9년차", salary:8800},
  {top:"A", bot:"B", year:"7년차", salary:7300},
  {top:"B", bot:"C", year:"5년차", salary:5700},
  {top:"C", bot:"D", year:"3년차", salary:4300},
  {top:"D", bot:null, year:"1년차", salary:3200}
];
// 세부 등급(S상~D하): 각 등급을 상/중/하로
const SUBGRADES = [];
["S","A","B","C","D"].forEach(g=>["상","중","하"].forEach(s=>SUBGRADES.push(g+s)));

// 기존 연봉·직전등급·연봉이력 (샘플) — 페이밴드 범위(3,200~10,500만) 내
// salaryHistory: 입사~현재까지 [연차라벨, 연봉] (추이 그래프용)
const EMP = {};
(function(){
  // 이름별로 입사연차와 시작연봉을 다양하게 부여
  const seed=(s)=>{ let x=Math.sin(s)*10000; return x-Math.floor(x); };
  const prevGrades=["A중","B상","B중","B하","C상","C중","C하","A하"];
  Object.keys(JOB).forEach((name,i)=>{
    const years=2+Math.floor(seed(i+1)*6);          // 재직 2~7년차
    const startSal=3200+Math.floor(seed(i+7)*900);   // 입사 연봉 3,200~4,100
    // 연차별 인상 이력 생성 (매년 6~14% 인상)
    const hist=[["입사",startSal]];
    let cur=startSal;
    for(let y=1;y<years;y++){
      const raise=1+(0.06+seed(i*10+y)*0.08);
      cur=Math.round(cur*raise/10)*10;
      hist.push([y+"년차",cur]);
    }
    EMP[name]={
      prevSalary: cur,                    // 현재(직전) 연봉
      prevGrade: prevGrades[i%prevGrades.length],
      years,
      salaryHistory: hist
    };
  });
})();

// 평가 데이터 생성 (하향/동료/셀프/협업) — 각 문항 4점 척도
function seedEval(){
  const rnd=(seed)=>{ let x=Math.sin(seed)*10000; return x-Math.floor(x); };
  const allItems=[...ITEMS.인재상,...ITEMS.공통역량,...ITEMS.직무역량];
  const data={}; let s=1;
  Object.keys(JOB).forEach(target=>{
    data[target]={ down:[], peer:[], self:null, collab:[] };
    // 하향식 1명(팀장 가정)
    const dscore={}; allItems.forEach(it=>{ dscore[it.id]=1+Math.floor(rnd(s++)*4); });
    data[target].down.push({evaluator:"팀장", scores:dscore, comment:"현장 대응이 안정적이며 협업 태도가 좋음."});
    // 동료 2명
    for(let p=0;p<2;p++){ const ps={}; allItems.forEach(it=>{ ps[it.id]=1+Math.floor(rnd(s++)*4); });
      data[target].peer.push({evaluator:"동료"+(p+1), scores:ps, comment:"맡은 몫을 성실히 수행함."}); }
    // 셀프
    const ss={}; allItems.forEach(it=>{ ss[it.id]=2+Math.floor(rnd(s++)*3); });
    data[target].self={evaluator:"본인", scores:ss, comment:"이번 반기 신규 과제에 주도적으로 참여함."};
    // 협업자 1명 (일부만)
    if(rnd(s++)>0.4){ const cs={}; [...ITEMS.인재상.slice(0,2),...ITEMS.공통역량].forEach(it=>{ cs[it.id]=1+Math.floor(rnd(s++)*4); });
      data[target].collab.push({evaluator:"협업자(타팀)", scores:cs, comment:"협업 과정에서 커뮤니케이션이 명확했음."}); }
  });
  return data;
}
const EVAL = seedEval();

// 확정된 역량 포지셔닝 (보상 탭에서 확정 → 평가 탭 직무분포에서 조회)
// 실제 운영 시 이 값도 data.js에 저장하거나 서버 연동. 지금은 세션 내 공유.
const CONFIRMED_POS = {};  // { 이름: "A상" }
// 시연용 샘플 확정값 (실제로는 보상탭 인사위원회에서 확정)
Object.assign(CONFIRMED_POS, {
  "김서연":"A중","이준호":"B상","박민지":"B하",
  "최우진":"A상","정하늘":"B중","강도현":"B중","윤서준":"C상",
  "임채원":"A중","한지우":"C상",
  "오세훈":"C중","신유나":"C하",
  "배준영":"B상","곽민서":"C상","조은채":"C중",
  "남기태":"B중","문서영":"C상","구본우":"B하"
});
function jobAverage(jobName, itemId){
  const peers=Object.keys(JOB).filter(n=>JOB[n]===jobName);
  let sum=0,cnt=0;
  peers.forEach(n=>{
    const e=EVAL[n]; if(!e) return;
    [...e.down,...e.peer,(e.self?[e.self]:[]),...e.collab].flat().forEach(ev=>{
      if(ev.scores[itemId]!=null){ sum+=ev.scores[itemId]; cnt++; }
    });
  });
  return cnt? (sum/cnt):0;
}

// 종합점수 (전체 평가자 평균, 협업은 가중치 0.5)
function totalScore(name){
  const e=EVAL[name]; if(!e) return 0;
  let sum=0,w=0;
  e.down.forEach(ev=>{ const a=avg(ev.scores); sum+=a*1.0; w+=1.0; });
  e.peer.forEach(ev=>{ const a=avg(ev.scores); sum+=a*1.0; w+=1.0; });
  if(e.self){ sum+=avg(e.self.scores)*0.5; w+=0.5; }
  e.collab.forEach(ev=>{ const a=avg(ev.scores); sum+=a*0.5; w+=0.5; });
  return w? (sum/w):0;
}
function avg(scores){ const v=Object.values(scores); return v.length? v.reduce((a,b)=>a+b,0)/v.length:0; }
