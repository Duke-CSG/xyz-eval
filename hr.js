const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];

// 탭 전환
$$('.navtab').forEach(b=>b.onclick=()=>{
  $$('.navtab').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  $$('.tab-panel').forEach(p=>p.classList.remove('active'));
  $('#tab-'+b.dataset.tab).classList.add('active');
});

// ===== MVC 홈 =====
const CORE_VALUES=[
  ['01','고객 집착','User Centered Design','모든 의사결정의 중심에 고객을 둔다'],
  ['02','완결의 그릿','Grit','될 때까지 몰입하고 끝까지 책임진다'],
  ['03','속도와 실행','Speed & Execution','완벽한 계획보다 빠른 실행과 개선을 택한다'],
  ['04','분석적 사고','Analytic Mindset','감이 아니라 데이터로 전략을 세운다'],
  ['05','주도와 팀워크','Leadership & Followship','스스로 주도하되 하나의 팀으로 움직인다']
];
$('#cvGrid').innerHTML=CORE_VALUES.map(([n,name,en,desc])=>`
  <div class="cv-card"><div class="cv-num">${n}</div>
  <div class="cv-name">${name}</div><div class="cv-en">${en}</div>
  <div class="cv-desc">${desc}</div></div>`).join('');

const GROUPS=[
  ['발명','R&D그룹','일상 로봇의 지능·설계·자동화 원천기술을 개발한다','디자인 · 지능화 · 자동화','gf-invent'],
  ['보급','로봇사업그룹','로봇을 판매·운영하여 지속가능한 매출을 창출한다','영업 · 마케팅 · 운영','gf-supply'],
  ['확장','전략사업그룹','비정형 사업을 전략적으로 디자인·실행하여 사업을 확장한다','사업개발 · 정부사업','gf-expand'],
  ['실증','리테일그룹 (자회사)','로봇 리테일로 XYZ 가치를 증명하고 실증 데이터를 생산한다','리테일팀 · 로스터리 · 라운지엑스','gf-prove'],
  ['토대','경영지원그룹','재무·인사·법무의 관리 기반과 통제 체계를 제공한다','재무회계 · 인사총무 · 법무','gf-base']
];
$('#groupFlow').innerHTML=GROUPS.map(([role,name,mission,teams,cls])=>`
  <div class="gf-card ${cls}"><div class="gf-role">${role}</div>
  <div class="gf-name">${name}</div><div class="gf-mission">${mission}</div>
  <div class="gf-teams">${teams}</div></div>`).join('');

