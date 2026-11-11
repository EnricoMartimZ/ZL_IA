// Painel da esquerda: cenas e camadas (ordem de empilhamento) e a Asset Library.
import { useRef, useState } from 'react';
import { api, ASSET_BASE } from '../api/client.js';
import { allLayerIds, uniqueId } from '../util.js';
import { sceneAtFrame } from '../state/store.js';

function novaCamada(project, scene, tipo, asset) {
  const { width: W, height: H, safeArea: a } = project.composition;
  const base = { startFrame: 0, durationFrames: scene.durationFrames };
  const ids = allLayerIds(project);
  const util = W - a.left - a.right;
  if (tipo === 'text') {
    return { id: uniqueId('texto', ids), name: 'Texto', type: 'text', ...base, box: { x: a.left, y: Math.round(H * 0.36), width: util, height: 220 },
      text: { content: 'Novo texto', fontFamily: 'brand.heading', fontSize: 96, lineHeight: 1.05, color: '#FFFFFF', align: 'center', verticalAlign: 'middle' } };
  }
  if (tipo === 'shape') {
    return { id: uniqueId('forma', ids), name: 'Forma', type: 'shape', ...base, box: { x: Math.round(W / 2 - 200), y: Math.round(H * 0.4), width: 400, height: 400 }, shape: { kind: 'rect', fill: 'brand.accent' } };
  }
  const proporcao = asset.width && asset.height ? asset.height / asset.width : (tipo === 'logo' ? 0.5 : 1);
  const largura = tipo === 'logo' ? 400 : Math.min(util, 800);
  const altura = Math.round(largura * proporcao);
  const box = { x: Math.round((W - largura) / 2), y: Math.round(Math.max(a.top, (H - a.bottom + a.top - altura) / 2)), width: largura, height: altura };
  return tipo === 'logo'
    ? { id: uniqueId('logo', ids), name: 'Logo', type: 'logo', ...base, box, logo: { assetId: asset.id } }
    : { id: uniqueId('imagem', ids), name: asset.name ?? 'Imagem', type: 'image', ...base, box, image: { assetId: asset.id, fit: 'cover' } };
}

