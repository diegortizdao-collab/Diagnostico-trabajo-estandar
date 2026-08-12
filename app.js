(function(){
  const root = document.getElementById('dteApp');
  const LOGO_SRC = 'assets/logo.png';
  const FACILITADORES = ['Diego Ortiz', 'Marcos Gómez'];

  // ── Configuración de Supabase ──────────────────────────────────────────
  // Reemplazá estos dos valores por los de tu proyecto:
  // Supabase → Project Settings → API → "Project URL" y "anon public" key.
  // La anon key está pensada para ir en el cliente (no es secreta), pero el
  // acceso real a los datos lo controla la política de RLS que crees en la tabla.
  const SUPABASE_URL = 'https://rrqzrmfttsgbparlhqfz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJycXpybWZ0dHNnYnBhcmxocWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDM4NDcsImV4cCI6MjEwMjExOTg0N30.DSk-_OgYIV3wt5IScu5nXGp5-BryTd_fSZrswQNcyFM';
  const TABLE = 'diagnosticos';

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const M3_OPTIONS = [
    { id:'a', label:'"Le explico cómo se hace y listo."', tag:'N1 · sin método de transmisión', nivel:'N1' },
    { id:'b', label:'"Le muestro yo primero, después que lo haga él y lo corrijo."', tag:'N1 alto · intuición sin estructura', nivel:'N1' },
    { id:'c', label:'Describe preparación, demostración, práctica guiada y seguimiento — aunque no nombre el TJI.', tag:'N2 · lógica TJI presente', nivel:'N2' },
    { id:'d', label:'Menciona TJI, tarjeta de instrucción, o ya entrenó gente con ese esquema.', tag:'N2 confirmado · método instalado', nivel:'N2' },
  ];

  let state = {
    view: 'loading',
    registros: [],
    detailId: null,
    flowStep: 0,
    diag: null,
    filtroFacilitador: 'Todos',
  };

  function todayISO(){
    const d = new Date();
    return d.toISOString().slice(0,10);
  }
  function fmtDate(iso){
    if(!iso) return '';
    const [y,m,d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
  function newDiag(){
    return {
      id: 'd_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      nombre:'', sector:'', rol:'TL', fecha: todayISO(), hte:'', facilitador: FACILITADORES[0],
      m1_reconoce: null, m1_obs:'',
      m2_identifica: null, m2_obs:'',
      m3_opcion: null, m3_obs:'',
      nivel_sugerido: null, nivel_final: null,
      created_at: new Date().toISOString(),
    };
  }

  async function loadRegistros(){
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if(error){
      console.error('Error al cargar diagnósticos:', error);
      state.registros = [];
      state.loadError = error.message;
    }else{
      state.registros = data || [];
      state.loadError = null;
    }
    state.view = 'dashboard';
    render();
  }

  async function insertRegistro(diag){
    const { error } = await supabase.from(TABLE).insert([diag]);
    if(error){
      console.error('No se pudo guardar', error);
      alert('No se pudo guardar el registro: ' + error.message);
      return false;
    }
    return true;
  }

  async function deleteRegistro(id){
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if(error){
      console.error('No se pudo eliminar', error);
      alert('No se pudo eliminar el registro: ' + error.message);
      return false;
    }
    return true;
  }

  function startFlow(){
    state.diag = newDiag();
    state.flowStep = 0;
    state.view = 'flow';
    render();
  }

  function cancelFlow(){
    if(confirm('¿Descartar este diagnóstico en curso?')){
      state.view = 'dashboard';
      state.diag = null;
      render();
    }
  }

  function goResultado(nivel_sugerido){
    state.diag.nivel_sugerido = nivel_sugerido;
    state.diag.nivel_final = nivel_sugerido;
    state.flowStep = 4;
    render();
  }

  async function guardarDiagnostico(){
    const ok = await insertRegistro(state.diag);
    if(!ok) return;
    state.view = 'dashboard';
    state.diag = null;
    await loadRegistros();
  }

  async function borrarRegistro(id){
    if(!confirm('¿Eliminar este registro de forma permanente?')) return;
    const ok = await deleteRegistro(id);
    if(!ok) return;
    state.view = 'dashboard';
    state.detailId = null;
    await loadRegistros();
  }

  function esc(s){
    const d = document.createElement('div');
    d.textContent = s == null ? '' : s;
    return d.innerHTML;
  }

  function render(){
    if(state.view === 'dashboard') return renderDashboard();
    if(state.view === 'flow') return renderFlow();
    if(state.view === 'detail') return renderDetail();
  }

  function bannerHTML(subtitle){
    return `
      <div class="dte-banner">
        <div class="dte-banner-top">
          <div>
            <div class="dte-eyebrow">Programa de Formación de Líderes · Módulo 2 · Trabajo Estándar</div>
            <h1 class="dte-h1">Diagnóstico de nivelación</h1>
            <p class="dte-sub">${subtitle}</p>
          </div>
          <div class="dte-logo-chip"><img src="${LOGO_SRC}" alt="Escorial"/></div>
        </div>
      </div>
    `;
  }

  function renderDashboard(){
    const registrosFiltrados = state.filtroFacilitador === 'Todos'
      ? state.registros
      : state.registros.filter(r => r.facilitador === state.filtroFacilitador);

    const n1 = registrosFiltrados.filter(r => r.nivel_final === 'N1').length;
    const n2 = registrosFiltrados.filter(r => r.nivel_final === 'N2').length;

    let fichas = '';
    if(registrosFiltrados.length === 0){
      fichas = `<div class="dte-empty">${state.registros.length === 0 ? 'Todavía no cargaste ningún diagnóstico.<br>Tocá "Nuevo diagnóstico" para empezar con el primer líder.' : 'No hay diagnósticos de este facilitador.'}</div>`;
    }else{
      fichas = registrosFiltrados.map(r => `
        <div class="dte-ficha ${r.nivel_final ? r.nivel_final.toLowerCase() : ''}" data-id="${r.id}">
          <div class="dte-ficha-main">
            <p class="dte-ficha-name">${esc(r.nombre) || '(sin nombre)'}</p>
            <p class="dte-ficha-meta">${esc(r.sector) || '—'} · ${esc(r.rol)} · ${fmtDate(r.fecha)} · ${esc(r.facilitador)}</p>
          </div>
          <span class="dte-badge ${r.nivel_final ? r.nivel_final.toLowerCase() : ''}">${esc(r.nivel_final) || '—'}</span>
        </div>
      `).join('');
    }

    const errorBanner = state.loadError
      ? `<div class="dte-alert">⚠ No se pudo conectar con Supabase: ${esc(state.loadError)}. Revisá SUPABASE_URL, SUPABASE_ANON_KEY y la política de RLS en app.js.</div>`
      : '';

    root.innerHTML = `
      ${bannerHTML('Registro de conversaciones individuales previas a la Semana 1 — clasificación N1 / N2 según manejo de la HTE.')}
      ${errorBanner}

      <div class="dte-stats">
        <div class="dte-stat"><div class="dte-stat-n">${registrosFiltrados.length}</div><div class="dte-stat-l">Diagnosticados</div></div>
        <div class="dte-stat"><div class="dte-stat-n" style="color:var(--green-soft-ink)">${n1}</div><div class="dte-stat-l">Nivel N1</div></div>
        <div class="dte-stat"><div class="dte-stat-n" style="color:var(--orange-soft-ink)">${n2}</div><div class="dte-stat-l">Nivel N2</div></div>
      </div>

      <div class="dte-filter-row">
        <span class="dte-filter-label">Facilitador:</span>
        <select class="dte-filter-select" id="fFiltro">
          <option value="Todos" ${state.filtroFacilitador==='Todos'?'selected':''}>Todos</option>
          ${FACILITADORES.map(f => `<option value="${f}" ${state.filtroFacilitador===f?'selected':''}>${f}</option>`).join('')}
        </select>
      </div>

      <button class="dte-btn dte-btn-primary dte-btn-block dte-new-btn" id="btnNew">+ Nuevo diagnóstico</button>

      <div id="fichaList">${fichas}</div>

      <p class="dte-share-note">Registro compartido entre Diego Ortiz y Marcos Gómez.</p>
    `;

    document.getElementById('btnNew').onclick = startFlow;
    document.getElementById('fFiltro').onchange = (e) => { state.filtroFacilitador = e.target.value; render(); };
    root.querySelectorAll('.dte-ficha').forEach(el => {
      el.onclick = () => { state.detailId = el.dataset.id; state.view = 'detail'; render(); };
    });
  }

  function renderDetail(){
    const r = state.registros.find(x => x.id === state.detailId);
    if(!r){ state.view = 'dashboard'; return render(); }
    root.innerHTML = `
      ${bannerHTML('Ficha de registro individual')}

      <div class="dte-stamp-wrap">
        <div class="dte-stamp ${r.nivel_final ? r.nivel_final.toLowerCase() : ''}">
          <div class="dte-stamp-level">${esc(r.nivel_final) || '—'}</div>
          <div class="dte-stamp-text">Nivel asignado</div>
          <div class="dte-stamp-date">${fmtDate(r.fecha)}</div>
        </div>
      </div>

      <div class="dte-panel">
        <div class="dte-summary-row"><span class="dte-summary-k">Líder</span><span class="dte-summary-v">${esc(r.nombre) || '(sin nombre)'}</span></div>
        <div class="dte-summary-row"><span class="dte-summary-k">Sector / UET</span><span class="dte-summary-v">${esc(r.sector) || '—'}</span></div>
        <div class="dte-summary-row"><span class="dte-summary-k">Rol</span><span class="dte-summary-v">${esc(r.rol)}</span></div>
        <div class="dte-summary-row"><span class="dte-summary-k">Facilitador</span><span class="dte-summary-v">${esc(r.facilitador)}</span></div>
        <div class="dte-summary-row"><span class="dte-summary-k">HTE utilizada</span><span class="dte-summary-v">${esc(r.hte) || '—'}</span></div>
        <div class="dte-summary-row" style="margin-top:8px"><span class="dte-summary-k">M1 · Reconoce la HTE</span><span class="dte-summary-v">${r.m1_reconoce === null ? '—' : (r.m1_reconoce ? 'Sí' : 'No')}</span></div>
        ${r.m1_obs ? `<div class="dte-detail-obs">${esc(r.m1_obs)}</div>` : ''}
        <div class="dte-summary-row" style="margin-top:8px"><span class="dte-summary-k">M2 · Identifica el QCP</span><span class="dte-summary-v">${r.m2_identifica === null ? '—' : (r.m2_identifica ? 'Sí' : 'No')}</span></div>
        ${r.m2_obs ? `<div class="dte-detail-obs">${esc(r.m2_obs)}</div>` : ''}
        <div class="dte-summary-row" style="margin-top:8px"><span class="dte-summary-k">M3 · Transmisión</span><span class="dte-summary-v">${r.m3_opcion ? M3_OPTIONS.find(o=>o.id===r.m3_opcion).tag : '—'}</span></div>
        ${r.m3_obs ? `<div class="dte-detail-obs">${esc(r.m3_obs)}</div>` : ''}
      </div>

      <div class="dte-nav">
        <button class="dte-btn dte-btn-ghost" id="btnBack">← Volver</button>
        <button class="dte-btn dte-btn-danger" id="btnDelete">Eliminar registro</button>
      </div>
    `;
    document.getElementById('btnBack').onclick = () => { state.view='dashboard'; render(); };
    document.getElementById('btnDelete').onclick = () => borrarRegistro(r.id);
  }

  function stepColor(i){
    return ['var(--ink-faint)', 'var(--blue)', 'var(--teal)', 'var(--navy)', 'var(--orange)'][i];
  }

  function stepperHTML(){
    const labels = ['Datos', 'M1 Reconocimiento', 'M2 Lectura', 'M3 Transmisión', 'Resultado'];
    return `<div class="dte-steps">${labels.map((l,i) => {
      let cls = '';
      if(i === state.flowStep) cls = 'active';
      else if(i < state.flowStep) cls = 'done';
      return `<div class="dte-step ${cls}" style="--step-color:${stepColor(i)}">${i+1}. ${l}</div>`;
    }).join('')}</div>`;
  }

  function renderFlow(){
    const d = state.diag;
    let body = '';

    if(state.flowStep === 0){
      body = `
        <div class="dte-panel">
          <div class="dte-field">
            <label class="dte-label">Nombre del líder</label>
            <input class="dte-input" id="fNombre" value="${esc(d.nombre)}" placeholder="Nombre y apellido"/>
          </div>
          <div class="dte-row2">
            <div class="dte-field">
              <label class="dte-label">Sector / UET</label>
              <input class="dte-input" id="fSector" value="${esc(d.sector)}" placeholder="Ej: Armado Camisa"/>
            </div>
            <div class="dte-field">
              <label class="dte-label">Rol</label>
              <select class="dte-select" id="fRol">
                <option value="TL" ${d.rol==='TL'?'selected':''}>TL</option>
                <option value="GL" ${d.rol==='GL'?'selected':''}>GL</option>
              </select>
            </div>
          </div>
          <div class="dte-row2">
            <div class="dte-field">
              <label class="dte-label">Fecha</label>
              <input class="dte-input" type="date" id="fFecha" value="${d.fecha}"/>
            </div>
            <div class="dte-field">
              <label class="dte-label">Facilitador</label>
              <select class="dte-select" id="fFacilitador">
                ${FACILITADORES.map(f => `<option value="${f}" ${d.facilitador===f?'selected':''}>${f}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="dte-field">
            <label class="dte-label">HTE utilizada</label>
            <input class="dte-input" id="fHte" value="${esc(d.hte)}" placeholder="Código o descripción de la HTE"/>
          </div>
        </div>
        <div class="dte-nav">
          <button class="dte-btn dte-btn-ghost" id="btnCancel">Cancelar</button>
          <button class="dte-btn dte-btn-primary" id="btnNext">Comenzar Momento 1 →</button>
        </div>
      `;
      root.innerHTML = stepperHTML() + body;
      document.getElementById('btnCancel').onclick = cancelFlow;
      document.getElementById('btnNext').onclick = () => {
        d.nombre = document.getElementById('fNombre').value.trim();
        d.sector = document.getElementById('fSector').value.trim();
        d.rol = document.getElementById('fRol').value;
        d.fecha = document.getElementById('fFecha').value || todayISO();
        d.facilitador = document.getElementById('fFacilitador').value;
        d.hte = document.getElementById('fHte').value.trim();
        if(!d.nombre){ alert('Ingresá el nombre del líder para continuar.'); return; }
        state.flowStep = 1;
        render();
      };
      return;
    }

    if(state.flowStep === 1){
      body = `
        <div class="dte-question-box">
          <p>"¿Qué es esto?" — mostrarle la HTE</p>
          <p>"¿Para qué sirve?"</p>
          <p>"¿La usás en el día a día? ¿Cuándo?"</p>
        </div>
        <div class="dte-choice-grid">
          <label class="dte-choice ${d.m1_reconoce===true?'selected':''}">
            <input type="radio" name="m1" value="si" ${d.m1_reconoce===true?'checked':''}/>
            <span class="dte-choice-label">Reconoce la HTE y puede explicar para qué sirve</span>
          </label>
          <label class="dte-choice ${d.m1_reconoce===false?'selected':''}">
            <input type="radio" name="m1" value="no" ${d.m1_reconoce===false?'checked':''}/>
            <span class="dte-choice-label">No la reconoce o no puede explicar para qué sirve <span class="dte-choice-tag n1">→ N1 directo</span></span>
          </label>
        </div>
        <div class="dte-field">
          <label class="dte-label">Observaciones</label>
          <textarea class="dte-textarea" id="fM1Obs" placeholder="Notas de la conversación...">${esc(d.m1_obs)}</textarea>
        </div>
        <div class="dte-nav">
          <button class="dte-btn dte-btn-ghost" id="btnBack">← Atrás</button>
          <button class="dte-btn dte-btn-primary" id="btnNext">Continuar →</button>
        </div>
      `;
      root.innerHTML = stepperHTML() + body;
      root.querySelectorAll('input[name="m1"]').forEach(inp => {
        inp.onchange = () => { d.m1_reconoce = inp.value === 'si'; render(); };
      });
      document.getElementById('btnBack').onclick = () => { state.flowStep = 0; render(); };
      document.getElementById('btnNext').onclick = () => {
        d.m1_obs = document.getElementById('fM1Obs').value.trim();
        if(d.m1_reconoce === null){ alert('Marcá una opción para continuar.'); return; }
        if(d.m1_reconoce === false){ goResultado('N1'); return; }
        state.flowStep = 2;
        render();
      };
      return;
    }

    if(state.flowStep === 2){
      body = `
        <div class="dte-question-box">
          <p>"Señalame en esta HTE el paso que considera más riesgoso."</p>
          <p>"¿Cuál es el punto clave de ese paso?"</p>
          <p>"¿Por qué existe ese punto clave? ¿Qué pasaría si no se respeta?"</p>
        </div>
        <div class="dte-choice-grid">
          <label class="dte-choice ${d.m2_identifica===true?'selected':''}">
            <input type="radio" name="m2" value="si" ${d.m2_identifica===true?'checked':''}/>
            <span class="dte-choice-label">Identifica el punto clave (QCP) y explica la razón</span>
          </label>
          <label class="dte-choice ${d.m2_identifica===false?'selected':''}">
            <input type="radio" name="m2" value="no" ${d.m2_identifica===false?'checked':''}/>
            <span class="dte-choice-label">No identifica el punto clave o confunde columnas <span class="dte-choice-tag n1">→ N1</span></span>
          </label>
        </div>
        <div class="dte-field">
          <label class="dte-label">Observaciones</label>
          <textarea class="dte-textarea" id="fM2Obs" placeholder="Notas de la conversación...">${esc(d.m2_obs)}</textarea>
        </div>
        <div class="dte-nav">
          <button class="dte-btn dte-btn-ghost" id="btnBack">← Atrás</button>
          <button class="dte-btn dte-btn-primary" id="btnNext">Continuar →</button>
        </div>
      `;
      root.innerHTML = stepperHTML() + body;
      root.querySelectorAll('input[name="m2"]').forEach(inp => {
        inp.onchange = () => { d.m2_identifica = inp.value === 'si'; render(); };
      });
      document.getElementById('btnBack').onclick = () => { state.flowStep = 1; render(); };
      document.getElementById('btnNext').onclick = () => {
        d.m2_obs = document.getElementById('fM2Obs').value.trim();
        if(d.m2_identifica === null){ alert('Marcá una opción para continuar.'); return; }
        if(d.m2_identifica === false){ goResultado('N1'); return; }
        state.flowStep = 3;
        render();
      };
      return;
    }

    if(state.flowStep === 3){
      body = `
        <div class="dte-question-box">
          <p><b>"Entra un operario nuevo a tu sector mañana. Tenés que enseñarle este proceso usando esta HTE. ¿Cómo lo harías?"</b></p>
          <p>Dejar que describa con sus palabras. No interrumpir ni guiar.</p>
        </div>
        <div class="dte-field">
          <label class="dte-label">Transcripción / descripción de la respuesta</label>
          <textarea class="dte-textarea" id="fM3Obs" placeholder="Registrá lo que dice el líder, con sus palabras...">${esc(d.m3_obs)}</textarea>
        </div>
        <div class="dte-choice-grid">
          ${M3_OPTIONS.map(o => `
            <label class="dte-choice ${d.m3_opcion===o.id?'selected':''}">
              <input type="radio" name="m3" value="${o.id}" ${d.m3_opcion===o.id?'checked':''}/>
              <span class="dte-choice-label">${o.label}<br/><span class="dte-choice-tag ${o.nivel.toLowerCase()}">${o.tag}</span></span>
            </label>
          `).join('')}
        </div>
        <div class="dte-nav">
          <button class="dte-btn dte-btn-ghost" id="btnBack">← Atrás</button>
          <button class="dte-btn dte-btn-primary" id="btnNext">Ver resultado →</button>
        </div>
      `;
      root.innerHTML = stepperHTML() + body;
      root.querySelectorAll('input[name="m3"]').forEach(inp => {
        inp.onchange = () => { d.m3_opcion = inp.value; render(); };
      });
      document.getElementById('btnBack').onclick = () => { state.flowStep = 2; render(); };
      document.getElementById('btnNext').onclick = () => {
        d.m3_obs = document.getElementById('fM3Obs').value.trim();
        if(!d.m3_opcion){ alert('Elegí la opción que mejor describe la respuesta del líder.'); return; }
        const opt = M3_OPTIONS.find(o => o.id === d.m3_opcion);
        goResultado(opt.nivel);
      };
      return;
    }

    if(state.flowStep === 4){
      const dudaAlert = (d.m3_opcion === 'b')
        ? `<div class="dte-alert">⚠ Regla de duda: la respuesta "me muestro yo, después lo hace y corrijo" es intuición sin estructura — caso límite entre N1 y N2. Ante la duda, asignar N1. Podés revisar esta asignación hasta el final de la Semana 1.</div>`
        : '';
      body = `
        <div class="dte-stamp-wrap">
          <div class="dte-stamp ${d.nivel_final.toLowerCase()}" id="stampEl">
            <div class="dte-stamp-level">${d.nivel_final}</div>
            <div class="dte-stamp-text">Nivel asignado</div>
            <div class="dte-stamp-date">${fmtDate(d.fecha)}</div>
          </div>
        </div>
        <p style="text-align:center;font-size:12.5px;color:var(--ink-soft);margin-top:0;">Sugerido por el diagnóstico: <b>${d.nivel_sugerido}</b></p>
        ${dudaAlert}
        <div class="dte-toggle-level">
          <button class="dte-toggle-btn n1 ${d.nivel_final==='N1'?'active':''}" id="btnN1">N1 — Inicial</button>
          <button class="dte-toggle-btn n2 ${d.nivel_final==='N2'?'active':''}" id="btnN2">N2 — Intermedio</button>
        </div>

        <div class="dte-panel" style="margin-top:18px">
          <div class="dte-summary-row"><span class="dte-summary-k">Líder</span><span class="dte-summary-v">${esc(d.nombre)}</span></div>
          <div class="dte-summary-row"><span class="dte-summary-k">Sector / UET</span><span class="dte-summary-v">${esc(d.sector) || '—'}</span></div>
          <div class="dte-summary-row"><span class="dte-summary-k">Rol</span><span class="dte-summary-v">${esc(d.rol)}</span></div>
          <div class="dte-summary-row"><span class="dte-summary-k">Fecha</span><span class="dte-summary-v">${fmtDate(d.fecha)}</span></div>
          <div class="dte-summary-row"><span class="dte-summary-k">HTE</span><span class="dte-summary-v">${esc(d.hte) || '—'}</span></div>
          <div class="dte-summary-row"><span class="dte-summary-k">Facilitador</span><span class="dte-summary-v">${esc(d.facilitador)}</span></div>
        </div>

        <div class="dte-nav">
          <button class="dte-btn dte-btn-ghost" id="btnBack">← Revisar Momento 3</button>
          <button class="dte-btn dte-btn-primary" id="btnGuardar">Guardar registro</button>
        </div>
      `;
      root.innerHTML = stepperHTML() + body;
      document.getElementById('btnN1').onclick = () => { d.nivel_final = 'N1'; render(); };
      document.getElementById('btnN2').onclick = () => { d.nivel_final = 'N2'; render(); };
      document.getElementById('btnBack').onclick = () => { state.flowStep = 3; render(); };
      document.getElementById('btnGuardar').onclick = guardarDiagnostico;
      return;
    }
  }

  loadRegistros();
})();
