// O editor: barra de cima, painel de camadas e assets, palco, inspector e timeline.
// Grava sozinho depois de cada alteração e recarrega quando o projeto muda no disco (o Claude editou).
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getTimeline } from '../../core/src/index.js';
import { api, ASSET_BASE } from './api/client.js';
import { StageView } from './canvas/StageView.jsx';
import { Timeline } from './timeline/Timeline.jsx';
import { Inspector } from './inspector/Inspector.jsx';
import { LeftPanel } from './assets/LeftPanel.jsx';
import { HistoryPanel, CritiquePanel } from './panels/Panels.jsx';
import { seconds } from './util.js';

export function App({ store, name }) {
  const state = useSyncExternalStore(store.subscribe, store.getState);
  const { project, frame, dirty, revision, gesture } = state;
  const { fps } = project.composition;
  const total = getTimeline(project).totalFrames;

  const [gravacao, setGravacao] = useState('gravado'); // gravado | gravando | erro
  const [erroDeGravar, setErroDeGravar] = useState(null);
  const [conflito, setConflito] = useState(null);      // { revision } quando o disco andou e há alteração local
  const [aviso, setAviso] = useState(null);
  const [tocando, setTocando] = useState(false);
  const [painel, setPainel] = useState(null);          // 'historia' | 'critica'
  const [exportacao, setExportacao] = useState(null);  // { done, total } | { file, ... } | { error }
  const gravando = useRef(false);

  // ---- gravação automática ----
  const gravar = useCallback(async (baseRevision) => {
    const { project: atual, revision: noEstado } = store.getState();
    gravando.current = true;
    setGravacao('gravando');
    try {
      const r = await api.save(atual, baseRevision ?? noEstado);
      store.markSaved(r.revision, atual);
      setGravacao('gravado'); setErroDeGravar(null); setConflito(null);
    } catch (e) {
      if (e.status === 409) setConflito({ revision: e.currentRevision });
      else setErroDeGravar(e.problems?.[0]?.message ?? e.message);
      setGravacao('erro');
    } finally { gravando.current = false; }
  }, [store]);

  useEffect(() => {
    if (!dirty || gesture || conflito) return undefined;
    const espera = setTimeout(() => { if (!gravando.current) gravar(); }, 500);
    return () => clearTimeout(espera);
  }, [project, dirty, gesture, conflito, gravar]);

  const recarregar = useCallback(async (mensagem) => {
    const aberto = await api.open();
    store.load(aberto.project, aberto.revision);
    setConflito(null); setGravacao('gravado'); setErroDeGravar(null);
    if (mensagem) { setAviso(mensagem); setTimeout(() => setAviso(null), 4000); }
  }, [store]);

  // ---- avisos do servidor ----
  useEffect(() => api.events({
    'project-changed': ({ revision: noDisco }) => {
      const s = store.getState();
      if (noDisco === s.revision || gravando.current) return;
      if (s.dirty) setConflito({ revision: noDisco }); else recarregar('O projeto mudou no disco e foi recarregado.');
    },
    'render-progress': (p) => setExportacao(p),
    'render-done': (r) => setExportacao(r),
    'render-error': (e) => setExportacao({ error: e.problems?.[0]?.message ?? e.message }),
  }), [store, recarregar]);

  // ---- tocar ----
  useEffect(() => {
    if (!tocando) return undefined;
    const inicio = performance.now();
    const partida = store.getState().frame >= total - 1 ? 0 : store.getState().frame;
    let id;
    const passo = (agora) => {
      const f = partida + Math.floor((agora - inicio) * fps / 1000);
      if (f >= total) { store.setFrame(total - 1); setTocando(false); return; }
      store.setFrame(f);
      id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [tocando, fps, total, store]);

  // ---- teclado ----
  useEffect(() => {
    const tecla = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const s = store.getState();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) store.redo(); else store.undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); store.redo(); }
      else if (e.key === ' ') { e.preventDefault(); setTocando((t) => !t); }
      else if (e.key === 'ArrowRight') store.setFrame(s.frame + (e.shiftKey ? 10 : 1));
      else if (e.key === 'ArrowLeft') store.setFrame(s.frame - (e.shiftKey ? 10 : 1));
      else if ((e.key === 'Delete' || e.key === 'Backspace') && s.selection?.layerId) store.dispatch([{ type: 'layer.remove', layerId: s.selection.layerId }]);
      else if (e.key === 'Escape') store.select(null);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [store]);

  const exportar = async () => {
    if (store.getState().dirty) await gravar();
    setExportacao({ done: 0, total });
    try { await api.render(); } catch (e) { setExportacao({ error: e.message }); }
  };

  const situacao = conflito ? 'conflito' : gravacao === 'erro' ? 'não gravado' : dirty || gravacao === 'gravando' ? 'gravando…' : 'gravado';

  return (
    <div className="app">
      <header className="top">
        <div className="top-title"><b>{project.project.name}</b><span>{name} · revisão {revision}</span></div>
        <div className="top-actions">
          <button type="button" onClick={store.undo} disabled={!state.past.length} title="Desfazer (Ctrl+Z)" data-testid="undo">↶ Desfazer</button>
          <button type="button" onClick={store.redo} disabled={!state.future.length} title="Refazer (Ctrl+Shift+Z)" data-testid="redo">↷ Refazer</button>
          <span className={`save save-${situacao.replace(/\W+/g, '-')}`} data-testid="save-status">{situacao}</span>
          <button type="button" onClick={() => setPainel('critica')} data-testid="open-critique">Crítica</button>
          <button type="button" onClick={() => setPainel('historia')} data-testid="open-history">Histórico</button>
          <button type="button" className="primary" onClick={exportar} disabled={Boolean(exportacao && exportacao.done !== undefined && !exportacao.file)} data-testid="export">Exportar MP4</button>
        </div>
      </header>

      {conflito && (
        <div className="banner banner-warn" data-testid="conflict">
          O projeto mudou no disco (revisão {conflito.revision}) e você tem alteração que ainda não foi gravada.
          <button type="button" onClick={() => recarregar()} data-testid="conflict-reload">Ficar com a do disco</button>
          <button type="button" onClick={() => gravar(conflito.revision)} data-testid="conflict-overwrite">Gravar a minha por cima</button>
        </div>
      )}
      {erroDeGravar && !conflito && <div className="banner banner-error" data-testid="save-error">Não gravei: {erroDeGravar}</div>}
      {state.error && <div className="banner banner-error" data-testid="command-error" onClick={store.clearError}>{state.error.problems?.[0]?.message ?? state.error.message} <small>(clique para fechar)</small></div>}
      {aviso && <div className="banner" data-testid="notice">{aviso}</div>}
      {exportacao && (
        <div className={`banner ${exportacao.error ? 'banner-error' : ''}`} data-testid="export-status">
          {exportacao.error ? `A exportação falhou: ${exportacao.error}`
            : exportacao.file ? <>MP4 pronto: {exportacao.frames} quadros, {seconds(exportacao.frames, fps)}, em {(exportacao.renderMs / 1000).toFixed(0)} s. <a href={ASSET_BASE + exportacao.file} target="_blank" rel="noreferrer" data-testid="export-link">Abrir {exportacao.file}</a></>
              : <>Exportando: {exportacao.done} de {exportacao.total || total} quadros <progress value={exportacao.done} max={exportacao.total || total} /></>}
          {(exportacao.error || exportacao.file) && <button type="button" className="link" onClick={() => setExportacao(null)}>fechar</button>}
        </div>
      )}

      <main className="work">
        <LeftPanel store={store} state={state} />
        <section className="center">
          <StageView store={store} state={state} />
          <div className="transport">
            <button type="button" onClick={() => store.setFrame(0)} title="Voltar ao início">⏮</button>
            <button type="button" className="primary" onClick={() => setTocando((t) => !t)} data-testid="play">{tocando ? '⏸ Pausar' : '▶ Tocar'}</button>
            <button type="button" onClick={() => store.setFrame(frame - 1)} title="Quadro anterior (←)">◀</button>
            <button type="button" onClick={() => store.setFrame(frame + 1)} title="Próximo quadro (→)">▶</button>
            <span className="counter" data-testid="frame-counter">quadro {frame} de {total - 1} · {seconds(frame, fps)} de {seconds(total, fps)}</span>
          </div>
        </section>
        <Inspector store={store} state={state} />
      </main>

      <Timeline store={store} state={state} />

      {painel === 'historia' && <HistoryPanel onClose={() => setPainel(null)} onRestored={() => recarregar('Projeto restaurado.')} beforeAction={async () => { if (store.getState().dirty) await gravar(); }} />}
      {painel === 'critica' && <CritiquePanel onClose={() => setPainel(null)} beforeAction={async () => { if (store.getState().dirty) await gravar(); }} onPick={(layerId) => { const s = project.scenes.find((c) => c.layers.some((l) => l.id === layerId)); if (s) store.select({ sceneId: s.id, layerId }); }} />}
    </div>
  );
}
