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
}

function showEvalDetail(name){
  const e=EVAL[name]; const m=allMembers().find(x=>x.name===name);
  const content=$('#evalContent');
  const secAvg=(arr)=>{ if(!arr.length) return null; let s=0,c=0; arr.forEach(ev=>{ Object.values(ev.scores).forEach(v=>{s+=v;c++;}); }); return c?(s/c):null; };
  const downAvg=secAvg(e.down), peerAvg=secAvg(e.peer), selfAvg=e.self?secAvg([e.self]):null, collabAvg=secAvg(e.collab);
  const total=totalScore(name);

  content.innerHTML=`
    <div class="detail-header"><h2>${name}</h2><span class="sub">${m.group} · ${m.team} · ${m.job}</span></div>
    <div class="total-score-card">
      <div class="big">${total.toFixed(2)}<small> / 4.0</small></div>
      <div class="breakdown">
        <div class="bd-item"><div class="v">${downAvg?downAvg.toFixed(2):'-'}</div><div class="l">하향</div></div>
        <div class="bd-item"><div class="v">${peerAvg?peerAvg.toFixed(2):'-'}</div><div class="l">동료</div></div>
        <div class="bd-item"><div class="v">${selfAvg?selfAvg.toFixed(2):'-'}</div><div class="l">본인</div></div>
        <div class="bd-item"><div class="v">${collabAvg?collabAvg.toFixed(2):'-'}</div><div class="l">협업</div></div>
      </div>
    </div>
    <div class="eval-sections">
      ${secCard('down','하향 평가',e.down,downAvg)}
      ${secCard('peer','동료 평가',e.peer,peerAvg)}
      ${secCard('self','본인 평가',e.self?[e.self]:[],selfAvg)}
    </div>
    <div class="view-tabs">
      <button class="view-tab active" data-v="item">문항별 보기</button>
      <button class="view-tab" data-v="evaluator">평가자별 보기</button>
    </div>
    <div id="viewArea"></div>
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
    // 문항별: 각 문항 전체평가자 평균 + 동일직무 평균
    let html='<div class="item-graph">';
    ['인재상','공통역량','직무역량'].forEach(cat=>{
      html+=`<h4 style="margin:16px 0 10px;font-size:13px">${cat}</h4>`;
      ITEMS[cat].forEach(it=>{
        const all=[...e.down,...e.peer,(e.self?[e.self]:[]),...e.collab].flat().filter(ev=>ev.scores[it.id]!=null);
        const myAvg=all.length? all.reduce((a,b)=>a+b.scores[it.id],0)/all.length:0;
        const jobAvg=jobAverage(m.job,it.id);
        const pct=(myAvg/4*100), avgPct=(jobAvg/4*100);
        html+=`<div class="item-row">
          <div class="item-label"><span class="name">${it.name}</span>
            <span class="scores">내 ${myAvg.toFixed(2)} · 직무평균 ${jobAvg.toFixed(2)}</span></div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%">${myAvg.toFixed(1)}</div>
            <div class="bar-avg" style="left:${avgPct}%"></div>
            <div class="bar-avg-label" style="left:${avgPct}%">평균</div>
          </div></div>`;
      });
    });
    html+='</div>'; area.innerHTML=html;
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
  $('#posBox').style.display=list.length?'block':'none';
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
  compState.members.forEach(m=>{
    const row=document.createElement('div'); row.className='pos-assign-row';
    const sel=document.createElement('select');
    sel.add(new Option('포지션 선택','')); SUBGRADES.forEach(sg=>sel.add(new Option(sg,sg)));
    sel.value=compState.grades[m.name]||'';
    sel.onchange=()=>{ compState.grades[m.name]=sel.value; renderPayband(); };
    row.innerHTML=`<span class="pa-name">${m.name}</span>`;
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
