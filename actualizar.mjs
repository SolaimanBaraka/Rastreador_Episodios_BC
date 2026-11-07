// Descarga los episodios de la wiki de Black Clover (fandom) y regenera datos-episodios.js
// Uso:  node actualizar.mjs          -> usa la caché y solo baja los episodios nuevos
//       node actualizar.mjs --todo   -> vuelve a bajar todos
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(DIR, 'wiki-cache', 'ep');
const API = 'https://blackclover.fandom.com/api.php?action=parse&prop=wikitext&format=json&redirects=1&page=';
const TODO = process.argv.includes('--todo');
fs.mkdirSync(CACHE, { recursive: true });

async function bajar(n) {
  const res = await fetch(API + 'Episode_' + n, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const json = await res.json();
  if (!json.parse) return null;
  fs.writeFileSync(path.join(CACHE, n + '.json'), JSON.stringify(json));
  return json;
}

const ARCOS = {
  'Magic Knights Entrance Arc': 'Ingreso a los Caballeros Mágicos',
  'Dungeon Exploration Arc': 'La mazmorra',
  'Arc 2': 'La mazmorra',
  'Royal Capital Arc': 'Ataque a la Capital Real',
  'Eye of the Midnight Sun Arc': 'Ojo del Sol de Medianoche',
  'Seabed Temple Arc': 'Templo Submarino',
  "Witches' Forest Arc": 'Bosque de las Brujas',
  'Royal Knights Arc': 'Caballeros Reales',
  'Elf Reincarnation Arc': 'Reencarnación élfica',
  'Heart Kingdom Joint Struggle Arc': 'Alianza con el Reino Corazón',
  'Spade Kingdom Raid Arc': 'Asalto al Reino Pica',
};

const limpiar = s => (s || '')
  .replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, '')
  .replace(/\{\{Nihongo\|([^|}]*)[^}]*\}\}/g, '$1')
  .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
  .replace(/'''?/g, '').replace(/\{\{[^}]*\}\}/g, '').replace(/<[^>]+>/g, '').trim();
const lista = (w, clave) => {
  const m = w.match(new RegExp('\\|' + clave + '=([\\s\\S]*?)(?=\\n\\||\\n\\}\\})'));
  return m ? m[1].split('\n').map(l => limpiar(l.replace(/^\s*#+/, ''))).filter(Boolean) : [];
};
const seccion = (w, nombre) => {
  const m = w.match(new RegExp('==\\s*' + nombre + '\\s*==\\n([\\s\\S]*?)(?=\\n==)'));
  return m ? m[1].split('\n').filter(l => l.startsWith('*')).map(l => limpiar(l.slice(1))).filter(Boolean) : [];
};
const campo = (w, k) => { const m = w.match(new RegExp('\\|\\s*' + k + '\\s*=[ \\t]*(.*)')); return m ? m[1] : ''; };

// Personajes que se pueden filtrar: id (nombre corto en español), página de la wiki, grupo
const REPARTO = [
  ['Asta', 'Asta', 'Toros Negros'], ['Noelle', 'Noelle Silva', 'Toros Negros'], ['Yami', 'Yami Sukehiro', 'Toros Negros'],
  ['Magna', 'Magna Swing', 'Toros Negros'], ['Luck', 'Luck Voltia', 'Toros Negros'], ['Vanessa', 'Vanessa Enoteca', 'Toros Negros'],
  ['Finral', 'Finral Roulacase', 'Toros Negros'], ['Gauche', 'Gauche Adlai', 'Toros Negros'], ['Charmy', 'Charmy Pappitson', 'Toros Negros'],
  ['Gordon', 'Gordon Agrippa', 'Toros Negros'], ['Grey', 'Grey', 'Toros Negros'], ['Henry', 'Henry Legolant', 'Toros Negros'],
  ['Zora', 'Zora Ideale', 'Toros Negros'], ['Secre', 'Secre Swallowtail', 'Toros Negros'], ['Nacht', 'Nacht Faust', 'Toros Negros'],
  ['Yuno', 'Yuno Grinberryall', 'Amanecer Dorado'], ['William', 'William Vangeance', 'Amanecer Dorado'], ['Langris', 'Langris Vaude', 'Amanecer Dorado'],
  ['Klaus', 'Klaus Lunettes', 'Amanecer Dorado'], ['Mimosa', 'Mimosa Vermillion', 'Amanecer Dorado'],
  ['Julius', 'Julius Novachrono', 'Capitanes y Rey Mago'], ['Mereoleona', 'Mereoleona Vermillion', 'Capitanes y Rey Mago'],
  ['Fuegoleon', 'Fuegoleon Vermillion', 'Capitanes y Rey Mago'], ['Leopold', 'Leopold Vermillion', 'Capitanes y Rey Mago'],
  ['Nozel', 'Nozel Silva', 'Capitanes y Rey Mago'], ['Charlotte', 'Charlotte Roselei', 'Capitanes y Rey Mago'],
  ['Rill', 'Rill Boismortier', 'Capitanes y Rey Mago'], ['Jack', 'Jack the Ripper', 'Capitanes y Rey Mago'],
  ['Dorothy', 'Dorothy Unsworth', 'Capitanes y Rey Mago'], ['Kaiser', 'Kaiser Granvorka', 'Capitanes y Rey Mago'],
  ['Licht', 'Licht', 'Elfos y Ojo del Sol'], ['Patolli', 'Patolli', 'Elfos y Ojo del Sol'], ['Vetto', 'Vetto', 'Elfos y Ojo del Sol'],
  ['Fana', 'Fana', 'Elfos y Ojo del Sol'], ['Rhya', 'Rhya', 'Elfos y Ojo del Sol'], ['Mars', 'Mars', 'Elfos y Ojo del Sol'],
  ['Rades', 'Rades Spirito', 'Elfos y Ojo del Sol'], ['Lumiere', 'Lemiel Silvamillion Clover', 'Elfos y Ojo del Sol'],
  ['Reina Bruja', 'Ursula Bloodlord', 'Elfos y Ojo del Sol'],
  ['Lolopechka', 'Lolopechka', 'Reinos Corazón y Pica'], ['Vanica', 'Vanica Zogratis', 'Reinos Corazón y Pica'],
  ['Dante', 'Dante Zogratis', 'Reinos Corazón y Pica'], ['Zenon', 'Zenon Zogratis', 'Reinos Corazón y Pica'],
  ['Gadjah', 'Gadjah', 'Reinos Corazón y Pica'],
  ['Liebe', 'Liebe', 'Demonios'], ['Zagred', 'Zagred', 'Demonios'], ['Megicula', 'Megicula', 'Demonios'],
  ['Lilith', 'Lilith', 'Demonios'], ['Nahamah', 'Nahamah', 'Demonios'],
];
const porWiki = Object.fromEntries(REPARTO.map(([id, wiki]) => [wiki, id]));
const ALIAS_WIKI = { 'Yuno': 'Yuno Grinberryall', 'Nero': 'Secre Swallowtail', 'Queen of the Witches': 'Witch Queen' };
const presentes = w => {
  const m = w.match(/\|characters=([\s\S]*?)\n\|/);
  if (!m) return [];
  const ids = new Set();
  for (const linea of m[1].split('\n')) {
    if (/\((flashback|in vision|voice|mentioned|silhouette|picture|portrait|illusion|dream|image)/i.test(linea)) continue;
    const l = linea.match(/\[\[([^\]|]+)/);
    const destino = l ? l[1].trim() : limpiar(linea.replace(/^\s*#+/, ''));
    const id = porWiki[destino] || porWiki[ALIAS_WIKI[destino]];
    if (id) ids.add(id);
  }
  return [...ids];
};

const episodios = [];
const vistos = new Set();
for (let n = 1; ; n++) {
  const archivo = path.join(CACHE, n + '.json');
  let json = !TODO && fs.existsSync(archivo) ? JSON.parse(fs.readFileSync(archivo)) : null;
  // los dos últimos de la caché se vuelven a bajar: la wiki los completa días después de emitirse
  if (!json || (!TODO && !fs.existsSync(path.join(CACHE, (n + 2) + '.json')))) {
    process.stdout.write(`bajando episodio ${n}... `);
    json = (await bajar(n)) || json;
    console.log(json ? 'ok' : 'no existe todavía');
  }
  if (!json || !json.parse) break;
  const w = json.parse.wikitext['*'];
  const arcoEn = limpiar(campo(w, 'arc')).replace(/Arc(?=[A-Z])/, 'Arc|').split('|')[0];
  const capitulos = limpiar(campo(w, 'chapter').replace(/<br\s*\/?>/g, ', '))
    .replace(/Chapter /g, '').replace(/Extra 4/, 'Extra 4').split(/,\s*/).filter(c => /^\d+$/.test(c)).map(Number);
  const hechizos = lista(w, 'spell');
  const debuts = hechizos.filter(h => !/flashback/i.test(h) && !vistos.has(h));
  hechizos.forEach(h => vistos.add(h));
  episodios.push({
    n,
    t: limpiar(campo(w, 'title')),
    img: limpiar(campo(w, 'image')).replace(/_/g, ' ') || null,
    arco: ARCOS[arcoEn] || arcoEn,
    fecha: campo(w, 'airdate').split('<br')[0].trim(),
    caps: capitulos,
    peleas: seccion(w, 'Fights'),
    eventos: seccion(w, 'Events'),
    debuts,
    pj: presentes(w),
  });
}

// Retratos del reparto (imagen principal de su página en la wiki)
const personajes = REPARTO.map(([id, wiki, grupo]) => ({ id, wiki, grupo, img: null }));
for (let i = 0; i < personajes.length; i += 50) {
  const titulos = personajes.slice(i, i + 50).map(p => p.wiki).join('|');
  const url = 'https://blackclover.fandom.com/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=240&redirects=1&titles=' + encodeURIComponent(titulos);
  try {
    const json = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).json();
    const desde = {};
    for (const r of [...(json.query.normalized || []), ...(json.query.redirects || [])]) desde[r.to] = r.from;
    for (const p of Object.values(json.query.pages)) {
      let titulo = p.title;
      while (desde[titulo] && !personajes.some(x => x.wiki === titulo)) titulo = desde[titulo];
      const pj = personajes.find(x => x.wiki === titulo || x.wiki === p.title);
      if (pj && p.thumbnail) pj.img = p.thumbnail.source;
    }
  } catch (err) { console.log('no pude sacar retratos:', err.message); }
}
console.log(`${personajes.filter(p => p.img).length}/${personajes.length} retratos`);

// Imágenes: captura de cada episodio + las que piden los momentos (img: '...' en momentos.js)
const archivosImg = new Set(episodios.map(e => e.img).filter(Boolean));
for (const m of fs.readFileSync(path.join(DIR, 'momentos.js'), 'utf8').matchAll(/img: "([^"]+)"/g)) archivosImg.add(m[1]);
const imagenes = {};
const lista_ = [...archivosImg];
for (let i = 0; i < lista_.length; i += 50) {
  const titulos = lista_.slice(i, i + 50).map(f => 'File:' + f).join('|');
  const url = 'https://blackclover.fandom.com/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=640&titles=' + encodeURIComponent(titulos);
  try {
    const json = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).json();
    const norm = Object.fromEntries((json.query.normalized || []).map(x => [x.to, x.from]));
    for (const p of Object.values(json.query.pages)) {
      const info = p.imageinfo && p.imageinfo[0];
      if (info) imagenes[(norm[p.title] || p.title).replace(/^File:/, '').replace(/_/g, ' ')] = info.thumburl || info.url;
    }
  } catch (err) { console.log('no pude sacar imágenes:', err.message); }
}
console.log(`${Object.keys(imagenes).length} imágenes enlazadas`);

const salida = '// Generado por actualizar.mjs desde blackclover.fandom.com — no editar a mano\n'
  + 'window.BC_EPISODIOS = ' + JSON.stringify(episodios) + ';\n'
  + 'window.BC_IMAGENES = ' + JSON.stringify(imagenes) + ';\n'
  + 'window.BC_PERSONAJES = ' + JSON.stringify(personajes) + ';\n'
  + 'window.BC_ACTUALIZADO = ' + JSON.stringify(new Date().toISOString().slice(0, 10)) + ';\n';
fs.writeFileSync(path.join(DIR, 'datos-episodios.js'), salida);
console.log(`\n${episodios.length} episodios guardados en datos-episodios.js (último: ${episodios.at(-1).n} «${episodios.at(-1).t}», ${episodios.at(-1).fecha})`);
