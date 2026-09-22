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

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ── Configuración de cada módulo de diagnóstico ────────────────────────
  // Cada módulo define su tabla de Supabase, sus niveles, sus 3 momentos y
  // la lógica de corte de cada uno. El motor de abajo (render / flujo /
  // guardado) es el mismo para todos los módulos que se agreguen acá.
  const MODULES = {
    te: {
      key: 'te',
      nombre: 'Trabajo Estándar',
      descCard: 'Reconocimiento, lectura y transmisión de la HTE. Clasifica N1 / N2.',
      eyebrow: 'Programa de Formación de Líderes · Módulo 2 · Trabajo Estándar',
      subDashboard: 'Registro de conversaciones individuales previas a la Semana 1 — clasificación N1 / N2 según manejo de la HTE.',
      subDetail: 'Ficha de registro individual',
      table: 'diagnosticos',
      niveles: [
        { code: 'N1', label: 'Inicial' },
        { code: 'N2', label: 'Intermedio' },
      ],
      extraField: { id: 'hte', label: 'HTE utilizada', placeholder: 'Código o descripción de la HTE' },
      momentoLabels: ['Datos', 'M1 Reconocimiento', 'M2 Lectura', 'M3 Transmisión', 'Resultado'],
      instrucciones: null,
      m1: {
        field: 'm1_reconoce', obsField: 'm1_obs', tiempo: null,
        preguntas: [
          '"¿Qué es esto?" — mostrarle la HTE',
          '"¿Para qué sirve?"',
          '"¿La usás en el día a día? ¿Cuándo?"',
        ],
        choiceSi: 'Reconoce la HTE y puede explicar para qué sirve',
        choiceNo: 'No la reconoce o no puede explicar para qué sirve',
        tagCorte: '→ N1 directo',
      },
      m2: {
        field: 'm2_identifica', obsField: 'm2_obs', tiempo: null,
        preguntas: [
          '"Señalame en esta HTE el paso que considera más riesgoso."',
          '"¿Cuál es el punto clave de ese paso?"',
          '"¿Por qué existe ese punto clave? ¿Qué pasaría si no se respeta?"',
        ],
        choiceSi: 'Identifica el punto clave (QCP) y explica la razón',
        choiceNo: 'No identifica el punto clave o confunde columnas',
        tagCorte: '→ N1',
      },
      m3: {
        field: 'm3_opcion', obsField: 'm3_obs', tiempo: null,
        intro: [
          '<b>"Entra un operario nuevo a tu sector mañana. Tenés que enseñarle este proceso usando esta HTE. ¿Cómo lo harías?"</b>',
          'Dejar que describa con sus palabras. No interrumpir ni guiar.',
        ],
        obsLabel: 'Transcripción / descripción de la respuesta',
        obsPlaceholder: 'Registrá lo que dice el líder, con sus palabras...',
        options: [
          { id: 'a', label: '"Le explico cómo se hace y listo."', tag: 'N1 · sin método de transmisión', nivel: 'N1' },
          { id: 'b', label: '"Le muestro yo primero, después que lo haga él y lo corrijo."', tag: 'N1 alto · intuición sin estructura', nivel: 'N1' },
          { id: 'c', label: 'Describe preparación, demostración, práctica guiada y seguimiento — aunque no nombre el TJI.', tag: 'N2 · lógica TJI presente', nivel: 'N2' },
          { id: 'd', label: 'Menciona TJI, tarjeta de instrucción, o ya entrenó gente con ese esquema.', tag: 'N2 confirmado · método instalado', nivel: 'N2' },
        ],
        regla: null,
      },
      dudaAlert(d) {
        if (d.m3_opcion !== 'b') return null;
        return 'Regla de duda: la respuesta "me muestro yo, después lo hace y corrijo" es intuición sin estructura — caso límite entre N1 y N2. Ante la duda, asignar N1. Podés revisar esta asignación hasta el final de la Semana 1.';
      },
    },

    cinco_s: {
      key: 'cinco_s',
      nombre: '5S',
      descCard: 'Hacer, controlar y liderar el orden del sector. Clasifica N1 / N2 / N3.',
      eyebrow: 'Programa de Formación de Líderes · Módulo 3 · 5S',
      subDashboard: 'Registro de conversaciones individuales previas al Encuentro 1 — clasificación N1 / N2 / N3 según manejo de 5S.',
      subDetail: 'Ficha de registro individual',
      table: 'diagnosticos_5s',
      niveles: [
        { code: 'N1', label: 'Hacer' },
        { code: 'N2', label: 'Controlar' },
        { code: 'N3', label: 'Liderar' },
      ],
      extraField: null,
      momentoLabels: ['Datos', 'M1 Hacer', 'M2 Controlar', 'M3 Liderar', 'Resultado'],
      instrucciones: [
        'Hacer el diagnóstico en el propio puesto del líder si es posible, o con una foto reciente de su sector — no en el aula.',
        'Llevar la planilla de auditoría 5S del SPE para el Momento 2.',
        'No anticipar cuál es la respuesta correcta. Escuchar y observar.',
        'Recordar al líder: "Es para entender de dónde arrancamos — no hay respuesta correcta o incorrecta."',
      ],
      m1: {
        field: 'm1_reconoce', obsField: 'm1_obs', tiempo: '5 min',
        preguntas: [
          '"¿Podés nombrarme los 5 pilares de 5S?" — sin ayuda',
          '"Mostrame tu puesto de trabajo: ¿qué de esto responde a cada pilar?"',
          '"¿Hace cuánto tu puesto está así? ¿Lo mantenés vos o alguien más lo ordena?"',
        ],
        choiceSi: 'Reconoce los 5 pilares y su puesto los refleja',
        choiceNo: 'No reconoce los pilares o su puesto no los refleja',
        tagCorte: '→ N1 directo',
      },
      m2: {
        field: 'm2_audita', obsField: 'm2_obs', tiempo: '7 min',
        preguntas: [
          '"¿Alguna vez auditaste 5S en otro puesto o sector, más allá del tuyo?"',
          'Mostrar la planilla de auditoría formal: "¿La conocés? ¿La usaste?"',
          '"¿Tu sector se mantiene ordenado todas las semanas, o depende de que alguien lo recuerde?"',
        ],
        choiceSi: 'Audita con la herramienta formal y sostiene su sector con autonomía',
        choiceNo: 'No audita con la herramienta formal o el sostenimiento depende de recordatorios externos',
        tagCorte: '→ N1',
      },
      m3: {
        field: 'm3_opcion', obsField: 'm3_obs', tiempo: '6 min',
        intro: [
          '<b>"Tenés que desplegar el plan de 5S de la planta con todo tu equipo esta semana. ¿Cómo lo organizás?"</b>',
          'Dejar que describa con sus palabras. No interrumpir ni guiar.',
        ],
        obsLabel: 'Transcripción / descripción de la respuesta',
        obsPlaceholder: 'Registrá lo que dice el líder, con sus palabras...',
        options: [
          { id: 'a', label: '"Lo hago yo mismo y después les cuento" — o no logra describir un plan de acción con el equipo', tag: 'N2 · ejecuta, no delega', nivel: 'N2' },
          { id: 'b', label: 'Describe reparto de tareas por persona, pero sin mencionar seguimiento ni motivación del equipo', tag: 'N2 alto · organiza, no lidera aún', nivel: 'N2' },
          { id: 'c', label: 'Describe naturalmente: organiza tareas, asigna responsables, define fechas y cómo va a sostener el compromiso del grupo', tag: 'N3 · lógica de liderazgo presente', nivel: 'N3' },
          { id: 'd', label: 'Ya lideró una implementación real de 5S con su equipo (aunque no haya sido formal) y puede contar cómo sostuvo el compromiso', tag: 'N3 confirmado · liderazgo ya ejercido', nivel: 'N3' },
        ],
        regla: 'La diferencia entre N2 y N3 no es cuánto sabe de 5S — es si puede movilizar a su gente para sostenerlo. Un líder que audita perfecto pero organiza solo, sin delegar ni motivar al equipo, es N2. Liderar personas es exactamente lo que viene a desarrollar en N3.',
      },
      dudaAlert() {
        return 'Regla de duda: ante cualquier caso límite entre dos niveles, asignar el menor. El salto a N3 en particular requiere evidencia clara de liderazgo de personas — no alcanza con buen desempeño técnico en 5S. El facilitador puede revisar la asignación hasta el final de la Semana 1, no después.';
      },
    },
  };

  let state = {
    view: 'selector', // selector | loading | dashboard | flow | detail
    modulo: null,
    registros: [],
    loadError: null,
    detailId: null,
    flowStep: 0,
    diag: null,
    filtroFacilitador: 'Todos',
  };

  function cfg() { return MODULES[state.modulo]; }

  function todayISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }
  function fmtDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : s;
    return d.innerHTML;
  }

  function newDiag() {
    const c = cfg();
    const d = {
      id: 'd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nombre: '', sector: '', rol: 'TL', fecha: todayISO(), facilitador: FACILITADORES[0],
      nivel_sugerido: null, nivel_final: null,
      created_at: new Date().toISOString(),
    };
    if (c.extraField) d[c.extraField.id] = '';
    d[c.m1.field] = null; d[c.m1.obsField] = '';
    d[c.m2.field] = null; d[c.m2.obsField] = '';
    d[c.m3.field] = null; d[c.m3.obsField] = '';
    return d;
  }

  // ── Selector de módulo ─────────────────────────────────────────────────
  function irASelector() {
    state.view = 'selector';
    state.modulo = null;
    state.registros = [];
    state.loadError = null;
    render();
  }

  function volverAlSelector() {
    if (state.view === 'flow') {
      if (!confirm('¿Descartar este diagnóstico en curso y volver a elegir módulo?')) return;
    }
    irASelector();
  }

  function seleccionarModulo(key) {
    state.modulo = key;
    state.view = 'loading';
    state.filtroFacilitador = 'Todos';
    render();
    loadRegistros();
  }

  function renderSelector() {
    const cards = Object.values(MODULES).map(m => `
      <div class="dte-modulo-card" data-modulo="${m.key}">
        <div class="dte-modulo-name">${esc(m.nombre)}</div>
        <div class="dte-modulo-desc">${esc(m.descCard)}</div>
        <div class="dte-modulo-niveles">${m.niveles.map(n => `<span class="dte-badge ${n.code.toLowerCase()}">${n.code}</span>`).join('')}</div>
        <div class="dte-modulo-cta">Entrar →</div>
      </div>
    `).join('');

    root.innerHTML = `
      <div class="dte-banner">
        <div class="dte-banner-top">
          <div>
            <div class="dte-eyebrow">Programa de Formación de Líderes</div>
            <h1 class="dte-h1">Diagnósticos de nivelación</h1>
            <p class="dte-sub">Elegí el módulo para ver el registro o cargar un nuevo diagnóstico.</p>
          </div>
          <div class="dte-logo-chip"><img src="${LOGO_SRC}" alt="Escorial"/></div>
        </div>
      </div>
      <div class="dte-selector-grid">${cards}</div>
    `;
    root.querySelectorAll('.dte-modulo-card').forEach(el => {
      el.onclick = () => seleccionarModulo(el.dataset.modulo);
    });
  }

  // ── Carga / guardado ────────────────────────────────────────────────────
  async function loadRegistros() {
    const c = cfg();
    const { data, error } = await supabase
      .from(c.table)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error al cargar diagnósticos:', error);
      state.registros = [];
      state.loadError = error.message;
    } else {
      state.registros = data || [];
      state.loadError = null;
    }
    state.view = 'dashboard';
    render();
  }

  async function insertRegistro(diag) {
    const c = cfg();
    const { error } = await supabase.from(c.table).insert([diag]);
    if (error) {
      console.error('No se pudo guardar', error);
      alert('No se pudo guardar el registro: ' + error.message);
      return false;
    }
    return true;
  }

  async function deleteRegistro(id) {
    const c = cfg();
    const { error } = await supabase.from(c.table).delete().eq('id', id);
    if (error) {
      console.error('No se pudo eliminar', error);
      alert('No se pudo eliminar el registro: ' + error.message);
      return false;
    }
    return true;
  }

  function startFlow() {
    state.diag = newDiag();
    state.flowStep = 0;
    state.view = 'flow';
    render();
  }

  function cancelFlow() {
    if (confirm('¿Descartar este diagnóstico en curso?')) {
      state.view = 'dashboard';
      state.diag = null;
      render();
    }
  }

  function goResultado(nivel_sugerido) {
    state.diag.nivel_sugerido = nivel_sugerido;
    state.diag.nivel_final = nivel_sugerido;
    state.flowStep = 4;
    render();
  }

  async function guardarDiagnostico() {
    const ok = await insertRegistro(state.diag);
    if (!ok) return;
    state.view = 'dashboard';
    state.diag = null;
    await loadRegistros();
  }

  async function borrarRegistro(id) {
    if (!confirm('¿Eliminar este registro de forma permanente?')) return;
    const ok = await deleteRegistro(id);
    if (!ok) return;
    state.view = 'dashboard';
    state.detailId = null;
    await loadRegistros();
  }

  // ── Render ──────────────────────────────────────────────────────────────
  function render() {
    if (state.view === 'selector') return renderSelector();
    if (state.view === 'loading') return renderLoading();
    if (state.view === 'dashboard') return renderDashboard();
    if (state.view === 'flow') return renderFlow();
    if (state.view === 'detail') return renderDetail();
  }

  function renderLoading() {
    root.innerHTML = `<div class="dte-loading">Cargando diagnósticos…</div>`;
  }

  function backLinkHTML() {
    return `<button class="dte-back-link" id="btnVolverSelector">← Cambiar de módulo</button>`;
  }

  function bindBackLink() {
    const el = document.getElementById('btnVolverSelector');
    if (el) el.onclick = volverAlSelector;
  }

  function bannerHTML(subtitle) {
    const c = cfg();
    return `
      <div class="dte-banner">
        <div class="dte-banner-top">
          <div>
            <div class="dte-eyebrow">${esc(c.eyebrow)}</div>
            <h1 class="dte-h1">Diagnóstico de nivelación</h1>
            <p class="dte-sub">${subtitle}</p>
          </div>
          <div class="dte-logo-chip"><img src="${LOGO_SRC}" alt="Escorial"/></div>
        </div>
      </div>
    `;
  }

  function renderDashboard() {
    const c = cfg();
    const registrosFiltrados = state.filtroFacilitador === 'Todos'
      ? state.registros
      : state.registros.filter(r => r.facilitador === state.filtroFacilitador);

    const statTiles = c.niveles.map(n => {
      const count = registrosFiltrados.filter(r => r.nivel_final === n.code).length;
      return `<div class="dte-stat"><div class="dte-stat-n dte-stat-${n.code.toLowerCase()}">${count}</div><div class="dte-stat-l">Nivel ${n.code}</div></div>`;
    }).join('');

    let fichas = '';
    if (registrosFiltrados.length === 0) {
      fichas = `<div class="dte-empty">${state.registros.length === 0 ? 'Todavía no cargaste ningún diagnóstico.<br>Tocá "Nuevo diagnóstico" para empezar con el primer líder.' : 'No hay diagnósticos de este facilitador.'}</div>`;
    } else {
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
      ? `<div class="dte-alert">⚠ No se pudo conectar con Supabase: ${esc(state.loadError)}. Revisá SUPABASE_URL, SUPABASE_ANON_KEY y que exista la tabla "${esc(c.table)}" con su política de RLS en app.js.</div>`
      : '';

    root.innerHTML = `
      ${backLinkHTML()}
      ${bannerHTML(c.subDashboard)}
      ${errorBanner}

      <div class="dte-stats">
        <div class="dte-stat"><div class="dte-stat-n">${registrosFiltrados.length}</div><div class="dte-stat-l">Diagnosticados</div></div>
        ${statTiles}
      </div>

      <div class="dte-filter-row">
        <span class="dte-filter-label">Facilitador:</span>
        <select class="dte-filter-select" id="fFiltro">
          <option value="Todos" ${state.filtroFacilitador === 'Todos' ? 'selected' : ''}>Todos</option>
          ${FACILITADORES.map(f => `<option value="${f}" ${state.filtroFacilitador === f ? 'selected' : ''}>${f}</option>`).join('')}
        </select>
      </div>

      <button class="dte-btn dte-btn-primary dte-btn-block dte-new-btn" id="btnNew">+ Nuevo diagnóstico</button>

      <div id="fichaList">${fichas}</div>

      <p class="dte-share-note">Registro compartido entre Diego Ortiz y Marcos Gómez.</p>
    `;

    bindBackLink();
    document.getElementById('btnNew').onclick = startFlow;
    document.getElementById('fFiltro').onchange = (e) => { state.filtroFacilitador = e.target.value; render(); };
    root.querySelectorAll('.dte-ficha').forEach(el => {
      el.onclick = () => { state.detailId = el.dataset.id; state.view = 'detail'; render(); };
    });
  }

  function renderDetail() {
    const c = cfg();
    const r = state.registros.find(x => x.id === state.detailId);
    if (!r) { state.view = 'dashboard'; return render(); }
    const opt = c.m3.options.find(o => o.id === r[c.m3.field]);
    root.innerHTML = `
      ${backLinkHTML()}
      ${bannerHTML(c.subDetail)}

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
        ${c.extraField ? `<div class="dte-summary-row"><span class="dte-summary-k">${esc(c.extraField.label)}</span><span class="dte-summary-v">${esc(r[c.extraField.id]) || '—'}</span></div>` : ''}
        <div class="dte-summary-row" style="margin-top:8px"><span class="dte-summary-k">M1</span><span class="dte-summary-v">${r[c.m1.field] === null ? '—' : (r[c.m1.field] ? 'Sí' : 'No')}</span></div>
        ${r[c.m1.obsField] ? `<div class="dte-detail-obs">${esc(r[c.m1.obsField])}</div>` : ''}
        <div class="dte-summary-row" style="margin-top:8px"><span class="dte-summary-k">M2</span><span class="dte-summary-v">${r[c.m2.field] === null ? '—' : (r[c.m2.field] ? 'Sí' : 'No')}</span></div>
        ${r[c.m2.obsField] ? `<div class="dte-detail-obs">${esc(r[c.m2.obsField])}</div>` : ''}
        <div class="dte-summary-row" style="margin-top:8px"><span class="dte-summary-k">M3</span><span class="dte-summary-v">${opt ? opt.tag : '—'}</span></div>
        ${r[c.m3.obsField] ? `<div class="dte-detail-obs">${esc(r[c.m3.obsField])}</div>` : ''}
      </div>

      <div class="dte-nav">
        <button class="dte-btn dte-btn-ghost" id="btnBack">← Volver</button>
        <button class="dte-btn dte-btn-danger" id="btnDelete">Eliminar registro</button>
      </div>
    `;
    bindBackLink();
    document.getElementById('btnBack').onclick = () => { state.view = 'dashboard'; render(); };
    document.getElementById('btnDelete').onclick = () => borrarRegistro(r.id);
  }

  function stepColor(i) {
    return ['var(--ink-faint)', 'var(--blue)', 'var(--teal)', 'var(--navy)', 'var(--orange)'][i];
  }

  function stepperHTML() {
    const labels = cfg().momentoLabels;
    return `<div class="dte-steps">${labels.map((l, i) => {
      let cls = '';
      if (i === state.flowStep) cls = 'active';
      else if (i < state.flowStep) cls = 'done';
      return `<div class="dte-step ${cls}" style="--step-color:${stepColor(i)}">${i + 1}. ${l}</div>`;
    }).join('')}</div>`;
  }

  function tiempoTagHTML(tiempo) {
    return tiempo ? `<div class="dte-tiempo-tag">⏱ ${esc(tiempo)}</div>` : '';
  }

  function renderFlow() {
    const c = cfg();
    const d = state.diag;
    let body = '';

    if (state.flowStep === 0) {
      const instruccionesBox = c.instrucciones ? `
        <div class="dte-question-box">
          <p><b>Antes de empezar</b></p>
          ${c.instrucciones.map(t => `<p>${t}</p>`).join('')}
        </div>
      ` : '';
      body = `
        ${instruccionesBox}
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
                <option value="TL" ${d.rol === 'TL' ? 'selected' : ''}>TL</option>
                <option value="GL" ${d.rol === 'GL' ? 'selected' : ''}>GL</option>
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
                ${FACILITADORES.map(f => `<option value="${f}" ${d.facilitador === f ? 'selected' : ''}>${f}</option>`).join('')}
              </select>
            </div>
          </div>
          ${c.extraField ? `
          <div class="dte-field">
            <label class="dte-label">${esc(c.extraField.label)}</label>
            <input class="dte-input" id="fExtra" value="${esc(d[c.extraField.id])}" placeholder="${esc(c.extraField.placeholder)}"/>
          </div>` : ''}
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
        if (c.extraField) d[c.extraField.id] = document.getElementById('fExtra').value.trim();
        if (!d.nombre) { alert('Ingresá el nombre del líder para continuar.'); return; }
        state.flowStep = 1;
        render();
      };
      return;
    }

    if (state.flowStep === 1 || state.flowStep === 2) {
      const m = state.flowStep === 1 ? c.m1 : c.m2;
      const inputName = state.flowStep === 1 ? 'm1' : 'm2';
      body = `
        ${tiempoTagHTML(m.tiempo)}
        <div class="dte-question-box">
          ${m.preguntas.map(p => `<p>${p}</p>`).join('')}
        </div>
        <div class="dte-choice-grid">
          <label class="dte-choice ${d[m.field] === true ? 'selected' : ''}">
            <input type="radio" name="${inputName}" value="si" ${d[m.field] === true ? 'checked' : ''}/>
            <span class="dte-choice-label">${esc(m.choiceSi)}</span>
          </label>
          <label class="dte-choice ${d[m.field] === false ? 'selected' : ''}">
            <input type="radio" name="${inputName}" value="no" ${d[m.field] === false ? 'checked' : ''}/>
            <span class="dte-choice-label">${esc(m.choiceNo)} <span class="dte-choice-tag n1">${m.tagCorte}</span></span>
          </label>
        </div>
        <div class="dte-field">
          <label class="dte-label">Observaciones</label>
          <textarea class="dte-textarea" id="fObs">${esc(d[m.obsField])}</textarea>
        </div>
        <div class="dte-nav">
          <button class="dte-btn dte-btn-ghost" id="btnBack">← Atrás</button>
          <button class="dte-btn dte-btn-primary" id="btnNext">Continuar →</button>
        </div>
      `;
      root.innerHTML = stepperHTML() + body;
      root.querySelectorAll(`input[name="${inputName}"]`).forEach(inp => {
        inp.onchange = () => { d[m.field] = inp.value === 'si'; render(); };
      });
      document.getElementById('btnBack').onclick = () => { state.flowStep = state.flowStep - 1; render(); };
      document.getElementById('btnNext').onclick = () => {
        d[m.obsField] = document.getElementById('fObs').value.trim();
        if (d[m.field] === null) { alert('Marcá una opción para continuar.'); return; }
        if (d[m.field] === false) { goResultado('N1'); return; }
        state.flowStep = state.flowStep + 1;
        render();
      };
      return;
    }

    if (state.flowStep === 3) {
      const m = c.m3;
      const reglaBox = m.regla ? `
        <div class="dte-regla-box">
          <div class="dte-regla-icon">🎯</div>
          <div class="dte-regla-text">${m.regla}</div>
        </div>
      ` : '';
      body = `
        ${tiempoTagHTML(m.tiempo)}
        <div class="dte-question-box">
          ${m.intro.map(p => `<p>${p}</p>`).join('')}
        </div>
        <div class="dte-field">
          <label class="dte-label">${esc(m.obsLabel)}</label>
          <textarea class="dte-textarea" id="fM3Obs" placeholder="${esc(m.obsPlaceholder)}">${esc(d[m.obsField])}</textarea>
        </div>
        <div class="dte-choice-grid">
          ${m.options.map(o => `
            <label class="dte-choice ${d[m.field] === o.id ? 'selected' : ''}">
              <input type="radio" name="m3" value="${o.id}" ${d[m.field] === o.id ? 'checked' : ''}/>
              <span class="dte-choice-label">${o.label}<br/><span class="dte-choice-tag ${o.nivel.toLowerCase()}">${o.tag}</span></span>
            </label>
          `).join('')}
        </div>
        ${reglaBox}
        <div class="dte-nav">
          <button class="dte-btn dte-btn-ghost" id="btnBack">← Atrás</button>
          <button class="dte-btn dte-btn-primary" id="btnNext">Ver resultado →</button>
        </div>
      `;
      root.innerHTML = stepperHTML() + body;
      root.querySelectorAll('input[name="m3"]').forEach(inp => {
        inp.onchange = () => { d[m.field] = inp.value; render(); };
      });
      document.getElementById('btnBack').onclick = () => { state.flowStep = 2; render(); };
      document.getElementById('btnNext').onclick = () => {
        d[m.obsField] = document.getElementById('fM3Obs').value.trim();
        if (!d[m.field]) { alert('Elegí la opción que mejor describe la respuesta del líder.'); return; }
        const opt = m.options.find(o => o.id === d[m.field]);
        goResultado(opt.nivel);
      };
      return;
    }

    if (state.flowStep === 4) {
      const dudaMsg = c.dudaAlert(d);
      const dudaAlert = dudaMsg ? `<div class="dte-alert">⚠ ${dudaMsg}</div>` : '';
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
          ${c.niveles.map(n => `<button class="dte-toggle-btn ${n.code.toLowerCase()} ${d.nivel_final === n.code ? 'active' : ''}" data-nivel="${n.code}">${n.code} — ${esc(n.label)}</button>`).join('')}
        </div>

        <div class="dte-panel" style="margin-top:18px">
          <div class="dte-summary-row"><span class="dte-summary-k">Líder</span><span class="dte-summary-v">${esc(d.nombre)}</span></div>
          <div class="dte-summary-row"><span class="dte-summary-k">Sector / UET</span><span class="dte-summary-v">${esc(d.sector) || '—'}</span></div>
          <div class="dte-summary-row"><span class="dte-summary-k">Rol</span><span class="dte-summary-v">${esc(d.rol)}</span></div>
          <div class="dte-summary-row"><span class="dte-summary-k">Fecha</span><span class="dte-summary-v">${fmtDate(d.fecha)}</span></div>
          ${c.extraField ? `<div class="dte-summary-row"><span class="dte-summary-k">${esc(c.extraField.label)}</span><span class="dte-summary-v">${esc(d[c.extraField.id]) || '—'}</span></div>` : ''}
          <div class="dte-summary-row"><span class="dte-summary-k">Facilitador</span><span class="dte-summary-v">${esc(d.facilitador)}</span></div>
        </div>

        <div class="dte-nav">
          <button class="dte-btn dte-btn-ghost" id="btnBack">← Revisar Momento 3</button>
          <button class="dte-btn dte-btn-primary" id="btnGuardar">Guardar registro</button>
        </div>
      `;
      root.innerHTML = stepperHTML() + body;
      root.querySelectorAll('.dte-toggle-btn').forEach(btn => {
        btn.onclick = () => { d.nivel_final = btn.dataset.nivel; render(); };
      });
      document.getElementById('btnBack').onclick = () => { state.flowStep = 3; render(); };
      document.getElementById('btnGuardar').onclick = guardarDiagnostico;
      return;
    }
  }

  render();
})();
