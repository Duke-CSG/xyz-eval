// ============ 공통 유틸 ============
const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];
const ALL_ITEMS=[...ITEMS.인재상,...ITEMS.공통역량,...ITEMS.직무역량];
const itemById=id=>ALL_ITEMS.find(i=>i.id===id);
function allMembers(){ const a=[]; for(const g in ORG.groups) for(const t in ORG.groups[g].teams) ORG.groups[g].teams[t].forEach(n=>a.push({name:n,group:g,team:t,job:JOB[n]})); return a; }
function fmtMoney(v){ return (v>=0?'':'-')+'₩'+Math.abs(v).toLocaleString()+'만'; }

// ============ 탭 전환 ============
$$('.navtab').forEach(b=>b.onclick=()=>{
  $$('.navtab').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  $$('.tab-panel').forEach(p=>p.classList.remove('active'));
  $('#tab-'+b.dataset.tab).classList.add('active');
});

// ============ 평가 조회 탭 ============
function initEvalTab(){
  const gSel=$('#evalGroupSel'),tSel=$('#evalTeamSel'),jSel=$('#evalJobSel'),search=$('#evalSearch');
  Object.keys(ORG.groups).forEach(g=>gSel.add(new Option(g,g)));
  [...new Set(Object.values(JOB))].forEach(j=>jSel.add(new Option(j,j)));
  gSel.onchange=()=>{ tSel.length=1; if(gSel.value){ Object.keys(ORG.groups[gSel.value].teams).forEach(t=>tSel.add(new Option(t,t))); } renderMembers(); };
  tSel.onchange=jSel.onchange=renderMembers; search.oninput=renderMembers;

  function renderMembers(){
    const q=search.value.trim();
    let list=allMembers();
    if(gSel.value) list=list.filter(m=>m.group===gSel.value);
    if(tSel.value) list=list.filter(m=>m.team===tSel.value);
    if(jSel.value) list=list.filter(m=>m.job===jSel.value);
    if(q) list=list.filter(m=>m.name.includes(q)||m.team.includes(q)||m.job.includes(q)||m.group.includes(q));
    const box=$('#evalMemberList'); box.innerHTML='';
    let curGroup='';
    list.forEach(m=>{
      if(m.group+m.team!==curGroup){ curGroup=m.group+m.team;
        const lbl=document.createElement('div'); lbl.className='member-group-label'; lbl.textContent=m.group+' · '+m.team; box.appendChild(lbl); }
      const el=document.createElement('div'); el.className='member-item'; el.dataset.name=m.name;
      el.innerHTML=`<span class="m-name">${m.name}</span><span class="m-meta">${m.job}</span>`;
      el.onclick=()=>{ $$('.member-item').forEach(x=>x.classList.remove('selected')); el.classList.add('selected'); showEvalDetail(m.name); };
      box.appendChild(el);
    });
    if(!list.length) box.innerHTML='<div class="empty-state" style="height:120px">해당 조건의 인원이 없습니다.</div>';
  }
  renderMembers();
  // 직무 내 역량분포 버튼
  $('#btnJobDist').onclick=showJobDistribution;
}

