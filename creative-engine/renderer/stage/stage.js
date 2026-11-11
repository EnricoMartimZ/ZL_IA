// Palco: desenha o estado de um quadro em DOM. É o mesmo desenhista do preview do editor e da
// exportação. Não anima nada sozinho: sem transição de CSS, sem relógio, sem sorteio. Cada seek
// aplica o que o Core calculou para aquele quadro.
import { evaluateFrame } from '../../core/src/evaluate/index.js';

const px = (n) => `${n}px`;
const fonteInterna = (assetId) => `mazy-${assetId}`;

function carregarImagem(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => (img.decode ? img.decode().then(() => resolve(img), () => resolve(img)) : resolve(img));
    img.onerror = () => reject(new Error(url));
    img.src = url;
  });
}

/**
 * Monta o palco dentro de um elemento.
 * @param {HTMLElement} elemento
 * @param {{ project: any, assetBaseUrl: string }} opcoes assetBaseUrl termina em "/" e aponta para a pasta do projeto
 * @returns {{ ready: Promise<void>, seek: (frame: number) => any, setProject: (project: any) => Promise<void>, destroy: () => void, root: HTMLElement }}
 */
export function mountStage(elemento, { project, assetBaseUrl }) {
  const doc = elemento.ownerDocument;
  let projeto = project;
  const raiz = doc.createElement('div');
  raiz.className = 'mazy-stage';
  Object.assign(raiz.style, { position: 'relative', overflow: 'hidden', contain: 'strict' });
  elemento.appendChild(raiz);

  const cenas = new Map();   // sceneId → { el, camadas: Map(layerId → { el, tipo, miolo }) }
  const fontes = new Map();  // assetId → FontFace já registrada
  const imagens = new Map(); // assetId → url já carregada
  const url = (src) => assetBaseUrl + src.split('/').map(encodeURIComponent).join('/');

  async function carregarAssets() {
    const falhas = [];
    await Promise.all(projeto.assets.map(async (asset) => {
      try {
        if (asset.type === 'font') {
          if (fontes.has(asset.id)) return;
          // a fonte entra com um nome interno por asset: o projeto não depende de fonte instalada
          const face = new FontFace(fonteInterna(asset.id), `url("${url(asset.src)}")`, { weight: '100 900' });
          await face.load();
          doc.fonts.add(face);
          fontes.set(asset.id, face);
        } else if (imagens.get(asset.id) !== url(asset.src)) {
          await carregarImagem(url(asset.src));
          imagens.set(asset.id, url(asset.src));
        }
      } catch {
        falhas.push(`${asset.id} (${asset.src})`);
      }
    }));
    if (falhas.length) {
      const erro = new Error(`Não consegui carregar: ${falhas.join(', ')}`);
      erro.code = 'ASSET_LOAD_FAILED';
      throw erro;
    }
  }

  function criarCamada(tipo) {
    const el = doc.createElement('div');
    Object.assign(el.style, { position: 'absolute', left: '0', top: '0', willChange: 'transform, opacity' });
    let miolo;
    if (tipo === 'text') {
      Object.assign(el.style, { display: 'flex', flexDirection: 'column' });
      miolo = doc.createElement('div');
      Object.assign(miolo.style, { whiteSpace: 'pre-wrap', overflowWrap: 'break-word', margin: '0', fontKerning: 'normal', fontSynthesis: 'none' });
    } else if (tipo === 'image' || tipo === 'logo') {
      el.style.overflow = 'hidden';
      miolo = doc.createElement('img');
      miolo.alt = '';
      miolo.draggable = false;
      Object.assign(miolo.style, { display: 'block', width: '100%', height: '100%' });
    } else {
      miolo = doc.createElement('div');
      Object.assign(miolo.style, { width: '100%', height: '100%', boxSizing: 'border-box' });
    }
    el.appendChild(miolo);
    return { el, tipo, miolo };
  }

  function pintarCamada({ el, miolo }, c) {
    el.dataset.layerId = c.layerId;
    Object.assign(el.style, {
      width: px(c.width), height: px(c.height), opacity: String(c.opacity),
      transformOrigin: `${c.anchorX * 100}% ${c.anchorY * 100}%`,
      transform: `translate(${c.x}px, ${c.y}px) rotate(${c.rotation}deg) scale(${c.scale})`,
    });
    const k = c.content;
    if (c.type === 'text') {
      el.style.justifyContent = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[k.verticalAlign];
      if (miolo.textContent !== k.content) miolo.textContent = k.content;
      Object.assign(miolo.style, {
        fontFamily: `${k.fontAssetId ? `"${fonteInterna(k.fontAssetId)}", ` : ''}"${k.fontFamily}", sans-serif`,
        fontSize: px(k.fontSize), fontWeight: String(k.fontWeight), lineHeight: String(k.lineHeight),
        letterSpacing: `${k.letterSpacing}em`, color: k.color, textAlign: k.align,
        textTransform: k.uppercase ? 'uppercase' : 'none',
      });
    } else if (c.type === 'image') {
      const destino = k.src ? url(k.src) : '';
      if (miolo.getAttribute('src') !== destino) miolo.setAttribute('src', destino);
      el.style.borderRadius = px(k.borderRadius);
      Object.assign(miolo.style, { objectFit: k.fit, objectPosition: `${k.focusX * 100}% ${k.focusY * 100}%` });
    } else if (c.type === 'logo') {
      const destino = k.src ? url(k.src) : '';
      if (miolo.getAttribute('src') !== destino) miolo.setAttribute('src', destino);
      Object.assign(miolo.style, { objectFit: 'contain', objectPosition: '50% 50%' }); // logo: sempre inteiro, sem distorção
    } else {
      Object.assign(miolo.style, {
        background: k.fill ?? 'transparent',
        border: k.stroke ? `${k.stroke.width}px solid ${k.stroke.color}` : 'none',
        borderRadius: k.kind === 'ellipse' ? '50%' : px(k.borderRadius),
      });
    }
  }

  function seek(frame) {
    const estado = evaluateFrame(projeto, frame);
    Object.assign(raiz.style, { width: px(estado.width), height: px(estado.height), background: estado.background });
    raiz.dataset.frame = String(frame);

    const vivas = new Set();
    estado.scenes.forEach((s, ordem) => {
      vivas.add(s.sceneId);
      let cena = cenas.get(s.sceneId);
      if (!cena) {
        cena = { el: doc.createElement('div'), camadas: new Map() };
        Object.assign(cena.el.style, { position: 'absolute', inset: '0', overflow: 'hidden' });
        cena.el.dataset.sceneId = s.sceneId;
        raiz.appendChild(cena.el);
        cenas.set(s.sceneId, cena);
      }
      const c = s.container;
      Object.assign(cena.el.style, {
        display: 'block', zIndex: String(ordem), background: s.background ?? 'transparent',
        opacity: String(c.opacity), transform: `translate(${c.x}px, ${c.y}px)`,
        clipPath: c.clip ? `inset(${c.clip.top}px ${c.clip.right}px ${c.clip.bottom}px ${c.clip.left}px)` : 'none',
      });
      const presentes = new Set();
      s.layers.forEach((l, z) => {
        presentes.add(l.layerId);
        let camada = cena.camadas.get(l.layerId);
        if (!camada || camada.tipo !== l.type) {
          camada?.el.remove();
          camada = criarCamada(l.type);
          cena.el.appendChild(camada.el);
          cena.camadas.set(l.layerId, camada);
        }
        camada.el.style.display = l.type === 'text' ? 'flex' : 'block';
        camada.el.style.zIndex = String(z);
        pintarCamada(camada, l);
      });
      for (const [id, camada] of cena.camadas) if (!presentes.has(id)) camada.el.style.display = 'none';
    });
    for (const [id, cena] of cenas) if (!vivas.has(id)) cena.el.style.display = 'none';
    return estado;
  }

  function limpar() {
    for (const cena of cenas.values()) cena.el.remove();
    cenas.clear();
  }

  let ready = carregarAssets();
  const palco = {
    root: raiz,
    get ready() { return ready; },
    seek,
    /** Troca o projeto (edição no editor). Só recarrega asset novo. */
    setProject(novo) {
      projeto = novo; // o próximo seek já desenha o projeto novo; o que saiu de cena fica escondido
      ready = carregarAssets();
      return ready;
    },
    destroy() {
      limpar();
      for (const face of fontes.values()) doc.fonts.delete(face);
      raiz.remove();
    },
  };
  return palco;
}