// ===== 조직도 =====
const GROUP_COLOR={
  'R&D그룹':'#1E6B4F','로봇사업그룹':'#B4690E','전략사업그룹':'#6B4E8E',
  '경영지원그룹':'#2E5C8A','리테일그룹':'#A0522D'  // 리테일=벽돌색
};
function renderOrgChart(){
  const box=$('#orgChart'); if(!box) return;
  let html='';
  for(const [gname,gd] of Object.entries(ORGCHART)){
    const col=GROUP_COLOR[gname]||'#3A3A3A';
    html+=`<div class="org-group" style="border-top-color:${col}">
      <div class="org-gname" style="color:${col}">${gname}</div>
      <div class="org-glead">${gd.lead||''}</div>
      <div class="org-teams">`;
    for(const [tname,td] of Object.entries(gd.teams)){
      html+=`<div class="org-team">
        <div class="org-tname" data-path="${gname}|${tname}" style="background:${col}">${tname}</div>`;
      if(td.parts){
        html+=`<div class="org-parts">`;
        for(const pname of Object.keys(td.parts)){
          html+=`<div class="org-part" data-path="${gname}|${tname}|${pname}" style="border-color:${col};color:${col}">${pname}</div>`;
        }
        html+=`</div>`;
      }
      html+=`</div>`;
    }
    html+=`</div></div>`;
  }
  box.innerHTML=html;
  // 클릭 이벤트
  $$('.org-tname,.org-part',box).forEach(el=>el.onclick=()=>{
    $$('.org-tname,.org-part',box).forEach(x=>{ x.classList.remove('org-sel'); if(x.classList.contains('org-part')) x.style.background=''; });
    el.classList.add('org-sel');
    if(el.classList.contains('org-part')){ const g=el.dataset.path.split('|')[0]; el.style.background=GROUP_COLOR[g]||'#3A3A3A'; }
    showOrgMembers(el.dataset.path);
  });
}
function showOrgMembers(path){
  const [gname,tname,pname]=path.split('|');
  const gd=ORGCHART[gname], td=gd.teams[tname];
  const col=GROUP_COLOR[gname]||'#3A3A3A';
  let members=[], title='';
  if(pname){ members=td.parts[pname]; title=`${gname} · ${tname} · ${pname}`; }
  else if(td.members){ members=td.members; title=`${gname} · ${tname}`; }
  else if(td.parts){ // 팀 클릭 시 전체 파트
    members=Object.values(td.parts).flat(); title=`${gname} · ${tname} (전체)`;
    if(td.lead) title+=` · 팀장 ${td.lead}`;
  }
  const box=$('#orgMembers');
  box.style.display='block';
  box.innerHTML=`<div class="om-head" style="border-left-color:${col}"><strong>${title}</strong><span>${members.length}명</span></div>
    <div class="om-grid">${members.map(m=>`
      <div class="om-card"><div class="om-name">${m.name}</div>
      <div class="om-title" style="color:${col}">${m.title}</div>
      ${m.job?`<div class="om-job">${m.job}</div>`:''}</div>`).join('')}</div>`;
  box.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ===== 인력 현황 =====
function renderWorkforce(){
  const H=HRSTAT;
  // KPI
  const kpis=[
    ['총원',H.total,'명'],
    ['R&D',H.rnd['R&D']||0,'명'],
    ['비R&D',H.rnd['비R&D']||0,'명'],
    ['정규직',H.emptype['정규직']||0,'명'],
    ['계약직',H.emptype['계약직']||0,'명'],
    ['인턴',H.emptype['인턴']||0,'명']
  ];
  $('#workforceKpi').innerHTML=kpis.map(([l,v,u])=>`
    <div class="kpi-card"><div class="kpi-val">${v}<small>${u}</small></div><div class="kpi-label">${l}</div></div>`).join('');
  // 분포 차트 (성별/연령/고용형태 도넛+막대)
  const donut=(title,data,colors)=>{
    const total=Object.values(data).reduce((a,b)=>a+b,0);
    let acc=0; const segs=Object.entries(data).map(([k,v],i)=>{
      const pct=v/total*100; const s=acc; acc+=pct;
      return {k,v,pct,start:s,color:colors[i%colors.length]};
    });
    const R=52,C=64,sw=20;
    let circles=segs.map(s=>{
      const dash=`${s.pct/100*2*Math.PI*R} ${2*Math.PI*R}`;
      const rot=s.start/100*360-90;
      return `<circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="${s.color}" stroke-width="${sw}" stroke-dasharray="${dash}" transform="rotate(${rot} ${C} ${C})"/>`;
    }).join('');
    const legend=segs.map(s=>`<div class="wl-item"><span class="wl-dot" style="background:${s.color}"></span>${s.k} <b>${s.v}</b><em>${s.pct.toFixed(0)}%</em></div>`).join('');
    return `<div class="wf-chart"><h4>${title}</h4><div class="wf-donut"><svg viewBox="0 0 ${C*2} ${C*2}">${circles}<text x="${C}" y="${C+5}" text-anchor="middle" font-size="20" font-weight="800">${total}</text></svg><div class="wf-legend">${legend}</div></div></div>`;
  };
  $('#workforceCharts').innerHTML=
    donut('성별',H.gender,['#2E5C8A','#B4690E'])+
    donut('연령대',H.ageband,['#1E3A5F','#2E5C8A','#6B8CAE','#B0C4D8'])+
    donut('고용형태',H.emptype,['#1E6B4F','#B4690E','#9CA3AF'])+
    donut('R&D 구분',H.rnd,['#1E6B4F','#6B7280']);
  renderOrgTreemap();
}

// 조직별 인원 면적 그래프 (treemap 스타일)
function renderOrgTreemap(){
  const H=HRSTAT;
  const GC=GROUP_COLOR;
  // 기타 제외, 인원순 정렬
  const entries=Object.entries(H.groupcount).filter(([k])=>k!=='기타').sort((a,b)=>b[1]-a[1]);
  const total=entries.reduce((s,[,v])=>s+v,0);
  const recruiting=new Set(H.recruiting);
  // 간단한 행 기반 treemap (면적 = flex-grow)
  let html='<div class="treemap">';
  entries.forEach(([g,cnt])=>{
    const isRec=recruiting.has(g);
    const baseCol=GC[g]||'#6B7280';
    const bg=isRec?baseCol:'#8A9099';
    // 면적을 인원수 비례로 (flex-grow), 최소 높이 확보
    html+=`<div class="tm-cell" style="flex-grow:${cnt};background:${bg}" title="${g} ${cnt}명">
      <div class="tm-name">${g.replace('그룹','')}</div>
      <div class="tm-count">${cnt}명</div>
      ${isRec?'<div class="tm-badge">채용중</div>':''}
    </div>`;
  });
  html+='</div>';
  $('#orgTreemap').innerHTML=html;
}

// ===== 채용 대시보드 =====
function initRecruit(){
  const R=RECRUIT;
  $('#recDate').textContent='2026-09-03 기준 · 자동 집계';
  const active=R.reqs.filter(r=>r.status==='진행중');
  const done=R.reqs.filter(r=>r.status==='완료');
  const overdue=active.filter(r=>r.diagnosis==='기간초과');
  const doneDays=done.map(r=>r.days).filter(Boolean);
  const avgDone=doneDays.length?Math.round(doneDays.reduce((a,b)=>a+b,0)/doneDays.length):0;
  const totalApp=R.funnel.reduce((s,f)=>s+(f.total||0),0);
  const kpis=[
    ['진행중 채용',active.length,'건',''],['완료(누적)',done.length,'건',''],
    ['기간초과',overdue.length,'건','alert'],['평균 소요일',avgDone,'일',''],
    ['총 지원자',totalApp,'명',''],['공고당 평균',(totalApp/R.funnel.length).toFixed(1),'명','']
  ];
  $('#kpiRow').innerHTML=kpis.map(([l,v,u,cls])=>`
    <div class="kpi-card ${cls}"><div class="kpi-val">${v}<small>${u}</small></div>
    <div class="kpi-label">${l}</div></div>`).join('');
  renderQuadrant(R.quad);
  renderTrend(R.trend);
  renderRecTable(R.reqs);
  initJobDetail();
}

// 진단 매트릭스 (직무명 표시)
function renderQuadrant(quad){
  const W=580,H=400,padL=52,padR=30,padT=36,padB=48;
  const pts=quad.filter(q=>q.days!=null&&q.applicants!=null);
  const maxD=Math.max(...pts.map(p=>p.days),120);
  const maxA=Math.max(...pts.map(p=>p.applicants),80);
  const xFor=d=>padL+(W-padL-padR)*(d/maxD);
  const yFor=a=>H-padB-(H-padT-padB)*(a/maxA);
  const midX=xFor(maxD/2), midY=yFor(maxA/2);
  const colors={1:'#1E6B4F',2:'#2E5C8A',3:'#B4690E',4:'#B03A2E'};
  let svg=`<svg viewBox="0 0 ${W} ${H}" class="rec-svg">`;
  // 4사분면 배경 (우하단 = 장기·저지원)
  svg+=`<rect x="${midX}" y="${midY}" width="${W-padR-midX}" height="${H-padB-midY}" fill="#FBEAE8" opacity="0.5"/>`;
  // 축
  svg+=`<line x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}" stroke="#3A3A3A" stroke-width="1.5"/>`;
  svg+=`<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H-padB}" stroke="#3A3A3A" stroke-width="1.5"/>`;
  svg+=`<line x1="${midX}" y1="${padT}" x2="${midX}" y2="${H-padB}" stroke="#CBD0D6" stroke-width="1" stroke-dasharray="3 3"/>`;
  svg+=`<line x1="${padL}" y1="${midY}" x2="${W-padR}" y2="${midY}" stroke="#CBD0D6" stroke-width="1" stroke-dasharray="3 3"/>`;
  // 사분면 라벨 (각 구석에 배치)
  svg+=`<text x="${padL+6}" y="${padT+4}" font-size="9.5" fill="#1E6B4F" font-weight="700">단기·다지원 (양호)</text>`;
  svg+=`<text x="${W-padR-6}" y="${padT+4}" text-anchor="end" font-size="9.5" fill="#2E5C8A" font-weight="700">장기·다지원</text>`;
  svg+=`<text x="${padL+6}" y="${H-padB-8}" font-size="9.5" fill="#B4690E" font-weight="700">단기·저지원</text>`;
  svg+=`<text x="${W-padR-6}" y="${H-padB-8}" text-anchor="end" font-size="10" fill="#B03A2E" font-weight="800">🔴 장기·저지원 (개선 필요)</text>`;
  // 점 + 직무명
  pts.forEach((p)=>{
    const x=xFor(p.days),y=yFor(p.applicants);
    const jobName=(p.label||'').replace(/^\d+\.\s*/,'');
    svg+=`<circle cx="${x}" cy="${y}" r="5.5" fill="${colors[p.quadrant]||'#6B7280'}" opacity="0.85"/>`;
    svg+=`<text x="${x+8}" y="${y+3}" font-size="8.5" fill="#3A3A3A">${jobName}</text>`;
  });
  svg+=`<text x="${(padL+W-padR)/2}" y="${H-8}" text-anchor="middle" font-size="10" fill="#6B7280">소요일 →</text>`;
  svg+=`<text x="14" y="${(padT+H-padB)/2}" text-anchor="middle" font-size="10" fill="#6B7280" transform="rotate(-90 14 ${(padT+H-padB)/2})">지원자수 →</text>`;
  svg+=`</svg>`;
  $('#quadChart').innerHTML=svg;
}

function renderTrend(trend){
  const t=trend.filter(x=>x.total!=null);
  if(!t.length){ $('#trendChart').innerHTML='<p class="rec-note">데이터 없음</p>'; return; }
  const W=580,H=340,padL=46,padR=24,padT=20,padB=40;
  const maxV=Math.max(...t.map(x=>x.total));
  const n=t.length;
  const xFor=i=>padL+(W-padL-padR)*(n===1?0.5:i/(n-1));
  const yFor=v=>H-padB-(H-padT-padB)*(v/maxV);
  let svg=`<svg viewBox="0 0 ${W} ${H}" class="rec-svg">`;
  for(let k=0;k<=4;k++){ const v=maxV*k/4,y=yFor(v);
    svg+=`<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke="#E5E7EB"/><text x="${padL-8}" y="${y+3}" text-anchor="end" font-size="9" fill="#9CA3AF">${Math.round(v)}</text>`; }
  const line=t.map((x,i)=>`${xFor(i)},${yFor(x.total)}`).join(' ');
  svg+=`<polyline points="${padL},${H-padB} ${line} ${xFor(n-1)},${H-padB}" fill="#1E3A5F" opacity="0.08"/>`;
  svg+=`<polyline points="${line}" fill="none" stroke="#1E3A5F" stroke-width="2.5"/>`;
  t.forEach((x,i)=>{ svg+=`<circle cx="${xFor(i)}" cy="${yFor(x.total)}" r="3" fill="#1E3A5F"/>`; });
  t.forEach((x,i)=>{ if(i%2===0||i===n-1) svg+=`<text x="${xFor(i)}" y="${H-padB+16}" text-anchor="middle" font-size="8" fill="#6B7280">${(x.date||'').slice(5)}</text>`; });
  svg+=`</svg>`;
  const last=t[t.length-1];
  $('#trendChart').innerHTML=svg+`<p class="rec-note" style="margin-top:8px">누적 ${last.total}명 · 최근 주 신규 +${last.new||0}명</p>`;
}

function renderFunnel(funnel){
  const stages=[['서류','#1E3A5F'],['1차','#2E5C8A'],['2차','#4A6485'],['처우','#8C6A3F'],['입사','#1E6B4F']];
  const maxTotal=Math.max(...funnel.map(f=>f.total||1));
  let html='';
  funnel.forEach(f=>{
    const segs=[f.서류,f['1차'],f['2차'],f.처우,f.입사];
    let bars=`<div class="funnel-seg" style="background:#CBD0D6;flex:0 0 auto;width:44px" title="총지원 ${f.total}">${f.total}</div>`;
    stages.forEach(([label,color],i)=>{ const val=segs[i]||0;
      if(val>0) bars+=`<div class="funnel-seg" style="background:${color};flex:1" title="${label} ${val}">${val}</div>`; });
    html+=`<div class="funnel-row"><div class="funnel-job" title="${f.job}">${f.job}</div><div class="funnel-bars">${bars}</div></div>`;
  });
  html+=`<div style="margin-top:12px;font-size:11px;color:var(--mid)"><span style="color:#CBD0D6">■</span> 총지원 · `+
    stages.map(([l,c])=>`<span style="color:${c}">■</span> ${l}`).join(' · ')+`</div>`;
  $('#funnelChart').innerHTML=html;
}

let recFilterState='all';
function renderRecTable(reqs){
  const filters=[['all','전체'],['진행중','진행중'],['완료','완료'],['취소','취소']];
  $('#recFilter').innerHTML=filters.map(([k,l])=>`<button class="${k===recFilterState?'active':''}" data-f="${k}">${l}</button>`).join('');
  $$('#recFilter button').forEach(b=>b.onclick=()=>{ recFilterState=b.dataset.f; renderRecTable(reqs); });
  let list=recFilterState==='all'?reqs:reqs.filter(r=>r.status===recFilterState);
  // 일평균 지원자 오름차순 (작을수록 위 = 현황 나쁜 채용 상단)
  list=[...list].sort((a,b)=>(a.perday??999)-(b.perday??999));
  $('#recTable').innerHTML=`<thead><tr><th>그룹</th><th>팀</th><th>직무</th><th>요청일</th><th>상태</th><th>소요일</th><th>일평균 지원</th><th>진단</th></tr></thead><tbody>${
    list.map(r=>{
      const sb={'진행중':'badge-active','완료':'badge-done','취소':'badge-cancel'}[r.status]||'';
      const db=r.diagnosis==='기간초과'?'badge-over':'badge-normal';
      // 일평균 낮으면 경고색
      const pd=r.perday??0;
      const pdClass=pd<0.3?'perday-bad':(pd<1?'perday-warn':'perday-ok');
      return `<tr><td>${r.group}</td><td>${r.team}</td><td>${r.job}</td>
        <td>${r.reqDate||'-'}</td><td><span class="badge ${sb}">${r.status}</span></td>
        <td>${r.days||'-'}</td><td class="${pdClass}">${pd.toFixed(2)}<small>/일</small></td>
        <td>${r.diagnosis?`<span class="badge ${db}">${r.diagnosis}</span>`:'-'}</td></tr>`;
    }).join('')}</tbody>`;
}

// 직무 상세 (드롭박스 선택)
function initJobDetail(){
  const sel=$('#jobDetailSel');
  RECRUIT.reqs.forEach(r=>sel.add(new Option(`${r.job} (${r.group}·${r.team})`,r.no)));
  sel.onchange=()=>{ if(sel.value) showJobDetail(+sel.value); else $('#jobDetailPanel').style.display='none'; };
}
function showJobDetail(no){
  const req=RECRUIT.reqs.find(r=>r.no===no);
  const fun=RECRUIT.funnel.find(f=>f.no===no);
  const panel=$('#jobDetailPanel'); panel.style.display='block';
  const sb={'진행중':'badge-active','완료':'badge-done','취소':'badge-cancel'}[req.status]||'';
  // 전형 단계 (지원자→서류→1차→2차→처우→입사) + 통과율
  const stages=[['지원자',fun?.total||0],['서류전형',fun?.서류||0],['1차면접',fun?.['1차']||0],['2차면접',fun?.['2차']||0],['처우협의',fun?.처우||0],['입사확정',fun?.입사||0]];
  const total=stages[0][1]||1;
  let minRate=1, bottleneck='';
  const stageRows=stages.map((s,i)=>{
    const prev=i>0?stages[i-1][1]:s[1];
    const rate=i===0?1:(prev>0?s[1]/prev:0);
    const cumRate=s[1]/total;
    if(i>0 && rate<minRate){ minRate=rate; bottleneck=`${stages[i-1][0]} → ${s[0]}`; }
    const barW=cumRate*100;
    return {label:s[0],cnt:s[1],rate:i===0?null:rate,cumRate,barW};
  });
  panel.innerHTML=`
    <div class="jd-head">
      <div><h3>${req.job}</h3><span class="jd-org">${req.group} · ${req.team} · 요청자 ${req.requester||'-'}</span></div>
      <span class="badge ${sb}">${req.status}</span>
    </div>
    <div class="jd-kpis">
      <div class="jd-kpi"><div class="v">${req.days||'-'}</div><div class="l">소요일</div></div>
      <div class="jd-kpi"><div class="v">${fun?.total||0}</div><div class="l">총 지원자</div></div>
      <div class="jd-kpi"><div class="v">${(req.perday??0).toFixed(2)}</div><div class="l">일평균 지원</div></div>
      <div class="jd-kpi"><div class="v">${req.diagnosis||'-'}</div><div class="l">진단</div></div>
      <div class="jd-kpi"><div class="v">${req.reqDate||'-'}</div><div class="l">요청일</div></div>
      <div class="jd-kpi"><div class="v">${req.joinDate||'미정'}</div><div class="l">입사확정</div></div>
    </div>
    <div class="jd-funnel">
      <h4>전형 퍼널 &amp; 병목 분석</h4>
      <table class="jd-funnel-table">
        <thead><tr><th>전형단계</th><th>인원</th><th>통과율(직전대비)</th><th>누적통과율</th><th></th></tr></thead>
        <tbody>${stageRows.map(s=>`
          <tr><td class="jf-label">${s.label}</td>
            <td class="jf-cnt">${s.cnt}</td>
            <td class="jf-rate">${s.rate===null?'—':(s.rate*100).toFixed(0)+'%'}</td>
            <td class="jf-cum">${(s.cumRate*100).toFixed(0)}%</td>
            <td class="jf-barcell"><div class="jf-bar" style="width:${s.barW}%"></div></td>
          </tr>`).join('')}</tbody>
      </table>
      ${bottleneck?`<div class="jd-bottleneck">🔍 병목 구간: <strong>${bottleneck}</strong> (통과율 ${(minRate*100).toFixed(0)}%) — 해당 단계 개선 필요</div>`:''}
    </div>`;
  panel.scrollIntoView({behavior:'smooth',block:'nearest'});
}

renderOrgChart();
renderWorkforce();
initRecruit();