// ===== 직무 내 역량분포 뷰 =====
const GRADE_ORDER=["S상","S중","S하","A상","A중","A하","B상","B중","B하","C상","C중","C하","D상","D중","D하"];
function scoreToGrade(score){ // 종합점수(4점)→ 등급 (자동 배치 fallback)
  const idx=Math.min(14,Math.max(0,Math.round((4-score)/4*14)));
  return GRADE_ORDER[idx];
}
function showJobDistribution(){
  const g=$('#evalGroupSel').value,t=$('#evalTeamSel').value,j=$('#evalJobSel').value;
  let list=allMembers();
  if(g) list=list.filter(m=>m.group===g);
  if(t) list=list.filter(m=>m.team===t);
  if(j) list=list.filter(m=>m.job===j);
  if(!list.length){ $('#evalContent').innerHTML='<div class="empty-state">해당 조건의 인원이 없습니다.</div>'; return; }
  $$('.member-item').forEach(x=>x.classList.remove('selected'));

  const scope=[g,t,j].filter(Boolean).join(' · ')||'전체';
  const avgAll=list.reduce((s,m)=>s+totalScore(m.name),0)/list.length;

  // 등급별 그룹핑 (확정값 우선, 없으면 자동)
  const byGrade={}; GRADE_ORDER.forEach(gr=>byGrade[gr]=[]);
  let confirmedCnt=0;
  list.forEach(m=>{
    let grade=CONFIRMED_POS[m.name];
    if(grade) confirmedCnt++; else grade=scoreToGrade(totalScore(m.name));
    (byGrade[grade]=byGrade[grade]||[]).push({name:m.name,confirmed:!!CONFIRMED_POS[m.name]});
  });

  $('#evalContent').innerHTML=`
    <div class="detail-header"><h2>직무 내 역량분포</h2><span class="sub">${scope} · ${list.length}명</span></div>
    <div class="dist-grid">
      <div class="dist-card">
        <div class="dist-card-head">
          <h3>역량 포지셔닝 분포</h3>
          <span class="dist-note">채용 타겟팅 · 직무 경쟁력 진단용</span>
        </div>
        <div id="distPayband" class="dist-payband"></div>
        <p class="dist-legend">${confirmedCnt<list.length?`<span class="badge-auto">자동</span> 표시는 미확정(종합점수 환산). `:''}<span class="badge-conf">확정</span>은 인사위원회 확정 등급.</p>
      </div>
      <div class="dist-card">
        <div class="dist-card-head">
          <h3>항목별 점수 분포</h3>
          <span class="dist-big">평균 ${avgAll.toFixed(2)}<small>/4.0</small></span>
        </div>
        <div id="distLines"></div>
      </div>
    </div>`;
  renderDistPayband(byGrade);
  renderDistLines(list);
}
function renderDistPayband(byGrade){
  const box=$('#distPayband'); box.innerHTML='';
  // 등급을 5개 대분류(S~D)로 묶어 세로 배치, 각 칸에 인원 칩
  const majors=[["S","S"],["A","A"],["B","B"],["C","C"],["D","D"]];
  majors.forEach(([mg])=>{
    const subs=["상","중","하"].map(p=>mg+p);
    const people=subs.flatMap(sg=>(byGrade[sg]||[]).map(x=>({...x,sub:sg.slice(1)})));
    const row=document.createElement('div'); row.className='dpb-row'; row.dataset.g=mg;
    const chips=people.map(p=>`<span class="dpb-chip ${p.confirmed?'':'auto'}">${p.name}<em>${p.sub}</em></span>`).join('');
    row.innerHTML=`<div class="dpb-glabel">${mg}</div><div class="dpb-people">${chips||'<span class="dpb-empty">해당 없음</span>'}</div>
      <div class="dpb-count">${people.length}명</div>`;
    box.appendChild(row);
  });
}
function renderDistLines(list){
  const box=$('#distLines');
  const cats=[['인재상',ITEMS.인재상],['공통역량',ITEMS.공통역량],['직무역량',ITEMS.직무역량]];
  const allItems=cats.flatMap(([_,arr])=>arr);
  const W=560,H=240,padL=40,padR=20,padT=20,padB=54;
  const n=allItems.length;
  const xStep=(W-padL-padR)/(n-1);
  const yFor=v=>padT+(H-padT-padB)*(1-(v-1)/3); // 1~4 → y
  // 각 인원 폴리라인
  const colors=['#1E3A5F','#B4690E','#1E6B4F','#8E6FB0','#B03A2E','#3A3A3A','#2E5C8A','#A06520'];
  const memScores=list.map(m=>{
    const e=EVAL[m.name];
    return { name:m.name, pts:allItems.map(it=>{
      const all=[...e.down,...e.peer,(e.self?[e.self]:[]),...e.collab].flat().filter(ev=>ev.scores[it.id]!=null);
      return all.length? all.reduce((a,b)=>a+b.scores[it.id],0)/all.length : null;
    })};
  });
  // 평균선
  const avgPts=allItems.map((it,i)=>{ const vals=memScores.map(m=>m.pts[i]).filter(v=>v!=null); return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null; });
  let svg=`<svg viewBox="0 0 ${W} ${H}" class="dist-svg">`;
  // 그리드 (1~4)
  for(let v=1;v<=4;v++){ const y=yFor(v); svg+=`<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke="#E5E7EB" stroke-width="1"/><text x="${padL-8}" y="${y+3}" text-anchor="end" font-size="9" fill="#9CA3AF">${v}</text>`; }
  // 각 인원선 (얇게, 반투명)
  memScores.forEach((m,mi)=>{
    const pts=m.pts.map((v,i)=>v!=null?`${padL+i*xStep},${yFor(v)}`:null).filter(Boolean).join(' ');
    svg+=`<polyline points="${pts}" fill="none" stroke="${colors[mi%colors.length]}" stroke-width="1.5" opacity="0.45"/>`;
  });
  // 평균선 (굵게, 검정 점선)
  const avgLine=avgPts.map((v,i)=>v!=null?`${padL+i*xStep},${yFor(v)}`:null).filter(Boolean).join(' ');
  svg+=`<polyline points="${avgLine}" fill="none" stroke="#1A1A1A" stroke-width="2.5" stroke-dasharray="4 3"/>`;
  avgPts.forEach((v,i)=>{ if(v!=null) svg+=`<circle cx="${padL+i*xStep}" cy="${yFor(v)}" r="3" fill="#1A1A1A"/>`; });
  // x축 라벨
  allItems.forEach((it,i)=>{ const x=padL+i*xStep;
    svg+=`<text x="${x}" y="${H-padB+16}" text-anchor="end" font-size="8.5" fill="#6B7280" transform="rotate(-40 ${x} ${H-padB+16})">${it.name}</text>`; });
  svg+=`</svg>`;
  box.innerHTML=svg+`<p class="dist-legend"><span style="border-top:2.5px dashed #1A1A1A;display:inline-block;width:20px;vertical-align:middle"></span> 직무 평균 · 얇은 선은 개인별</p>`;
}

