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

// 페이밴드 (직무 무관 공통 예시 — 실제론 직무별로 둠)
const PAYBAND = [
  {grade:"S", label:"S (최상위)", yearsAvg:9, salaryAvg:9500},
  {grade:"A", label:"A (상위)",   yearsAvg:7, salaryAvg:7800},
  {grade:"B", label:"B (중위)",   yearsAvg:5, salaryAvg:6200},
  {grade:"C", label:"C (하위)",   yearsAvg:3, salaryAvg:4800},
  {grade:"D", label:"D (최하위)", yearsAvg:1, salaryAvg:3600}
];
// 세부 등급(S상~D하): 각 등급을 상/중/하로
const SUBGRADES = [];
["S","A","B","C","D"].forEach(g=>["상","중","하"].forEach(s=>SUBGRADES.push(g+s)));

// 기존 연봉·직전등급 (샘플)
const EMP = {}; 
Object.keys(JOB).forEach((name,i)=>{
  const base=3600+((i*370)%5800);
  EMP[name]={ prevSalary: base, prevGrade: ["A중","B상","B중","B하","C상","C중"][i%6] };
});

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

// 동일 직무자 평균 (문항별)
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
