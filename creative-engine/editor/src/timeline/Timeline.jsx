// Timeline: régua, cenas com as sobreposições das transições, uma barra por camada e a agulha.
// Arrastar a barra muda o início; a borda direita, a duração; as pontas coloridas, a entrada e a saída.
import { useLayoutEffect, useRef, useState } from 'react';
import { getTimeline } from '../../../core/src/index.js';
import { clamp, dragHandler, seconds } from '../util.js';

const ROTULO = 168;

const ocupa = (layer, papel) => Math.max(0, ...(layer.animations ?? []).filter((a) => a.role === papel).map((a) => (a.delayFrames ?? 0) + a.durationFrames));

export function Timeline({ store, state }) {
  const { project, frame, selection } = state;
  const { fps } = project.composition;
  const linha = getTimeline(project);
  const total = linha.totalFrames;
  const caixa = useRef(null);
  const [largura, setLargura] = useState(800);
  useLayoutEffect(() => {
    const medir = () => setLargura(caixa.current.clientWidth);
    medir();
    const o = new ResizeObserver(medir);
    o.observe(caixa.current);
    return () => o.disconnect();
  }, []);
  const ppf = Math.max(1.5, (largura - ROTULO - 24) / total); // pixels por quadro
  const x = (quadros) => quadros * ppf;

  const irPara = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    store.setFrame((e.clientX - r.left) / ppf);
  };
  const arrastarAgulha = dragHandler({ start: (e) => { irPara(e); return e.currentTarget.getBoundingClientRect(); }, move: (dx, dy, e, r) => store.setFrame((e.clientX - r.left) / ppf) });

  // um gesto que vira um comando por movimento, e uma alteração só no desfazer
  const gesto = (montar) => dragHandler({
    start: () => { store.beginGesture(); return undefined; },
    move: (dx) => { const comandos = montar(Math.round(dx / ppf)); if (comandos) store.updateGesture(comandos); },
    end: () => store.commitGesture(),
  });

  const escalarAnimacoes = (layer, papel, novoTotal) => {
    const atual = ocupa(layer, papel);
    const fator = novoTotal / atual;
    return layer.animations.filter((a) => a.role === papel).map((a) => ({
      type: 'animation.update', layerId: layer.id, animationId: a.id,
      patch: { durationFrames: Math.max(1, Math.round(a.durationFrames * fator)), ...(a.delayFrames ? { delayFrames: Math.round(a.delayFrames * fator) } : {}) },
    }));
  };

  const segundosNaRegua = [];
  for (let s = 0; s * fps <= total; s++) segundosNaRegua.push(s);

  return (
    <div className="timeline" ref={caixa} data-testid="timeline">
      <div className="tl-scroll">
        <div className="tl-inner" style={{ width: ROTULO + x(total) + 24 }}>
          <div className="tl-row tl-ruler-row">
            <div className="tl-label">Tempo</div>
            <div className="tl-track tl-ruler" style={{ width: x(total) }} onPointerDown={arrastarAgulha} data-testid="ruler">
              {segundosNaRegua.map((s) => <div key={s} className="tl-tick" style={{ left: x(s * fps) }}><span>{s}s</span></div>)}
            </div>
          </div>

          <div className="tl-row tl-scenes-row">
            <div className="tl-label">Cenas</div>
            <div className="tl-track" style={{ width: x(total), height: 44 }}>
              {linha.scenes.map((s, i) => {
                const cena = project.scenes[i];
                return (
                  <div key={s.sceneId} className={`tl-scene ${selection?.sceneId === s.sceneId && !selection.layerId ? 'is-selected' : ''}`} data-testid={`scene-${s.sceneId}`}
                    style={{ left: x(s.startFrame), width: x(cena.durationFrames), top: i % 2 ? 22 : 0 }}
                    onPointerDown={(e) => { e.stopPropagation(); store.select({ sceneId: s.sceneId }); }}>
                    {s.overlapIn > 0 && (
                      <div className="tl-overlap" style={{ width: x(s.overlapIn) }} title={`Transição ${cena.transitionIn.type}: ${s.overlapIn} quadros. Arraste para mudar.`} data-testid={`transition-${s.sceneId}`}
                        onPointerDown={gesto((d) => {
                          const duracao = clamp(s.overlapIn + d, 1, Math.min(cena.durationFrames, project.scenes[i - 1].durationFrames - linha.scenes[i - 1].overlapIn));
                          return [{ type: 'scene.setTransition', sceneId: s.sceneId, transition: { ...cena.transitionIn, durationFrames: duracao } }];
                        })} />
                    )}
                    <span className="tl-scene-name">{cena.name}</span>
                    <div className="tl-edge" title="Arraste para mudar a duração da cena" data-testid={`scene-edge-${s.sceneId}`}
                      onPointerDown={gesto((d) => {
                        const minimo = Math.max(1, s.overlapIn, linha.scenes[i + 1]?.overlapIn ?? 0, ...cena.layers.map((l) => l.startFrame + l.durationFrames));
                        return [{ type: 'scene.update', sceneId: s.sceneId, patch: { durationFrames: Math.max(minimo, cena.durationFrames + d) } }];
                      })} />
                  </div>
                );
              })}
            </div>
          </div>

          {linha.scenes.map((s, i) => [...project.scenes[i].layers].reverse().map((layer) => {
            const cena = project.scenes[i];
            const entra = ocupa(layer, 'in'), sai = ocupa(layer, 'out');
            const selecionada = selection?.layerId === layer.id;
            const selecionar = () => store.select({ sceneId: cena.id, layerId: layer.id });
            return (
              <div key={layer.id} className={`tl-row ${selecionada ? 'is-selected' : ''}`}>
                <div className="tl-label" onPointerDown={selecionar} title={layer.name}><i className={`dot dot-${layer.type}`} />{layer.name}</div>
                <div className="tl-track" style={{ width: x(total) }}>
                  <div className={`tl-bar tl-bar-${layer.type}`} data-testid={`bar-${layer.id}`}
                    style={{ left: x(s.startFrame + layer.startFrame), width: Math.max(4, x(layer.durationFrames)) }}
                    onPointerDown={(e) => {
                      selecionar();
                      if (layer.locked) return;
                      gesto((d) => [{ type: 'layer.update', layerId: layer.id, patch: { startFrame: clamp(layer.startFrame + d, 0, cena.durationFrames - layer.durationFrames) } }])(e);
                    }}>
                    {entra > 0 && <div className="tl-anim tl-anim-in" style={{ width: x(entra) }} title={`Entrada: ${entra} quadros`} data-testid={`in-${layer.id}`}
                      onPointerDown={gesto((d) => escalarAnimacoes(layer, 'in', clamp(entra + d, 1, layer.durationFrames - sai)))} />}
                    {sai > 0 && <div className="tl-anim tl-anim-out" style={{ width: x(sai) }} title={`Saída: ${sai} quadros`} data-testid={`out-${layer.id}`}
                      onPointerDown={gesto((d) => escalarAnimacoes(layer, 'out', clamp(sai - d, 1, layer.durationFrames - entra)))} />}
                    <div className="tl-edge" title="Arraste para mudar a duração" data-testid={`edge-${layer.id}`}
                      onPointerDown={layer.locked ? undefined : gesto((d) => {
                        const minimo = Math.max(1, entra + sai, ...Object.values(layer.keyframes ?? {}).map((t) => t[t.length - 1].frame + 1));
                        return [{ type: 'layer.update', layerId: layer.id, patch: { durationFrames: clamp(layer.durationFrames + d, minimo, cena.durationFrames - layer.startFrame) } }];
                      })} />
                  </div>
                </div>
              </div>
            );
          }))}

          <div className="tl-playhead" style={{ left: ROTULO + x(frame) }} data-testid="playhead"><b>{frame} · {seconds(frame, fps)}</b></div>
        </div>
      </div>
    </div>
  );
}