function showEvalDetail(name){
  const e=EVAL[name]; const m=allMembers().find(x=>x.name===name);
  const content=$('#evalContent');
  const secAvg=(arr)=>{ if(!arr.length) return null; let s=0,c=0; arr.forEach(ev=>{ Object.values(ev.scores).forEach(v=>{s+=v;c++;}); }); return c?(s/c):null; };
  const downAvg=secAvg(e.down), peerAvg=secAvg(e.peer), selfAvg=e.self?secAvg([e.self]):null, collabAvg=secAvg(e.collab);
  const total=totalScore(name);

  content.innerHTML=`
    <div class="detail-header compact">
      <h2>${name}</h2><span class="sub">${m.group} · ${m.team} · ${m.job}</span>
      <div class="dh-score"><span class="dh-big">${total.toFixed(2)}</span><span class="dh-max">/4.0</span></div>
    </div>
    <div class="person-compact">
      <div class="pc-sections">
        <div class="mini-sec down"><span class="dot"></span>하향 <b>${downAvg?downAvg.toFixed(2):'-'}</b><em>${e.down.length}명</em></div>
        <div class="mini-sec peer"><span class="dot"></span>동료 <b>${peerAvg?peerAvg.toFixed(2):'-'}</b><em>${e.peer.length}명</em></div>
        <div class="mini-sec self"><span class="dot"></span>본인 <b>${selfAvg?selfAvg.toFixed(2):'-'}</b><em>${e.self?1:0}명</em></div>
        <div class="mini-sec collab"><span class="dot"></span>협업 <b>${collabAvg?collabAvg.toFixed(2):'-'}</b><em>${e.collab.length}명</em></div>
      </div>
      <div class="view-tabs">
        <button class="view-tab active" data-v="item">문항별</button>
        <button class="view-tab" data-v="evaluator">평가자별</button>
      </div>
      <div id="viewArea"></div>
    </div>
  `;
  $$('.view-tab',content).forEach(b=>b.onclick=()=>{ $$('.view-tab',content).forEach(x=>x.classList.remove('active')); b.classList.add('active'); renderView(b.dataset.v,name); });
  renderView('item',name);
}
function secCard(cls,title,arr,avg){
  return `<div class="eval-sec ${cls}"><h4><span class="dot"></span>${title}</h4>
    <div class="sec-score">${avg?avg.toFixed(2):'-'}</div>
    <div class="sec-cnt">평가자 ${arr.length}명</div></div>`;
}
function renderView(v,name){
  const e=EVAL[name],m=allMembers().find(x=>x.name===name),area=$('#viewArea');
  if(v==='item'){
    // 3열 컬럼(인재상/공통/직무)으로 압축 배치
    let html='<div class="item-cols">';
    [['인재상',ITEMS.인재상],['공통역량',ITEMS.공통역량],['직무역량',ITEMS.직무역량]].forEach(([cat,arr])=>{
      html+=`<div class="item-col"><h5>${cat}</h5>`;
      arr.forEach(it=>{
        const all=[...e.down,...e.peer,(e.self?[e.self]:[]),...e.collab].flat().filter(ev=>ev.scores[it.id]!=null);
        const myAvg=all.length? all.reduce((a,b)=>a+b.scores[it.id],0)/all.length:0;
        const jobAvg=jobAverage(m.job,it.id);
        const pct=(myAvg/4*100), avgPct=(jobAvg/4*100);
        const diff=myAvg-jobAvg;
        html+=`<div class="item-row">
          <div class="item-label"><span class="name">${it.name}</span>
            <span class="scores ${diff>=0?'up':'down'}">${myAvg.toFixed(1)} <em>(${diff>=0?'+':''}${diff.toFixed(1)})</em></span></div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%"></div>
            <div class="bar-avg" style="left:${avgPct}%"></div>
          </div></div>`;
      });
      html+='</div>';
    });
    html+='</div><p class="item-foot"><span class="bar-avg-legend"></span> 빨간 선 = 직무 평균 · 괄호는 평균 대비 편차</p>';
    area.innerHTML=html;
  } else {
    // 평가자별
    let html='';
    const groups=[['하향',e.down],['동료',e.peer],['본인',e.self?[e.self]:[]],['협업',e.collab]];
    groups.forEach(([label,arr])=>arr.forEach(ev=>{
      const a=Object.values(ev.scores).reduce((x,y)=>x+y,0)/Object.values(ev.scores).length;
      html+=`<div class="evaluator-detail">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>${label} · ${ev.evaluator}</strong><span style="font-size:18px;font-weight:800">${a.toFixed(2)}</span></div>
        <div style="margin-top:8px;font-size:12px;color:var(--mid)">
          ${Object.entries(ev.scores).map(([id,v])=>`${itemById(id)?.name||id}: <b style="color:var(--ink)">${v}</b>`).join(' · ')}</div>
        <div class="comment-box">${ev.comment||'코멘트 없음'}</div>
      </div>`;
    }));
    area.innerHTML=html||'<p style="color:var(--lt)">평가 데이터가 없습니다.</p>';
  }
}

