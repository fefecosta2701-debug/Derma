// mobile menu
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const scrim = document.getElementById('navScrim');
if(menuToggle){
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    scrim.classList.toggle('open');
  });
  scrim.addEventListener('click', () => {
    navLinks.classList.remove('open');
    scrim.classList.remove('open');
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    scrim.classList.remove('open');
  }));
}

// accordion — reinicia animações SVG ao abrir
document.querySelectorAll('.accordion-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const wasOpen = item.classList.contains('open');
    item.classList.toggle('open');
    // reinicia animações dos SVGs ao abrir
    if(!wasOpen){
      const svgEls = item.querySelectorAll('.physics-fig svg [class]');
      svgEls.forEach(el => {
        // força reflow para reiniciar animação CSS
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = '';
      });
    }
  });
});

// combinatorics selector
document.querySelectorAll('.combo-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.combo-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.combo-out').forEach(o => o.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('combo-' + btn.dataset.combo).classList.add('active');
  });
});

// growth calculator + rich animated chart (matematica.html only)
const cycleRange = document.getElementById('cycleRange');
if(cycleRange){
  const cycleVal  = document.getElementById('cycleVal');
  const cellVal   = document.getElementById('cellVal');
  const hourVal   = document.getElementById('hourVal');
  const svg       = document.getElementById('growthChart');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';

  // layout constants – wider SVG viewBox for Y-axis labels
  const W = 740, H = 280, padL = 78, padR = 24, padT = 24, padB = 44;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxT = 6;

  function Q(t){ return 10000 * Math.pow(1.6, t); }
  function fmt(n){
    if(n >= 1e6) return (n/1e6).toFixed(2).replace('.',',') + ' M';
    if(n >= 1e3) return Math.round(n).toLocaleString('pt-BR');
    return Math.round(n).toString();
  }
  function fmtFull(n){ return Math.round(n).toLocaleString('pt-BR'); }

  const maxQ = Q(maxT);
  function px(t){ return padL + (t / maxT) * chartW; }
  function py(q){ return padT + chartH - (q / maxQ) * chartH; }

  function el(tag, attrs, text){
    const e = document.createElementNS(NS, tag);
    for(const k in attrs) e.setAttribute(k, attrs[k]);
    if(text !== undefined) e.textContent = text;
    return e;
  }

  // update viewBox on the existing element (it was set to 640 220 in HTML)
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.style.height = 'auto';
  svg.innerHTML = '';

  // ── defs: gradients ──────────────────────────────────────────────────────
  const defs = el('defs', {});

  const areaGrad = el('linearGradient', {id:'areaGrad', x1:'0', y1:'0', x2:'0', y2:'1'});
  areaGrad.appendChild(el('stop', {'offset':'0%',   'stop-color':'#2E9B90', 'stop-opacity':'0.22'}));
  areaGrad.appendChild(el('stop', {'offset':'100%', 'stop-color':'#2E9B90', 'stop-opacity':'0'}));
  defs.appendChild(areaGrad);

  const selGrad = el('radialGradient', {id:'selGrad', cx:'50%', cy:'50%', r:'50%'});
  selGrad.appendChild(el('stop', {'offset':'0%',   'stop-color':'#DA9241'}));
  selGrad.appendChild(el('stop', {'offset':'100%', 'stop-color':'#A5691D'}));
  defs.appendChild(selGrad);

  svg.appendChild(defs);

  // ── clip rect ────────────────────────────────────────────────────────────
  const clipEl = el('clipPath', {id:'chartClip'});
  clipEl.appendChild(el('rect', {x:padL, y:padT, width:chartW, height:chartH}));
  svg.appendChild(clipEl);

  // ── background ───────────────────────────────────────────────────────────
  svg.appendChild(el('rect', {x:padL, y:padT, width:chartW, height:chartH, fill:'#F5FAF8', rx:4}));

  // ── Y-axis grid lines + labels ───────────────────────────────────────────
  const yTicks = [0, 50000, 100000, 200000, 300000, 400000];
  yTicks.forEach(v => {
    const y = py(v);
    if(y < padT - 2 || y > padT + chartH + 2) return;
    // grid line
    svg.appendChild(el('line', {x1:padL, y1:y, x2:padL+chartW, y2:y,
      stroke: v === 0 ? '#1B7A72' : '#CFE3DD',
      'stroke-width': v === 0 ? 1.5 : 1,
      'stroke-dasharray': v === 0 ? 'none' : '4,4'
    }));
    // label
    svg.appendChild(el('text', {
      x: padL - 8, y: y + 4,
      'font-family':'IBM Plex Mono,monospace', 'font-size':10.5,
      fill:'#3C5450', 'text-anchor':'end'
    }, fmt(v)));
  });

  // ── Y-axis title ─────────────────────────────────────────────────────────
  const yTitle = el('text', {
    x: 13, y: padT + chartH/2,
    'font-family':'IBM Plex Mono,monospace', 'font-size':10,
    fill:'#3C5450', 'text-anchor':'middle',
    transform: `rotate(-90, 13, ${padT + chartH/2})`
  }, 'células');
  svg.appendChild(yTitle);

  // ── threshold line: 100 000 ───────────────────────────────────────────────
  const threshY = py(100000);
  svg.appendChild(el('line', {
    x1:padL, y1:threshY, x2:padL+chartW, y2:threshY,
    stroke:'#DA9241', 'stroke-width':1.2, 'stroke-dasharray':'6,4'
  }));
  svg.appendChild(el('text', {
    x: padL + chartW - 4, y: threshY - 5,
    'font-family':'IBM Plex Mono,monospace', 'font-size':9.5,
    fill:'#DA9241', 'text-anchor':'end'
  }, '100.000 células'));

  // ── X-axis labels ─────────────────────────────────────────────────────────
  for(let t = 0; t <= maxT; t++){
    const x = px(t);
    const base = padT + chartH;
    svg.appendChild(el('line', {x1:x, y1:base, x2:x, y2:base+5, stroke:'#8FCFC4', 'stroke-width':1}));
    svg.appendChild(el('text', {
      x, y: base + 17,
      'font-family':'IBM Plex Mono,monospace', 'font-size':10.5,
      fill:'#3C5450', 'text-anchor':'middle'
    }, `t=${t}`));
    svg.appendChild(el('text', {
      x, y: base + 30,
      'font-family':'IBM Plex Mono,monospace', 'font-size':9,
      fill:'#8FCFC4', 'text-anchor':'middle'
    }, `${t*12}h`));
  }

  // ── area fill ─────────────────────────────────────────────────────────────
  let areaD = `M${px(0)},${py(0)}`;
  for(let t = 0; t <= maxT; t++) areaD += ` L${px(t).toFixed(1)},${py(Q(t)).toFixed(1)}`;
  areaD += ` L${px(maxT)},${py(0)} Z`;
  svg.appendChild(el('path', {d:areaD, fill:'url(#areaGrad)', 'clip-path':'url(#chartClip)'}));

  // ── curve ────────────────────────────────────────────────────────────────
  let lineD = '';
  for(let t = 0; t <= maxT; t++)
    lineD += (t === 0 ? 'M' : 'L') + `${px(t).toFixed(1)},${py(Q(t)).toFixed(1)} `;
  const curvePath = el('path', {
    d: lineD.trim(), fill:'none',
    stroke:'#1B7A72', 'stroke-width':2.8, 'stroke-linecap':'round',
    'stroke-linejoin':'round', class:'growth-path'
  });
  svg.appendChild(curvePath);

  // ── dot markers ──────────────────────────────────────────────────────────
  for(let t = 0; t <= maxT; t++){
    const dot = el('circle', {cx:px(t), cy:py(Q(t)), r:4, fill:'#8FCFC4',
      stroke:'#1B7A72', 'stroke-width':1.5, class:'grid-dot', style:'cursor:pointer'});
    dot.addEventListener('click', () => { cycleRange.value = t; cycleRange.dispatchEvent(new Event('input')); });
    svg.appendChild(dot);
  }

  // ── selection elements ────────────────────────────────────────────────────
  const selLine = el('line', {'stroke':'#DA9241', 'stroke-width':1.5, 'stroke-dasharray':'4,3'});
  const selArea = el('rect', {fill:'rgba(218,146,65,0.07)', 'pointer-events':'none'});
  const selRing = el('circle', {r:13, fill:'none', stroke:'#DA9241', 'stroke-width':1.2,
    'stroke-opacity':0.6, class:'sel-ring'});
  const selDot  = el('circle', {r:6.5, fill:'url(#selGrad)', class:'sel-dot',
    stroke:'white', 'stroke-width':2});

  // tooltip group
  const tip = el('g', {'pointer-events':'none', opacity:0, class:'tip-group'});
  const tipBox = el('rect', {rx:4, ry:4, fill:'#0F4F4A', 'stroke-width':0});
  const tipT1  = el('text', {'font-family':'IBM Plex Mono,monospace', 'font-size':11.5,
    fill:'white', 'font-weight':'600'});
  const tipT2  = el('text', {'font-family':'IBM Plex Mono,monospace', 'font-size':10,
    fill:'#8FCFC4'});
  tip.appendChild(tipBox); tip.appendChild(tipT1); tip.appendChild(tipT2);

  [selArea, selLine, selRing, selDot, tip].forEach(e => svg.appendChild(e));

  // ── render selection ──────────────────────────────────────────────────────
  function renderSelection(t){
    const x = px(t), yq = py(Q(t)), q = Q(t);
    const base = padT + chartH;

    // vertical bar + shaded column
    selLine.setAttribute('x1', x); selLine.setAttribute('x2', x);
    selLine.setAttribute('y1', padT); selLine.setAttribute('y2', base);
    selArea.setAttribute('x', x - 0.5); selArea.setAttribute('y', padT);
    selArea.setAttribute('width', 1); selArea.setAttribute('height', chartH);

    // animated dot
    selRing.setAttribute('cx', x); selRing.setAttribute('cy', yq);
    selDot.setAttribute('cx', x);  selDot.setAttribute('cy', yq);

    // tooltip positioning (flip left when near right edge)
    const tipW = 136, tipH = 40, tipPad = 8;
    const flipLeft = x + tipW + 12 > W - padR;
    const tipX = flipLeft ? x - tipW - 10 : x + 10;
    const tipY = Math.max(padT + 4, yq - tipH/2);

    tipBox.setAttribute('x', tipX); tipBox.setAttribute('y', tipY);
    tipBox.setAttribute('width', tipW); tipBox.setAttribute('height', tipH);
    tipT1.setAttribute('x', tipX + tipPad); tipT1.setAttribute('y', tipY + 16);
    tipT2.setAttribute('x', tipX + tipPad); tipT2.setAttribute('y', tipY + 31);
    tipT1.textContent = fmtFull(Math.round(q)) + ' células';
    tipT2.textContent = `Ciclo ${Math.round(t)} · ${Math.round(t)*12}h`;
    tip.setAttribute('opacity', 1);

    // external readout
    cellVal.textContent = fmtFull(Math.round(Q(Math.round(t))));
    hourVal.textContent = Math.round(Math.round(t) * 12);
  }

  // ── draw-in animation ────────────────────────────────────────────────────
  const pathLen = curvePath.getTotalLength();
  if(reduceMotion){
    curvePath.style.strokeDasharray = 'none';
  } else {
    curvePath.style.strokeDasharray = pathLen;
    curvePath.style.strokeDashoffset = pathLen;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      curvePath.style.strokeDashoffset = 0;
    }));
  }

  // ── smooth tween ─────────────────────────────────────────────────────────
  let animT = parseFloat(cycleRange.value);
  let raf = null;
  function animateTo(targetT){
    if(reduceMotion){ animT = targetT; renderSelection(animT); return; }
    if(raf) cancelAnimationFrame(raf);
    const startT = animT, startTime = performance.now(), dur = 420;
    function step(now){
      const p = Math.min(1, (now - startTime) / dur);
      const eased = 1 - Math.pow(1-p, 3);
      animT = startT + (targetT - startT) * eased;
      renderSelection(animT);
      if(p < 1) raf = requestAnimationFrame(step);
      else { animT = targetT; renderSelection(animT); }
    }
    raf = requestAnimationFrame(step);
  }

  function updateCalc(){
    const t = parseInt(cycleRange.value, 10);
    cycleVal.textContent = t;
    animateTo(t);
  }
  cycleRange.addEventListener('input', updateCalc);
  renderSelection(animT);
  cycleVal.textContent = animT;
}

