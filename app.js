(() => {
  // ════════════════ Datos ════════════════
  const EPS = window.BC_EPISODIOS || [];
  const MOM = (window.BC_MOMENTOS || []).map((m, i) => ({ ...m, i }));
  const IMG = window.BC_IMAGENES || {};
  const PJS = window.BC_PERSONAJES || [];
  const ULTIMO = EPS.length ? EPS[EPS.length - 1].n : 0;
  const PJ = Object.fromEntries(PJS.map(p => [p.id, p]));

  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ\s-]/g, ' ').replace(/-/g, ' ');

  const ep = n => EPS[n - 1];
  const esRelleno = e => e && !e.caps.length;
  const esT2 = e => e && e.n > 170;
  const imgDe = archivo => (archivo && IMG[archivo]) || '';
  const imgMomento = m => imgDe(m.img) || imgDe(ep(m.ep)?.img);
  const MESES = { January: 'enero', February: 'febrero', March: 'marzo', April: 'abril', May: 'mayo', June: 'junio', July: 'julio', August: 'agosto', September: 'septiembre', October: 'octubre', November: 'noviembre', December: 'diciembre' };
  const fecha = f => { const m = /^(\w+) (\d+), (\d+)$/.exec(f || ''); return m ? `${m[2]} de ${MESES[m[1]] || m[1]} de ${m[3]}` : (f || ''); };
  const rangoCaps = c => !c.length ? 'relleno' : c.length === 1 ? `cap. ${c[0]}` : `caps. ${c[0]}–${c[c.length - 1]}`;
  const rangoEps = eps => eps.length === 1 ? `${eps[0]}` : `${eps[0]}–${eps[eps.length - 1]}`;

  // Arcos en orden, con color propio para la línea temporal
  const COLORES = ['#c9a24a', '#6b8f71', '#b3141f', '#d8c7a2', '#2f6e8f', '#5e7d3a', '#8a5bb0', '#c0632a', '#a31f5c', '#3f8f86', '#7a7a7a'];
  const ARCOS = [];
  for (const e of EPS) {
    const ult = ARCOS[ARCOS.length - 1];
    if (ult && ult.nombre === e.arco) ult.eps.push(e.n);
    else ARCOS.push({ nombre: e.arco, eps: [e.n], color: COLORES[ARCOS.length % COLORES.length] });
  }
  const arcoDe = n => ARCOS.find(a => a.eps.includes(n));

  // Peleas: se agrupan las de la wiki por nombre y se juntan sus episodios
  const traducirPelea = t => t
    .replace(/Humans and Elves/g, 'Humanos y elfos').replace(/Black Bulls/g, 'Toros Negros').replace(/Magic Knights/g, 'Caballeros Mágicos')
    .replace(/Diamond Kingdom Army/g, 'ejército del Reino Diamante').replace(/Witch Queen/g, 'Reina Bruja')
    .replace(/\bTeam\b/g, 'Equipo').replace(/\bFive Elves\b/g, 'cinco elfos').replace(/\bTwo Elves\b/g, 'dos elfos')
    .replace(/\bElves\b/g, 'elfos').replace(/\bElf\b/g, 'elfo').replace(/, and /g, ' y ').replace(/ and /g, ' y ');
  const NOMBRES_PJ = PJS.map(p => {
    const nombres = new Set([p.wiki, p.id, p.wiki.split(' ')[0]]);
    if (p.id === 'Reina Bruja') nombres.add('Witch Queen');
    if (p.id === 'Lumiere') nombres.add('Lumiere');
    return { id: p.id, re: new RegExp('\\b(' + [...nombres].map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b') };
  });
  const pjEnTexto = t => NOMBRES_PJ.filter(x => x.re.test(t)).map(x => x.id);
  const PELEAS = (() => {
    const mapa = new Map();
    for (const e of EPS) for (const p of e.peleas) {
      if (!mapa.has(p)) mapa.set(p, { original: p, eps: [] });
      mapa.get(p).eps.push(e.n);
    }
    return [...mapa.values()].map((p, i) => ({ ...p, i, t: traducirPelea(p.original), pj: pjEnTexto(p.original) }));
  })();

  // ════════════════ Búsqueda ════════════════
  const VACIAS = new Set('el la los las lo de del en que donde cuando se su sus un una unos unas y o a al por para con como capitulo capitulos cap episodio episodios ep anime black clover transforma transformacion transformaciones vez primera primer momento sale salen aparece hace usa esta es era fue cual quiero ver busco me mi vs contra versus'.split(' '));
  const SINONIMOS = {
    valquiria: ['valkyrie', 'valquiria'], valkiria: ['valkyrie'], valkyria: ['valkyrie'], valkirie: ['valkyrie'],
    sirena: ['mermaid', 'sirena'], diablo: ['demonio', 'devil'], devil: ['demonio', 'devil'], demonio: ['demonio', 'devil'],
    fusion: ['unite', 'fusion', 'union'], fusiona: ['unite', 'fusion'], union: ['unite', 'union'],
    muere: ['muerte', 'muere'], murio: ['muerte', 'muere'], mata: ['muerte', 'muere'],
    noel: ['noelle'], julio: ['julius'], juliu: ['julius'], fuego: ['fuego', 'fire'],
    ruge: ['rugido', 'roar'], cuna: ['cuna', 'cradle'], nido: ['nido', 'nest'], negra: ['negra', 'black'], negro: ['negro', 'black'],
    1: ['primera', 'grimorio'], 2: ['segunda'], 3: ['tercera'], 4: ['cuarta'],
    secuestran: ['secuestro'], secuestrado: ['secuestro'], patri: ['patolli', 'patri'], peli: ['pelicula'], movie: ['pelicula'],
    nero: ['nero', 'secre'], bruja: ['bruja', 'witch'], toros: ['toros', 'black', 'bulls'],
  };
  const lev1 = (a, b) => {
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, d = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++d > 1) return false;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
    }
    return d + (a.length - i) + (b.length - j) <= 1;
  };
  const tokens = q => norm(q).split(/\s+/).filter(t => t && !VACIAS.has(t));
  const variantes = t => SINONIMOS[t] || [t];
  const coincide = (t, palabras) => variantes(t).some(v =>
    palabras.some(p => p === v || (v.length >= 3 && p.startsWith(v)) || (v.length >= 5 && lev1(v, p))));
  const palabras = s => norm(s).split(/\s+/).filter(Boolean);

  const idxMom = MOM.map(m => ({ m, pj: palabras(m.p.join(' ')), ti: palabras(m.t), tx: palabras([m.q, m.nota].join(' ')) }));
  const idxEps = EPS.map(e => ({ e, ti: palabras(e.t), tx: palabras([e.peleas.join(' '), e.eventos.join(' '), e.debuts.join(' '), e.arco, e.pj.join(' ')].join(' ')) }));
  const idxPel = PELEAS.map(p => ({ p, tx: palabras(p.original + ' ' + p.t + ' ' + p.pj.join(' ')) }));

  function puntuar(ts, campos) {
    let hits = 0, score = 0;
    for (const t of ts) {
      let alguno = false;
      for (const [lista, peso] of campos) if (coincide(t, lista)) { alguno = true; score += peso; }
      if (alguno) hits++;
    }
    return { hits, score };
  }
  function buscar(q) {
    const ts = tokens(q);
    if (!ts.length) return null;
    const orden = (a, b) => b.hits - a.hits || b.score - a.score;
    const mom = idxMom.map(x => ({ x, ...puntuar(ts, [[x.pj, 3], [x.ti, 2], [x.tx, 1.2]]) })).filter(r => r.hits).sort(orden);
    const eps = idxEps.map(x => ({ x, ...puntuar(ts, [[x.ti, 1.5], [x.tx, .6]]) })).filter(r => r.hits).sort(orden);
    return { ts, mom, eps };
  }
  const textoCoincide = (q, lista) => { const ts = tokens(q); return !ts.length || ts.every(t => coincide(t, lista)); };

  // ════════════════ Piezas de HTML ════════════════
  const ICONO_YT = '<svg width="18" height="13" viewBox="0 0 18 13" aria-hidden="true"><rect width="18" height="13" rx="3" fill="#e02a2a"/><path d="M7 3.5v6l5-3z" fill="#fff"/></svg>';
  const urlYt = q => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
  const imgTag = (src, cls = '', alt = '') => src ? `<img ${cls ? `class="${cls}"` : ''} src="${esc(src)}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'">` : '';
  const fondo = src => src ? ` style="--bg:url('${esc(src)}')"` : '';
  const lamina = (src, pie) => src ? `<div class="lamina"${fondo(src)}><img src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.remove()">${pie ? `<span class="pie">${esc(pie)}</span>` : ''}</div>` : '';
  const TIPOS = { poder: 'Poder', pelea: 'Pelea', revelacion: 'Revelación', muerte: 'Golpe duro', evento: 'Suceso', pelicula: 'Película' };
  const etiquetasEp = e => (esRelleno(e) ? ' <span class="etq relleno">Relleno</span>' : '') + (esT2(e) ? ' <span class="etq t2">Temporada 2</span>' : '');
  const caras = (ids, cls = 'caras') => {
    const v = ids.filter(id => PJ[id]);
    return v.length ? `<div class="${cls}">${v.map(id => `<button class="cara" data-pj="${esc(id)}" title="${esc(id)}">${imgTag(PJ[id].img, '', id)}</button>`).join('')}</div>` : '';
  };
  const miniCaras = ids => { const v = ids.filter(id => PJ[id]?.img).slice(0, 7); return v.length ? `<div class="mini-caras">${v.map(id => imgTag(PJ[id].img, '', id)).join('')}</div>` : ''; };
  const numeroDe = m => m.peli ? 'Película' : m.manga ? `Cap. ${m.cap}` : m.ep;

  function bloqueVideo(yt, rotulo, busqueda) {
    return `<div class="video"><h4>${yt ? 'Vídeo del momento' : 'Vídeos'}</h4>
      ${yt ? `<button class="reproductor" data-yt="${esc(yt)}" style="background-image:url('https://i.ytimg.com/vi/${esc(yt)}/hqdefault.jpg')" aria-label="Reproducir: ${esc(rotulo)}"><span class="play"></span><span class="rotulo">${esc(rotulo)}</span></button>` : ''}
      <a class="buscar-yt" href="${urlYt(busqueda)}" target="_blank" rel="noopener">${ICONO_YT} ${yt ? 'Más vídeos en YouTube' : 'Buscar este momento en YouTube'}</a>
    </div>`;
  }

  function paginaMomento(m) {
    const e = m.ep ? ep(m.ep) : null;
    const rel = (m.mas || []).filter(r => ep(r.ep)).sort((a, b) => a.ep - b.ep);
    const busqueda = m.peli ? 'Black Clover La espada del Rey Mago' : m.manga ? `Black Clover manga capítulo ${m.cap} ${m.p[0]}` : `Black Clover episodio ${m.ep} ${m.t}`;
    const texto = m.manga || m.peli;
    return `<article class="pagina">
      ${lamina(imgMomento(m), m.img ? '' : `Episodio ${m.ep}`)}
      <div class="pagina-cab">${texto ? '' : '<div class="sello" aria-hidden="true">¡Es<br>este!</div>'}
        <div class="numero${texto ? ' texto' : ''}"><small>${m.peli ? 'Aparte' : m.manga ? 'Solo manga' : 'Episodio'}</small><strong>${esc(numeroDe(m))}</strong></div>
        <div>
          <h2>${esc(m.t)}</h2>
          ${e ? `<p class="ep-titulo">«${esc(e.t)}»${etiquetasEp(e)}</p>` : `<p class="ep-titulo"><span class="etq ${m.peli ? 'peli' : 'manga'}">${m.peli ? 'Película' : 'Aún no animado'}</span></p>`}
          <div class="meta">
            <span class="etq tipo">${esc(TIPOS[m.tipo] || '')}</span>
            ${e ? `<span><b>ARCO</b>${esc(e.arco)}</span><span><b>EMITIDO</b>${esc(fecha(e.fecha))}</span>` : ''}
            ${m.cap ? `<span><b>MANGA</b>cap. ${m.cap}</span>` : ''}
          </div>
          ${caras(m.p)}
        </div>
      </div>
      ${m.nota ? `<p class="nota">${esc(m.nota)}</p>` : ''}
      ${bloqueVideo(m.yt, m.t, busqueda)}
      ${rel.length ? `<div class="relacionados">${rel.map(r => `<button class="rel" data-ep="${r.ep}"><b>Ep. ${r.ep}</b>${esc(r.txt)}</button>`).join('')}</div>` : ''}
      ${e ? `<div class="relacionados"><button class="rel" data-ep="${e.n}"><b>Ficha</b>Ver todo lo que pasa en el episodio ${e.n}</button></div>` : ''}
    </article>`;
  }

  function porQue(e, ts) {
    const d = e.debuts.find(h => ts.some(t => coincide(t, palabras(h))));
    if (d) return `Primera aparición de «${d}»`;
    const p = e.peleas.find(h => ts.some(t => coincide(t, palabras(h))));
    return p ? traducirPelea(p) : '';
  }
  function paginaEpisodio(e, porque) {
    return `<article class="pagina">
      ${lamina(imgDe(e.img))}
      <div class="pagina-cab"><div class="sello" aria-hidden="true">¡Es<br>este!</div>
        <div class="numero"><small>Episodio</small><strong>${e.n}</strong></div>
        <div>
          <h2>«${esc(e.t)}»</h2>
          <p class="ep-titulo">${esc(porque || '')}${etiquetasEp(e)}</p>
          <div class="meta"><span><b>ARCO</b>${esc(e.arco)}</span><span><b>EMITIDO</b>${esc(fecha(e.fecha))}</span><span><b>MANGA</b>${rangoCaps(e.caps)}</span></div>
          ${caras(e.pj)}
        </div>
      </div>
      ${e.peleas.length ? `<p class="nota">${e.peleas.map(p => esc(traducirPelea(p))).join(' · ')}</p>` : ''}
      ${bloqueVideo(null, '', `Black Clover episodio ${e.n} ${porque || e.t}`)}
      <div class="relacionados"><button class="rel" data-ep="${e.n}"><b>Ficha</b>Ver todo lo que pasa en el episodio ${e.n}</button></div>
    </article>`;
  }
  const filaMomento = m => `<button class="fila" data-mom="${m.i}">
      <span class="n${m.manga || m.peli ? ' texto' : ''}">${m.peli ? 'PELI' : m.manga ? 'MANGA' : m.ep}</span>
      <span>${esc(m.t)}<span class="d">${esc(TIPOS[m.tipo] || '')}${m.ep ? ' · «' + esc(ep(m.ep)?.t || '') + '»' : m.cap ? ` · capítulo ${m.cap}` : ''}${m.yt ? ' · ▶ vídeo' : ''}</span></span>
      ${imgTag(imgMomento(m), 'mini') || '<span></span>'}
    </button>`;
  const filaEpisodio = (e, ts) => `<button class="fila" data-ep="${e.n}">
      <span class="n">${e.n}</span>
      <span>«${esc(e.t)}»<span class="d">${esc(porQue(e, ts) || e.arco)}</span></span>
      ${imgTag(imgDe(e.img), 'mini') || '<span></span>'}
    </button>`;

  const tarjetaMomento = m => `<button class="tarjeta" data-mom="${m.i}">
      <div class="foto"${fondo(imgMomento(m))}>${imgTag(imgMomento(m))}
        <div class="etiquetas"><span class="etq tipo">${esc(TIPOS[m.tipo] || '')}</span>${m.manga ? '<span class="etq manga">Manga</span>' : ''}${esT2(ep(m.ep)) ? '<span class="etq t2">T2</span>' : ''}</div>
        ${m.yt ? '<span class="video-ico">▶ Vídeo</span>' : ''}
        <span class="num${m.manga || m.peli ? ' texto' : ''}">${m.peli ? 'PELI' : m.manga ? `CAP<br>${m.cap}` : m.ep}</span>
      </div>
      <div class="cuerpo"><h3>${esc(m.t)}</h3><span class="sub">${m.ep ? '«' + esc(ep(m.ep).t) + '»' : m.peli ? 'Película (2023)' : 'Todavía no está en el anime'}</span>${miniCaras(m.p)}</div>
    </button>`;
  const tarjetaEpisodio = e => `<button class="tarjeta${esRelleno(e) ? ' relleno' : ''}" data-ep="${e.n}">
      <div class="foto"${fondo(imgDe(e.img))}>${imgTag(imgDe(e.img))}
        <div class="etiquetas">${esRelleno(e) ? '<span class="etq relleno">Relleno</span>' : ''}${esT2(e) ? '<span class="etq t2">T2</span>' : ''}</div>
        <span class="num">${e.n}</span>
      </div>
      <div class="cuerpo"><h3>«${esc(e.t)}»</h3><span class="sub">${esc(e.arco)} · ${rangoCaps(e.caps)}</span>${miniCaras(e.pj)}</div>
    </button>`;
  const tituloPelea = t => esc(t).replace(/ vs\. /g, '<span class="vs">vs</span>');
  const filaPelea = p => `<button class="pelea" data-ep="${p.eps[0]}">
      ${imgTag(imgDe(ep(p.eps[0]).img), 'fondo')}
      <div><div class="titulo">${tituloPelea(p.t)}</div><div class="sub">${esc(arcoDe(p.eps[0])?.nombre || '')}${p.eps.length > 1 ? ` · ${p.eps.length} episodios` : ''}</div>${miniCaras(p.pj)}</div>
      <div class="eps"><small>${p.eps.length > 1 ? 'Episodios' : 'Episodio'}</small>${rangoEps(p.eps)}</div>
    </button>`;

  // ════════════════ Vista: Buscar ════════════════
  function mostrarBusqueda(q) {
    const out = $('#resultado');
    if (!q.trim()) { out.innerHTML = ''; return; }
    if (/^\s*(ep|episodio|cap|capitulo)?\.?\s*\d{1,3}\s*$/i.test(norm(q))) {
      const e = ep(+norm(q).match(/\d+/)[0]);
      if (e) {
        const deEse = MOM.filter(m => m.ep === e.n);
        out.innerHTML = paginaEpisodio(e) + (deEse.length ? `<h2 class="seccion-titulo">Momentos de este episodio</h2><div class="lista">${deEse.map(filaMomento).join('')}</div>` : '');
        return;
      }
    }
    const r = buscar(q);
    if (!r || (!r.mom.length && !r.eps.length)) {
      out.innerHTML = `<p class="vacio">El grimorio no encuentra nada con «${esc(q)}». Prueba con el personaje y la técnica (ej: «yuno spirit dive»).</p>`;
      return;
    }
    const n = r.ts.length, topMom = r.mom[0], topEp = r.eps[0];
    let principal = '', restoMom = r.mom, restoEp = r.eps;
    if (topMom && (topMom.hits >= n || !topEp || topMom.hits >= topEp.hits)) { principal = paginaMomento(topMom.x.m); restoMom = r.mom.slice(1); }
    else { principal = paginaEpisodio(topEp.x.e, porQue(topEp.x.e, r.ts)); restoEp = r.eps.slice(1); }
    const mejores = restoMom.filter(x => x.hits >= Math.min(n, topMom?.hits || 1) - (n > 2 ? 1 : 0)).slice(0, 6).map(x => x.x.m);
    const epsMostrar = restoEp.filter(x => x.hits >= Math.max(1, n - 1)).slice(0, 6).map(x => x.x.e);
    out.innerHTML = principal
      + (mejores.length ? `<h2 class="seccion-titulo">¿O quizá buscabas…?</h2><div class="lista">${mejores.map(filaMomento).join('')}</div>` : '')
      + (epsMostrar.length ? `<h2 class="seccion-titulo">Episodios donde sale</h2><div class="lista">${epsMostrar.map(e => filaEpisodio(e, r.ts)).join('')}</div>` : '');
  }

  // ════════════════ Vista: Explorador ════════════════
  const nuevoFiltro = () => ({ texto: '', tipos: new Set(), pjs: new Set(), arco: '', temporada: '', canon: '', video: false });
  const FILTROS = { momentos: nuevoFiltro(), peleas: nuevoFiltro(), episodios: nuevoFiltro() };
  let mostrarHasta = 48;

  const CONFIG = {
    momentos: {
      titulo: 'Momentos clave', lema: 'Transformaciones, peleas, revelaciones y golpes duros, cada uno con su episodio.',
      grupos: ['texto', 'tipo', 'pjs', 'arco', 'temporada', 'video'],
      items: () => MOM,
      pasa: (m, f) => (!f.tipos.size || f.tipos.has(m.tipo))
        && [...f.pjs].every(id => m.p.includes(id))
        && (!f.arco || ep(m.ep)?.arco === f.arco)
        && (!f.temporada || (f.temporada === 't1' ? m.ep && m.ep <= 170 : f.temporada === 't2' ? m.ep > 170 : (m.manga || m.peli)))
        && (!f.video || m.yt)
        && textoCoincide(f.texto, [...palabras(m.t), ...palabras(m.q), ...palabras(m.p.join(' ')), ...palabras(m.nota)]),
      orden: (a, b) => (a.ep ?? 999 + (a.cap || 0)) - (b.ep ?? 999 + (b.cap || 0)),
      eps: m => m.ep ? [m.ep, ...(m.mas || []).map(r => r.ep)] : [],
      pintar: lista => `<div class="rejilla-tarjetas">${lista.map(tarjetaMomento).join('')}</div>`,
    },
    peleas: {
      titulo: 'Peleas', lema: 'Todos los combates registrados en la wiki, con los episodios que dura cada uno.',
      grupos: ['texto', 'pjs', 'arco', 'temporada'],
      items: () => PELEAS,
      pasa: (p, f) => [...f.pjs].every(id => p.pj.includes(id))
        && (!f.arco || p.eps.some(n => ep(n).arco === f.arco))
        && (!f.temporada || (f.temporada === 't1' ? p.eps[0] <= 170 : f.temporada === 't2' ? p.eps.some(n => n > 170) : false))
        && textoCoincide(f.texto, palabras(p.original + ' ' + p.t + ' ' + p.pj.join(' '))),
      orden: (a, b) => a.eps[0] - b.eps[0],
      eps: p => p.eps,
      pintar: lista => `<div class="lista-peleas">${lista.map(filaPelea).join('')}</div>`,
    },
    episodios: {
      titulo: 'Episodios', lema: 'Los 175 episodios: filtra por arco, por quién sale o si es relleno.',
      grupos: ['texto', 'pjs', 'arco', 'temporada', 'canon'],
      items: () => EPS,
      pasa: (e, f) => [...f.pjs].every(id => e.pj.includes(id))
        && (!f.arco || e.arco === f.arco)
        && (!f.temporada || (f.temporada === 't1' ? e.n <= 170 : f.temporada === 't2' ? e.n > 170 : false))
        && (!f.canon || (f.canon === 'canon' ? !esRelleno(e) : esRelleno(e)))
        && textoCoincide(f.texto, idxEps[e.n - 1].ti.concat(idxEps[e.n - 1].tx)),
      orden: (a, b) => a.n - b.n,
      eps: e => [e.n],
      pintar: lista => `<div class="rejilla-tarjetas">${lista.map(tarjetaEpisodio).join('')}</div>`,
    },
  };

  function pintarFiltros(vista) {
    const f = FILTROS[vista], cfg = CONFIG[vista];
    const items = cfg.items();
    const html = [];
    for (const g of cfg.grupos) {
      if (g === 'texto') html.push(`<div class="grupo-filtro"><h3>Texto</h3><input type="search" id="f-texto" placeholder="Filtrar por palabras…" value="${esc(f.texto)}"></div>`);
      if (g === 'tipo') {
        const cuenta = t => items.filter(m => m.tipo === t).length;
        html.push(`<div class="grupo-filtro"><h3>Tipo ${f.tipos.size ? '<button data-limpiar="tipos">quitar</button>' : ''}</h3><div class="chips">${Object.entries(TIPOS).map(([k, v]) => `<button class="chip" data-tipo="${k}" aria-pressed="${f.tipos.has(k)}">${v}<span class="n">${cuenta(k)}</span></button>`).join('')}</div></div>`);
      }
      if (g === 'pjs') {
        const usados = PJS.filter(p => vista === 'episodios' || items.some(x => (x.p || x.pj).includes(p.id)));
        html.push(`<div class="grupo-filtro"><h3>Personajes ${f.pjs.size ? '<button data-limpiar="pjs">quitar</button>' : ''}</h3><div class="retratos">${usados.map(p => `<button class="retrato-btn" data-fpj="${esc(p.id)}" aria-pressed="${f.pjs.has(p.id)}" title="${esc(p.id)}" aria-label="${esc(p.id)}">${imgTag(p.img, '', p.id)}</button>`).join('')}</div></div>`);
      }
      if (g === 'arco') html.push(`<div class="grupo-filtro"><h3>Arco</h3><select id="f-arco"><option value="">Todos los arcos</option>${ARCOS.map(a => `<option ${f.arco === a.nombre ? 'selected' : ''}>${esc(a.nombre)}</option>`).join('')}</select></div>`);
      if (g === 'temporada') {
        const ops = [['', 'Todas'], ['t1', 'Temporada 1 (1–170)'], ['t2', 'Temporada 2 (171+)']];
        if (vista === 'momentos') ops.push(['fuera', 'Solo manga / película']);
        html.push(`<div class="grupo-filtro"><h3>Temporada</h3><div class="chips">${ops.map(([k, v]) => `<button class="chip" data-temporada="${k}" aria-pressed="${f.temporada === k}">${v}</button>`).join('')}</div></div>`);
      }
      if (g === 'canon') html.push(`<div class="grupo-filtro"><h3>Tipo de episodio</h3><div class="chips">${[['', 'Todos'], ['canon', 'Del manga'], ['relleno', 'Relleno']].map(([k, v]) => `<button class="chip" data-canon="${k}" aria-pressed="${f.canon === k}">${v}</button>`).join('')}</div></div>`);
      if (g === 'video') html.push(`<div class="grupo-filtro"><label class="interruptor"><input type="checkbox" id="f-video" ${f.video ? 'checked' : ''}> Solo con vídeo</label></div>`);
    }
    html.push('<button class="limpiar-todo" data-limpiar="todo">Quitar todos los filtros</button>');
    $('#cuerpo-filtros').innerHTML = html.join('');
  }

  function activos(f) { return (f.texto ? 1 : 0) + f.tipos.size + f.pjs.size + (f.arco ? 1 : 0) + (f.temporada ? 1 : 0) + (f.canon ? 1 : 0) + (f.video ? 1 : 0); }

  function pintarResultados(vista) {
    const f = FILTROS[vista], cfg = CONFIG[vista];
    const lista = cfg.items().filter(x => cfg.pasa(x, f)).sort(cfg.orden);
    const total = cfg.items().length;
    $('#ex-total').innerHTML = `<b>${lista.length}</b>${lista.length === total ? 'en total' : `de ${total}`}`;
    const na = activos(f);
    $('#filtros-activos').textContent = na ? `(${na} activos)` : '';
    // línea temporal: qué episodios caen en el resultado
    const marcados = new Set(lista.flatMap(cfg.eps));
    $('#linea').innerHTML = `<div class="linea-barra" role="group" aria-label="Línea temporal de episodios">${EPS.map(e => `<button data-ep="${e.n}" class="${marcados.has(e.n) ? 'si' : ''}" style="--c:${arcoDe(e.n).color}" title="Ep. ${e.n} · ${esc(e.t)}" aria-label="Episodio ${e.n}"></button>`).join('')}</div>
      <div class="linea-arcos">${ARCOS.map(a => `<span style="flex:${a.eps.length};--c:${a.color}" title="${esc(a.nombre)}">${esc(a.nombre)}</span>`).join('')}</div>`;
    const visibles = lista.slice(0, mostrarHasta);
    $('#ex-resultados').innerHTML = lista.length
      ? cfg.pintar(visibles) + (lista.length > mostrarHasta ? `<button class="boton mas-resultados" id="ver-mas">Ver ${Math.min(48, lista.length - mostrarHasta)} más (quedan ${lista.length - mostrarHasta})</button>` : '')
      : '<p class="vacio">Nada con esos filtros. Quita alguno.</p>';
  }

  let vistaActual = '';
  function abrirExplorador(vista) {
    vistaActual = vista;
    mostrarHasta = 48;
    $('#ex-titulo').textContent = CONFIG[vista].titulo;
    $('#ex-lema').textContent = CONFIG[vista].lema;
    if (matchMedia('(max-width: 900px)').matches) $('#filtros').open = false; else $('#filtros').open = true;
    pintarFiltros(vista);
    pintarResultados(vista);
  }
  const refrescar = (filtros = true) => { mostrarHasta = 48; if (filtros) pintarFiltros(vistaActual); pintarResultados(vistaActual); };

  $('#cuerpo-filtros').addEventListener('click', ev => {
    const f = FILTROS[vistaActual];
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.tipo) { f.tipos.has(b.dataset.tipo) ? f.tipos.delete(b.dataset.tipo) : f.tipos.add(b.dataset.tipo); }
    else if (b.dataset.fpj) { f.pjs.has(b.dataset.fpj) ? f.pjs.delete(b.dataset.fpj) : f.pjs.add(b.dataset.fpj); }
    else if (b.dataset.temporada != null) f.temporada = b.dataset.temporada;
    else if (b.dataset.canon != null) f.canon = b.dataset.canon;
    else if (b.dataset.limpiar === 'tipos') f.tipos.clear();
    else if (b.dataset.limpiar === 'pjs') f.pjs.clear();
    else if (b.dataset.limpiar === 'todo') FILTROS[vistaActual] = nuevoFiltro();
    else return;
    refrescar();
  });
  $('#cuerpo-filtros').addEventListener('change', ev => {
    const f = FILTROS[vistaActual];
    if (ev.target.id === 'f-arco') f.arco = ev.target.value;
    if (ev.target.id === 'f-video') f.video = ev.target.checked;
    refrescar();
  });
  let esperaFiltro;
  $('#cuerpo-filtros').addEventListener('input', ev => {
    if (ev.target.id !== 'f-texto') return;
    clearTimeout(esperaFiltro);
    esperaFiltro = setTimeout(() => { FILTROS[vistaActual].texto = ev.target.value; refrescar(false); }, 150);
  });
  $('#ex-resultados').addEventListener('click', ev => {
    if (ev.target.closest('#ver-mas')) { mostrarHasta += 48; pintarResultados(vistaActual); }
  });

  // ════════════════ Vista: Personajes ════════════════
  function statsPj(id) {
    const eps = EPS.filter(e => e.pj.includes(id)).map(e => e.n);
    const momentos = MOM.filter(m => m.p.includes(id)).sort(CONFIG.momentos.orden);
    const peleas = PELEAS.filter(p => p.pj.includes(id));
    return { eps, momentos, peleas };
  }
  function pintarPersonajes() {
    const grupos = [...new Set(PJS.map(p => p.grupo))];
    $('#v-personajes').innerHTML = `<div class="cabecera-vista"><div><h2>Personajes</h2><p>Toca uno para ver su cronología: transformaciones, peleas y en qué episodios sale.</p></div><div class="total"><b>${PJS.length}</b>personajes</div></div>`
      + grupos.map(g => `<div class="grupo-pj"><h3>${esc(g)}</h3><div class="rejilla-pj">${PJS.filter(p => p.grupo === g).map(p => {
        const s = statsPj(p.id);
        return `<button class="ficha-pj" data-pj="${esc(p.id)}"><span class="aro">${imgTag(p.img, '', p.id)}</span><b>${esc(p.id)}</b><small>${s.eps.length} episodios${s.momentos.length ? ` · ${s.momentos.length} momentos` : ''}</small></button>`;
      }).join('')}</div></div>`).join('');
  }
  function pintarPerfil(id) {
    const p = PJ[id];
    if (!p) return pintarPersonajes();
    const s = statsPj(id);
    const marcados = new Set(s.eps);
    $('#v-personajes').innerHTML = `<button class="volver" data-ir="#/personajes">← Todos los personajes</button>
      <div class="perfil">
        <span class="aro">${imgTag(p.img, '', p.id)}</span>
        <div>
          <span class="grupo">${esc(p.grupo)}</span>
          <h2>${esc(p.id)}</h2>
          <div class="datos-pj">
            <div class="dato"><button data-ep="${s.eps[0] || 1}"><b>${s.eps[0] || '—'}</b><span>Primera aparición</span></button></div>
            <div class="dato"><b>${s.eps.length}</b><span>Episodios</span></div>
            <div class="dato"><b>${s.momentos.length}</b><span>Momentos clave</span></div>
            <div class="dato"><b>${s.peleas.length}</b><span>Peleas</span></div>
          </div>
          <div class="relacionados" style="margin-top:14px">
            <button class="boton" data-filtrar="episodios" data-con="${esc(id)}">Ver sus episodios</button>
            ${s.peleas.length ? `<button class="boton" data-filtrar="peleas" data-con="${esc(id)}">Ver sus peleas</button>` : ''}
          </div>
        </div>
      </div>
      <h2 class="seccion-titulo">Cuándo sale</h2>
      <div class="linea"><div class="linea-barra">${EPS.map(e => `<button data-ep="${e.n}" class="${marcados.has(e.n) ? 'si' : ''}" style="--c:${arcoDe(e.n).color}" title="Ep. ${e.n} · ${esc(e.t)}" aria-label="Episodio ${e.n}"></button>`).join('')}</div>
      <div class="linea-arcos">${ARCOS.map(a => `<span style="flex:${a.eps.length};--c:${a.color}" title="${esc(a.nombre)}">${esc(a.nombre)}</span>`).join('')}</div></div>
      ${s.momentos.length ? `<h2 class="seccion-titulo">Cronología</h2><div class="cronologia">${s.momentos.map(m => `<button class="hito" data-mom="${m.i}"><span class="cuando">${m.peli ? 'Película' : m.manga ? `Manga · cap. ${m.cap}` : `Episodio ${m.ep}`} · ${esc(TIPOS[m.tipo] || '')}</span><span class="que">${esc(m.t)}</span></button>`).join('')}</div>` : ''}
      ${s.peleas.length ? `<h2 class="seccion-titulo">Peleas</h2><div class="lista-peleas">${s.peleas.map(filaPelea).join('')}</div>` : ''}`;
  }

  // ════════════════ Ficha de episodio ════════════════
  const dlg = $('#ficha');
  function abrirFicha(n) {
    const e = ep(n); if (!e) return;
    const momentos = MOM.filter(m => m.ep === n || (m.mas || []).some(r => r.ep === n));
    dlg.innerHTML = `<div class="ficha">
      <button class="cerrar" aria-label="Cerrar">×</button>
      ${lamina(imgDe(e.img))}
      <div class="num-grande">${e.n}</div>
      <h2>«${esc(e.t)}»</h2>
      <div class="meta"><span><b>ARCO</b>${esc(e.arco)}</span><span><b>EMITIDO</b>${esc(fecha(e.fecha))}</span><span><b>MANGA</b>${rangoCaps(e.caps)}</span>${etiquetasEp(e)}</div>
      ${e.pj.length ? `<h4>Salen</h4>${caras(e.pj)}` : ''}
      ${momentos.length ? `<h4>Momentos clave</h4><ul>${momentos.map(m => `<li>${esc(m.ep === n ? m.t : (m.mas.find(r => r.ep === n).txt + ' — ' + m.t))}</li>`).join('')}</ul>` : ''}
      ${e.peleas.length ? `<h4>Peleas</h4><ul>${e.peleas.map(p => `<li>${esc(traducirPelea(p))}</li>`).join('')}</ul>` : ''}
      ${e.eventos.length ? `<h4>Sucesos</h4><ul>${e.eventos.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
      ${e.debuts.length ? `<h4>Hechizos que salen por primera vez</h4><ul>${e.debuts.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
      ${!e.peleas.length && !e.debuts.length && !momentos.length ? '<p>Episodio tranquilo: sin peleas ni hechizos nuevos registrados.</p>' : ''}
      <a class="buscar-yt" href="${urlYt(`Black Clover episodio ${e.n} ${e.t}`)}" target="_blank" rel="noopener">${ICONO_YT} Buscar el episodio ${e.n} en YouTube</a>
      <div class="nav-ficha">
        <button class="boton" data-ir-ep="${n - 1}" ${n <= 1 ? 'disabled' : ''}>← Ep. ${n - 1}</button>
        <button class="boton" data-ir-ep="${n + 1}" ${n >= ULTIMO ? 'disabled' : ''}>Ep. ${n + 1} →</button>
      </div>
    </div>`;
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0;
  }
  dlg.addEventListener('click', ev => {
    if (ev.target === dlg || ev.target.closest('.cerrar')) return dlg.close();
    const ir = ev.target.closest('[data-ir-ep]');
    if (ir && !ir.disabled) return abrirFicha(+ir.dataset.irEp);
    const c = ev.target.closest('[data-pj]');
    if (c) { dlg.close(); location.hash = '#/personaje/' + encodeURIComponent(c.dataset.pj); }
  });

  function abrirMomento(i) {
    location.hash = '#/momento/' + i;
  }

  // ════════════════ Clicks globales ════════════════
  document.addEventListener('click', ev => {
    if (ev.target.closest('dialog')) return;
    const v = ev.target.closest('.reproductor');
    if (v) {
      const id = v.dataset.yt;
      // YouTube no deja incrustar vídeos en páginas abiertas como archivo: ahí se abre en YouTube
      if (!/^https?:$/.test(location.protocol)) { window.open('https://www.youtube.com/watch?v=' + id, '_blank', 'noopener'); return; }
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
      f.title = v.getAttribute('aria-label');
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      v.replaceWith(f);
      return;
    }
    const filtrar = ev.target.closest('[data-filtrar]');
    if (filtrar) {
      FILTROS[filtrar.dataset.filtrar] = nuevoFiltro();
      FILTROS[filtrar.dataset.filtrar].pjs.add(filtrar.dataset.con);
      location.hash = '#/' + filtrar.dataset.filtrar;
      return;
    }
    const ir = ev.target.closest('[data-ir]');
    if (ir) { location.hash = ir.dataset.ir; return; }
    const pj = ev.target.closest('[data-pj]');
    if (pj) { location.hash = '#/personaje/' + encodeURIComponent(pj.dataset.pj); return; }
    const mom = ev.target.closest('[data-mom]');
    if (mom) { abrirMomento(+mom.dataset.mom); return; }
    const e = ev.target.closest('[data-ep]');
    if (e && !ev.target.closest('#cuerpo-filtros')) abrirFicha(+e.dataset.ep);
  });

  // ════════════════ Rutas ════════════════
  const VISTAS = ['v-buscar', 'v-explorar', 'v-personajes'];
  function mostrarVista(id, pestana) {
    VISTAS.forEach(v => $('#' + v).classList.toggle('oculto', v !== id));
    document.querySelectorAll('.pestana').forEach(p => p.toggleAttribute('aria-current', false));
    const p = document.querySelector(`.pestana[data-vista="${pestana}"]`);
    if (p) p.setAttribute('aria-current', 'page');
    const el = $('#' + id); el.classList.remove('vista'); void el.offsetWidth; el.classList.add('vista');
  }
  function ruta() {
    if (dlg.open) dlg.close();
    const h = location.hash.slice(1);
    if (h && !h.startsWith('/')) { location.replace('#/buscar/' + h); return; } // enlaces antiguos (#noelle%20valquiria)
    const [, seccion = '', arg = ''] = h.split('/');
    const valor = decodeURIComponent(arg);
    if (['momentos', 'peleas', 'episodios'].includes(seccion)) { mostrarVista('v-explorar', seccion); abrirExplorador(seccion); }
    else if (seccion === 'personajes') { mostrarVista('v-personajes', 'personajes'); pintarPersonajes(); }
    else if (seccion === 'personaje') { mostrarVista('v-personajes', 'personajes'); pintarPerfil(valor); }
    else if (seccion === 'momento') {
      mostrarVista('v-buscar', 'buscar');
      const m = MOM[+valor];
      if (m) { $('#q').value = ''; $('#resultado').innerHTML = paginaMomento(m); }
      $('#resultado').scrollIntoView({ block: 'start' });
      return;
    }
    else {
      mostrarVista('v-buscar', 'buscar');
      if (seccion === 'buscar') { $('#q').value = valor; mostrarBusqueda(valor); }
      else if (!$('#q').value) $('#resultado').innerHTML = '';
    }
    scrollTo({ top: 0 });
  }
  addEventListener('hashchange', ruta);

  // ════════════════ Entrada de búsqueda ════════════════
  let espera;
  $('#q').addEventListener('input', ev => {
    clearTimeout(espera);
    const q = ev.target.value;
    espera = setTimeout(() => {
      mostrarBusqueda(q);
      history.replaceState(null, '', q.trim() ? '#/buscar/' + encodeURIComponent(q) : '#/');
    }, 160);
  });
  document.addEventListener('keydown', ev => {
    if (ev.key === '/' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && !dlg.open) {
      ev.preventDefault();
      if (!location.hash.startsWith('#/buscar') && location.hash !== '#/' && location.hash) location.hash = '#/';
      setTimeout(() => $('#q').focus(), 0);
    }
  });
  const ATAJOS = ['Noelle valquiria', 'Noelle sirena', 'Asta demonio', 'Asta negro', 'Black Divider', 'Yuno Spirit Dive', 'Muerte de Julius', 'Yami vs Dante', 'William es Licht', 'Película'];
  $('#atajos').innerHTML = ATAJOS.map(a => `<button class="atajo">${esc(a)}</button>`).join('');
  $('#atajos').addEventListener('click', ev => {
    const b = ev.target.closest('.atajo'); if (!b) return;
    location.hash = '#/buscar/' + encodeURIComponent(b.textContent);
  });

  // ════════════════ Inicio ════════════════
  $('#cifras').innerHTML = `<li><b>${EPS.length}</b>episodios</li><li><b>${MOM.length}</b>momentos</li><li><b>${PELEAS.length}</b>peleas</li><li><b>${PJS.length}</b>personajes</li>`;
  $('#c-momentos').textContent = MOM.length;
  $('#c-peleas').textContent = PELEAS.length;
  $('#c-episodios').textContent = EPS.length;
  $('#c-personajes').textContent = PJS.length;
  $('#actualizado').textContent = window.BC_ACTUALIZADO || '—';
  $('#ultimo').textContent = ULTIMO;
  ruta();
  if (!location.hash || location.hash === '#/') $('#q').focus();

  // ════════════════ Cenizas de antimagia ════════════════
  const cv = $('#cenizas'), cx = cv.getContext('2d');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let W, H;
    const P = [];
    const tam = () => { W = cv.width = innerWidth * devicePixelRatio; H = cv.height = innerHeight * devicePixelRatio; };
    tam(); addEventListener('resize', tam);
    const nueva = y => ({ x: Math.random() * W, y: y ?? H + 20, r: (Math.random() * 2.2 + .6) * devicePixelRatio, vy: -(Math.random() * .5 + .2) * devicePixelRatio, vx: (Math.random() - .5) * .3 * devicePixelRatio, rojo: Math.random() < .35, f: Math.random() * 6.28 });
    for (let i = 0; i < 70; i++) P.push(nueva(Math.random() * H));
    (function paso() {
      cx.clearRect(0, 0, W, H);
      for (const p of P) {
        p.y += p.vy; p.f += .02; p.x += p.vx + Math.sin(p.f) * .25;
        if (p.y < -20) Object.assign(p, nueva());
        const a = Math.min(1, p.y / H + .15);
        cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.28);
        cx.fillStyle = p.rojo ? `rgba(224,42,42,${.55 * a})` : `rgba(201,162,74,${.28 * a})`;
        cx.shadowBlur = p.rojo ? 8 : 0; cx.shadowColor = '#e02a2a';
        cx.fill();
      }
      requestAnimationFrame(paso);
    })();
  }
})();