// ============ 보상 의사결정 탭 ============
let compState={ members:[], grades:{}, grouped:false, logicShown:false };

function initCompTab(){
  const gSel=$('#compGroupSel'),tSel=$('#compTeamSel'),jSel=$('#compJobSel');
  Object.keys(ORG.groups).forEach(g=>gSel.add(new Option(g,g)));
  [...new Set(Object.values(JOB))].forEach(j=>jSel.add(new Option(j,j)));
  gSel.onchange=()=>{ tSel.length=1; if(gSel.value) Object.keys(ORG.groups[gSel.value].teams).forEach(t=>tSel.add(new Option(t,t))); loadCompMembers(); };
  tSel.onchange=jSel.onchange=loadCompMembers;
  $('#btnGroupToggle').onclick=()=>{ compState.grouped=!compState.grouped; renderRankList(); };
  $('#btnLogic').onclick=showLogicTable;
  $('#btnExport').onclick=exportCSV;
  renderPayband();
}
function loadCompMembers(){
  const g=$('#compGroupSel').value,t=$('#compTeamSel').value,j=$('#compJobSel').value;
  let list=allMembers();
  if(g) list=list.filter(m=>m.group===g);
  if(t) list=list.filter(m=>m.team===t);
  if(j) list=list.filter(m=>m.job===j);
  // 종합점수 내림차순
  list.sort((a,b)=>totalScore(b.name)-totalScore(a.name));
  compState.members=list; compState.grades={}; compState.logicShown=false;
  $('#posSection').style.display=list.length?'block':'none';
  $('#logicTableWrap').style.display='none';
  renderRankList(); renderPosAssign(); renderPayband();
  setStep(1);
}
function renderRankList(){
  const ol=$('#rankList'); ol.innerHTML='';
  compState.members.forEach((m,i)=>{
    const li=document.createElement('li'); li.className='rank-item'; li.draggable=true; li.dataset.name=m.name;
    li.innerHTML=`<span class="rank-num">${i+1}</span><span class="rank-name">${m.name}</span>
      <span class="rank-score">${totalScore(m.name).toFixed(2)}</span><span class="rank-grip">⠿</span>`;
    addDrag(li); ol.appendChild(li);
  });
}
// 드래그로 우열 조정
let dragEl=null;
function addDrag(li){
  li.addEventListener('dragstart',()=>{ dragEl=li; li.classList.add('dragging'); });
  li.addEventListener('dragend',()=>{ li.classList.remove('dragging'); $$('.rank-item').forEach(x=>x.classList.remove('drag-over'));
    // 순서 갱신
    compState.members=$$('.rank-item').map(el=>allMembers().find(m=>m.name===el.dataset.name));
    renderRankList(); renderPosAssign(); });
  li.addEventListener('dragover',e=>{ e.preventDefault(); const ol=$('#rankList');
    const after=[...ol.querySelectorAll('.rank-item:not(.dragging)')].find(el=>{
      const box=el.getBoundingClientRect(); return e.clientY<=box.top+box.height/2; });
    if(after) ol.insertBefore(dragEl,after); else ol.appendChild(dragEl); });
}
function renderPosAssign(){
  const box=$('#posAssign'); box.innerHTML='';
  compState.members.forEach((m,i)=>{
    const row=document.createElement('div'); row.className='pos-assign-row';
    const sel=document.createElement('select');
    sel.add(new Option('포지션 선택','')); SUBGRADES.forEach(sg=>sel.add(new Option(sg,sg)));
    sel.value=compState.grades[m.name]||'';
    sel.onchange=()=>{ compState.grades[m.name]=sel.value; CONFIRMED_POS[m.name]=sel.value; renderPayband(); };
    row.innerHTML=`<span class="pa-rank">${i+1}</span><span class="pa-name">${m.name}</span>`;
    row.appendChild(sel); box.appendChild(row);
  });
}
function renderPayband(){
  const pb=$('#payband'); pb.innerHTML='';
  const wrap=document.createElement('div'); wrap.className='pb-wrap';

  PAYBAND.forEach((band,bi)=>{
    // 등급 블록 (상/중/하 3개 세부 행)
    const gradeBlock=document.createElement('div'); gradeBlock.className='pb-block'; gradeBlock.dataset.g=band.grade;
    // 등급 라벨(좌측 세로)
    const gLabel=document.createElement('div'); gLabel.className='pb-grade-label';
    gLabel.innerHTML=`<span class="pb-g">${band.grade}</span><span class="pb-y">${band.years}</span>`;
    gradeBlock.appendChild(gLabel);

    // 3개 세부 행 (상/중/하)
    const subWrap=document.createElement('div'); subWrap.className='pb-subwrap';
    ['상','중','하'].forEach((pos,pi)=>{
      const row=document.createElement('div'); row.className='pb-subrow'; row.dataset.sub=band.grade+pos;
      if(pi>0) row.classList.add('pb-dashed'); // 상/중, 중/하 사이 점선
      // 배치된 인원 칩
      const chips=compState.members.filter(m=>compState.grades[m.name]===band.grade+pos)
        .map(m=>`<span class="pb-chip">${m.name}</span>`).join('');
      row.innerHTML=`<span class="pb-sublabel">${band.grade}${pos}</span>
        <span class="pb-chips">${chips}</span>
        <span class="pb-subsalary">${band.sub[pos].toLocaleString()}만</span>`;
      subWrap.appendChild(row);
    });
    gradeBlock.appendChild(subWrap);
    wrap.appendChild(gradeBlock);

    // 등급 경계선 (마지막 등급 제외 매 등급 아래)
    const bd=PB_BOUNDARIES.find(b=>b.top===band.grade);
    if(bd){
      const line=document.createElement('div'); line.className='pb-boundary';
      line.innerHTML=`<span class="pb-bd-year">${bd.year}</span>
        <span class="pb-bd-mid">${bd.bot? band.grade+' / '+bd.bot+' 경계':''}</span>
        <span class="pb-bd-salary">${bd.salary.toLocaleString()}만</span>`;
      wrap.appendChild(line);
    }
  });
  pb.appendChild(wrap);
}
// 세부등급(예: A상) → 추천 연봉 (PAYBAND의 sub에서 직접 조회)
function gradeToSalary(sub){
  if(!sub) return null;
  const g=sub[0], pos=sub.slice(1);
  const band=PAYBAND.find(b=>b.grade===g); if(!band) return null;
  return band.sub[pos] ?? band.sub['중'];
}
function showLogicTable(){
  compState.logicShown=true; setStep(3);
  const t=$('#logicTable');
  t.innerHTML=`<thead><tr>
    <th>우열</th><th>피평가자</th><th>직전등급</th><th>기존연봉</th><th>금번등급</th>
    <th>연봉추천</th><th>로직인상액</th><th>조직장보정</th><th>CEO보정</th><th>최종인상액</th><th>최종연봉</th>
  </tr></thead><tbody></tbody>`;
  const tb=$('tbody',t);
  compState.members.forEach((m,i)=>{
    const emp=EMP[m.name]; const grade=compState.grades[m.name]||'';
    const rec=gradeToSalary(grade); const logic=rec!=null?rec-emp.prevSalary:0;
    const tr=document.createElement('tr'); tr.dataset.name=m.name;
    tr.innerHTML=`<td>${i+1}</td><td class="t-name">${m.name}</td><td>${emp.prevGrade}</td>
      <td>${emp.prevSalary.toLocaleString()}</td><td class="t-pos">${grade||'-'}</td>
      <td>${rec!=null?rec.toLocaleString():'-'}</td>
      <td class="t-logic ${logic>=0?'money-pos':'money-neg'}">${rec!=null?fmtMoney(logic):'-'}</td>
      <td><input class="adj adj-org" type="number" value="0" step="50"></td>
      <td class="ceo-cell"><input class="adj adj-ceo" type="number" value="0" step="50"></td>
      <td class="t-final">-</td><td class="t-fsal">-</td>`;
    tb.appendChild(tr);
    const snap50=v=>Math.round(v/50)*50;
    const recalc=()=>{
      let org=snap50(+$('.adj-org',tr).value||0), ceo=snap50(+$('.adj-ceo',tr).value||0);
      // 스냅된 값을 입력창에 반영(사용자가 50단위 아닌 값 넣으면 보정)
      if((+$('.adj-org',tr).value||0)!==org) $('.adj-org',tr).value=org;
      if((+$('.adj-ceo',tr).value||0)!==ceo) $('.adj-ceo',tr).value=ceo;
      const finalInc=logic+org+ceo; const finalSal=emp.prevSalary+finalInc;
      $('.t-final',tr).textContent=fmtMoney(finalInc);
      $('.t-final',tr).className='t-final '+(finalInc>=0?'money-pos':'money-neg');
      $('.t-fsal',tr).textContent=finalSal.toLocaleString()+'만';
    };
    $('.adj-org',tr).oninput=recalc; $('.adj-ceo',tr).oninput=recalc; recalc();
  });
  $('#logicTableWrap').style.display='block';
  $('#logicTableWrap').scrollIntoView({behavior:'smooth'});
}
function setStep(n){ $$('.step').forEach(s=>{ const sn=+s.dataset.step;
  s.classList.toggle('active',sn===n); s.classList.toggle('done',sn<n); }); }
