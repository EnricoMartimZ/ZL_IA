// O "Canvas" do editor: o palco (o mesmo da exportação) com seleção, alças e guias por cima.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { mountStage } from '../../../renderer/stage/stage.js';
import { evaluateFrame } from '../../../core/src/index.js';
import { ASSET_BASE } from '../api/client.js';
import { dragHandler, findLayer } from '../util.js';
import { sceneAtFrame } from '../state/store.js';

const CANTOS = [['nw', -1, -1], ['ne', 1, -1], ['sw', -1, 1], ['se', 1, 1]];

/** Desloca a caixa e, se houver, as trilhas de x e y: a camada anda inteira. */
function patchDeMover(layer, dx, dy) {
  const patch = { box: { x: Math.round(layer.box.x + dx), y: Math.round(layer.box.y + dy) } };
  const k = layer.keyframes ?? {};
  if (k.x || k.y) {
    patch.keyframes = {};
    if (k.x) patch.keyframes.x = k.x.map((p) => ({ ...p, value: Math.round(p.value + dx) }));
    if (k.y) patch.keyframes.y = k.y.map((p) => ({ ...p, value: Math.round(p.value + dy) }));
  }
  return patch;
}

export function StageView({ store, state }) {
  const { project, frame, selection } = state;
  const { width: W, height: H, safeArea } = project.composition;
  const area = useRef(null), host = useRef(null), palco = useRef(null);
  const [escala, setEscala] = useState(0.3);
  const [falha, setFalha] = useState(null);

  useLayoutEffect(() => {
    const medir = () => {
      const r = area.current.getBoundingClientRect();
      setEscala(Math.max(0.05, Math.min((r.width - 40) / W, (r.height - 40) / H)));
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(area.current);
    return () => observador.disconnect();
  }, [W, H]);

  useEffect(() => {
    palco.current = mountStage(host.current, { project: store.getState().project, assetBaseUrl: ASSET_BASE });
    palco.current.ready.then(() => palco.current?.seek(store.getState().frame), (e) => setFalha(e.message));
    return () => { palco.current.destroy(); palco.current = null; };
  }, [store]);

  useEffect(() => {
    if (!palco.current) return;
    setFalha(null);
    palco.current.setProject(project).then(() => palco.current?.seek(store.getState().frame), (e) => setFalha(e.message));
    palco.current.seek(frame);
  }, [project]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { palco.current?.seek(frame); }, [frame]);

  const quadro = evaluateFrame(project, frame);
  const achada = selection?.layerId ? findLayer(project, selection.layerId) : null;
  const naTela = achada ? quadro.scenes.flatMap((s) => s.layers.map((l) => ({ l, s }))).find(({ l }) => l.layerId === selection.layerId) : null;

  // ---- gestos ----
  const mover = (layerId) => dragHandler({
    start: () => { const a = findLayer(store.getState().project, layerId); if (!a || a.layer.locked) return false; store.beginGesture(); return a.layer; },
    move: (dx, dy, e, layer) => store.updateGesture([{ type: 'layer.update', layerId, patch: patchDeMover(layer, dx / escala, dy / escala) }]),
    end: () => store.commitGesture(),
  });

  const aoApertarNoPalco = (e) => {
    // o que está embaixo do ponteiro, de cima para baixo
    const alvo = document.elementsFromPoint(e.clientX, e.clientY).find((el) => el.dataset?.layerId && host.current.contains(el));
    const camada = alvo && findLayer(project, alvo.dataset.layerId);
    if (camada && !camada.layer.locked) {
      store.select({ sceneId: camada.scene.id, layerId: camada.layer.id });
      mover(camada.layer.id)(e);
    } else store.select({ sceneId: sceneAtFrame(project, frame).sceneId });
  };

  const redimensionar = (sx, sy) => dragHandler({
    start: () => { store.beginGesture(); return achada.layer.box; },
    move: (dx, dy, e, box) => {
      const escalaDaCamada = naTela?.l.scale || 1;
      const ax = dx / escala / escalaDaCamada, ay = dy / escala / escalaDaCamada;
      let { x, y, width, height } = box;
      if (sx > 0) width = Math.max(8, box.width + ax); else { width = Math.max(8, box.width - ax); x = box.x + box.width - width; }
      if (sy > 0) height = Math.max(8, box.height + ay); else { height = Math.max(8, box.height - ay); y = box.y + box.height - height; }
      if (e.shiftKey) { // mantém a proporção
        const p = box.width / box.height;
        if (width / height > p) { const novo = height * p; if (sx < 0) x += width - novo; width = novo; } else { const novo = width / p; if (sy < 0) y += height - novo; height = novo; }
      }
      store.updateGesture([{ type: 'layer.update', layerId: achada.layer.id, patch: { box: { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) } } }]);
    },
    end: () => store.commitGesture(),
  });

  const girar = dragHandler({
    start: (e) => {
      store.beginGesture();
      const r = host.current.getBoundingClientRect();
      const l = naTela.l;
      const centro = { x: r.left + (l.x + l.width * l.anchorX) * escala, y: r.top + (l.y + l.height * l.anchorY) * escala };
      const angulo = (ev) => Math.atan2(ev.clientY - centro.y, ev.clientX - centro.x) * 180 / Math.PI;
      return { angulo, inicial: angulo(e), base: achada.layer.transform?.rotation ?? 0 };
    },
    move: (dx, dy, e, c) => {
      let graus = c.base + c.angulo(e) - c.inicial;
      graus = e.shiftKey ? Math.round(graus / 15) * 15 : Math.round(graus);
      graus = ((graus + 180) % 360 + 360) % 360 - 180;
      store.updateGesture([{ type: 'layer.update', layerId: achada.layer.id, patch: { transform: { rotation: graus } } }]);
    },
    end: () => store.commitGesture(),
  });

  const l = naTela?.l;
  const c = naTela?.s.container;
  const travada = achada?.layer.locked;
  const podeRedimensionar = l && !travada && l.rotation === 0;
  const podeGirar = l && !travada && !achada.layer.keyframes?.rotation;
  const alca = 12 / escala / (l?.scale || 1);

  return (
    <div className="stage-area" ref={area} data-testid="stage-area">
      <div className="stage-frame" style={{ width: W * escala, height: H * escala }}>
        <div className="stage-scaled" style={{ width: W, height: H, transform: `scale(${escala})` }} onPointerDown={aoApertarNoPalco} data-testid="stage">
          <div ref={host} className="stage-host" />
          <div className="stage-overlay">
            <div className="safe-area" style={{ left: safeArea.left, top: safeArea.top, right: safeArea.right, bottom: safeArea.bottom, borderWidth: 2 / escala }} title="Área segura" />
            {l && (
              <div className="selection" data-testid="selection" data-layer={l.layerId}
                style={{
                  width: l.width, height: l.height, outlineWidth: 2 / escala / l.scale,
                  transformOrigin: `${l.anchorX * 100}% ${l.anchorY * 100}%`,
                  transform: `translate(${l.x + c.x}px, ${l.y + c.y}px) rotate(${l.rotation}deg) scale(${l.scale})`,
                }}>
                {podeRedimensionar && CANTOS.map(([nome, sx, sy]) => (
                  <div key={nome} className={`handle handle-${nome}`} data-testid={`handle-${nome}`} onPointerDown={redimensionar(sx, sy)}
                    style={{ width: alca, height: alca, left: sx < 0 ? -alca / 2 : undefined, right: sx > 0 ? -alca / 2 : undefined, top: sy < 0 ? -alca / 2 : undefined, bottom: sy > 0 ? -alca / 2 : undefined }} />
                ))}
                {podeGirar && <div className="handle handle-rotate" data-testid="handle-rotate" onPointerDown={girar} style={{ width: alca, height: alca, left: `calc(50% - ${alca / 2}px)`, top: -alca * 3 }} title="Girar (Shift: de 15 em 15°)" />}
              </div>
            )}
          </div>
        </div>
      </div>
      {achada && !naTela && <div className="stage-note">A camada selecionada não está na tela neste quadro.</div>}
      {falha && <div className="stage-note stage-error" data-testid="stage-error">{falha}</div>}
    </div>
  );
}