export function LeftPanel({ store, state }) {
  const { project, selection, frame } = state;
  const [aba, setAba] = useState('camadas');
  const [aviso, setAviso] = useState(null);
  const arquivo = useRef(null);
  const cenaAtual = project.scenes.find((s) => s.id === (selection?.sceneId ?? sceneAtFrame(project, frame).sceneId));

  const adicionar = (tipo, asset) => {
    const layer = novaCamada(project, cenaAtual, tipo, asset);
    const erro = store.dispatch([{ type: 'layer.add', sceneId: cenaAtual.id, layer }]);
    if (erro) setAviso(erro.problems?.[0]?.message ?? erro.message); else { setAviso(null); store.select({ sceneId: cenaAtual.id, layerId: layer.id }); }
  };
  const novaCena = () => {
    const id = uniqueId('cena', project.scenes.map((s) => s.id));
    const indice = project.scenes.indexOf(cenaAtual) + 1;
    store.dispatch([{ type: 'scene.add', index: indice, scene: { id, name: 'Cena nova', durationFrames: 90, background: 'brand.background', beat: { role: 'other' }, layers: [] } }]);
    store.select({ sceneId: id });
  };
  const enviar = async (lista) => {
    for (const f of lista) {
      try {
        const { asset } = await api.upload(f);
        const erro = store.dispatch([{ type: 'asset.add', asset }]);
        setAviso(erro ? erro.message : null);
      } catch (e) { setAviso(e.message); }
    }
    arquivo.current.value = '';
  };

  return (
    <aside className="left" data-testid="left-panel">
      <nav className="tabs">
        <button type="button" className={aba === 'camadas' ? 'is-on' : ''} onClick={() => setAba('camadas')}>Camadas</button>
        <button type="button" className={aba === 'assets' ? 'is-on' : ''} onClick={() => setAba('assets')} data-testid="tab-assets">Assets ({project.assets.length})</button>
      </nav>
      {aviso && <p className="left-warning" data-testid="left-warning">{aviso}</p>}

      {aba === 'camadas' && (
        <div className="left-body">
          <div className="row-buttons">
            <button type="button" onClick={() => adicionar('text')} data-testid="add-text">+ Texto</button>
            <button type="button" onClick={() => adicionar('shape')} data-testid="add-shape">+ Forma</button>
            <button type="button" onClick={novaCena} data-testid="add-scene">+ Cena</button>
          </div>
          {project.scenes.map((cena) => (
            <div key={cena.id} className="scene-block">
              <div className={`scene-title ${selection?.sceneId === cena.id && !selection.layerId ? 'is-selected' : ''}`} onClick={() => store.select({ sceneId: cena.id })} data-testid={`list-scene-${cena.id}`}>
                <b>{cena.name}</b><span>{cena.durationFrames} q</span>
                {project.scenes.length > 1 && <button type="button" className="link danger" title="Apagar a cena" onClick={(e) => { e.stopPropagation(); store.dispatch([{ type: 'scene.remove', sceneId: cena.id }]); }}>×</button>}
              </div>
              {[...cena.layers].reverse().map((layer) => {
                const indice = cena.layers.indexOf(layer);
                return (
                  <div key={layer.id} className={`layer-row ${selection?.layerId === layer.id ? 'is-selected' : ''}`} onClick={() => store.select({ sceneId: cena.id, layerId: layer.id })} data-testid={`list-layer-${layer.id}`}>
                    <i className={`dot dot-${layer.type}`} />
                    <span className="layer-name">{layer.name}{layer.locked ? ' 🔒' : ''}</span>
                    <button type="button" className="link" title="Trazer para a frente" disabled={indice === cena.layers.length - 1} onClick={(e) => { e.stopPropagation(); store.dispatch([{ type: 'layer.reorder', layerId: layer.id, index: indice + 1 }]); }}>↑</button>
                    <button type="button" className="link" title="Mandar para trás" disabled={indice === 0} onClick={(e) => { e.stopPropagation(); store.dispatch([{ type: 'layer.reorder', layerId: layer.id, index: indice - 1 }]); }}>↓</button>
                    <button type="button" className="link danger" title="Apagar a camada" data-testid={`delete-${layer.id}`} onClick={(e) => { e.stopPropagation(); store.dispatch([{ type: 'layer.remove', layerId: layer.id }]); }}>×</button>
                  </div>
                );
              })}
              {cena.layers.length === 0 && <p className="note">Sem camadas.</p>}
            </div>
          ))}
        </div>
      )}

      {aba === 'assets' && (
        <div className="left-body">
          <input ref={arquivo} type="file" multiple hidden accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.avif,.woff,.woff2,.ttf,.otf" onChange={(e) => enviar([...e.target.files])} data-testid="upload-input" />
          <div className="row-buttons"><button type="button" onClick={() => arquivo.current.click()}>+ Trazer arquivo</button></div>
          <p className="note">Entra na cena “{cenaAtual.name}”.</p>
          <div className="asset-grid">
            {project.assets.map((a) => (
              <div key={a.id} className="asset" data-testid={`asset-${a.id}`}>
                <div className="thumb">{a.type === 'font' ? <span>Aa</span> : <img src={ASSET_BASE + a.src} alt="" />}</div>
                <div className="asset-info">
                  <b title={a.id}>{a.id}</b>
                  <span>{a.type}{a.width ? ` · ${a.width}×${a.height}` : ''}</span>
                  {a.type !== 'font' && <button type="button" onClick={() => adicionar(a.type, a)} data-testid={`use-${a.id}`}>Pôr na cena</button>}
                  {a.type === 'image' && <button type="button" className="link" onClick={() => adicionar('logo', a)} hidden>como logo</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