// 3D interactive molecule viewers with 2D/3D toggle (quimica.html only)
document.querySelectorAll('.mol-figure').forEach(fig => {
  const tabs = fig.querySelectorAll('.mol-tab');
  const panel2d = fig.querySelector('.mol-panel-2d');
  const panel3d = fig.querySelector('.mol-panel-3d');
  const box = panel3d ? panel3d.querySelector('.mol3d-box') : null;
  let loaded = false;

  function initViewer(){
    if(loaded || !box) return;
    loaded = true;
    if(typeof $3Dmol === 'undefined'){
      box.innerHTML = '<div class="mol3d-error">Não foi possível carregar a biblioteca 3D. Confira a versão 2D.</div>';
      return;
    }
    const cid = box.dataset.cid;
    box.innerHTML = '<div class="mol3d-loading">carregando modelo…</div>';
    const failTimer = setTimeout(() => {
      box.innerHTML = '<div class="mol3d-error">Modelo 3D indisponível no momento. Confira a versão 2D.</div>';
    }, 8000);
    try{
      const viewer = $3Dmol.createViewer(box, {backgroundColor:'#FAFCFB'});
      $3Dmol.download('cid:' + cid, viewer, {}, function(){
        clearTimeout(failTimer);
        const loadingMsg = box.querySelector('.mol3d-loading');
        if(loadingMsg) loadingMsg.remove();
        viewer.setStyle({}, {stick:{radius:0.14, colorscheme:'Jmol'}, sphere:{scale:0.28, colorscheme:'Jmol'}});
        viewer.zoomTo();
        viewer.render();
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if(!reduceMotion){
          viewer.spin('y', 0.35);
          const stop = () => viewer.spin(false);
          box.addEventListener('mousedown', stop, {once:true});
          box.addEventListener('touchstart', stop, {once:true, passive:true});
        }
      });
    } catch(err){
      clearTimeout(failTimer);
      box.innerHTML = '<div class="mol3d-error">Modelo 3D indisponível no momento. Confira a versão 2D.</div>';
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if(tab.dataset.target === '3d'){
        panel2d.classList.remove('active');
        panel3d.classList.add('active');
        initViewer();
      } else {
        panel3d.classList.remove('active');
        panel2d.classList.add('active');
      }
    });
  });
});