function exportCSV(){
  // 화면 테이블 헤더에 조직 정보(그룹/팀/파트/직무)를 우열 우측에 삽입
  const header=['우열','그룹','팀','파트','직무','피평가자','직전등급','기존연봉','금번등급','연봉추천','로직인상액','조직장보정','CEO보정','최종인상액','최종연봉'];
  const rows=[header];
  $$('#logicTable tbody tr').forEach(tr=>{
    const name=tr.dataset.name;
    const m=allMembers().find(x=>x.name===name)||{};
    const cells=$$('td',tr).map(td=>{ const inp=$('input',td); return inp?inp.value:td.textContent.trim(); });
    // cells = [우열, 피평가자, 직전등급, 기존연봉, 금번등급, 연봉추천, 로직인상액, 조직장보정, CEO보정, 최종인상액, 최종연봉]
    const row=[
      cells[0],                          // 우열
      m.group||'', m.team||'', m.part||'-', m.job||'',  // 조직 정보
      ...cells.slice(1)                  // 나머지 (피평가자~최종연봉)
    ];
    rows.push(row);
  });
  const csv=rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv'}); const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download='평가보상_관리대장.csv'; a.click();
}

// 포지셔닝 완료 시 스텝2 표시
document.addEventListener('change',e=>{ if(e.target.closest('#posAssign')){ setStep(2); }});

// ============ 초기화 ============
initEvalTab(); initCompTab();
