// Inspector: as propriedades do que está selecionado (camada, cena ou, sem seleção, o projeto).
// Cada campo vira um comando do Core. Valor recusado aparece como erro embaixo do campo e não é gravado.
import { useEffect, useState } from 'react';
import { EASING_NAMES, listPresets, listTransitions } from '../../../core/src/index.js';
import { findLayer, uniqueId } from '../util.js';

const DIRECOES = [['up', 'sobe'], ['down', 'desce'], ['left', 'para a esquerda'], ['right', 'para a direita']];
const PAPEIS = [['hook', 'Gancho'], ['product', 'Produto'], ['offer', 'Oferta'], ['proof', 'Prova'], ['deadline', 'Prazo'], ['cta', 'Chamada'], ['other', 'Outro']];

/** Campo que só manda o valor ao sair dele ou no Enter, e mostra o erro do comando. */
function Field({ label, value, onCommit, type = 'text', testid, step, multiline, hint }) {
  const [texto, setTexto] = useState(String(value ?? ''));
  const [erro, setErro] = useState(null);
  useEffect(() => { setTexto(String(value ?? '')); setErro(null); }, [value]);
  const enviar = () => {
    if (texto === String(value ?? '')) return;
    const novo = type === 'number' ? Number(texto.replace(',', '.')) : texto;
    if (type === 'number' && (texto.trim() === '' || Number.isNaN(novo))) { setErro('Tem que ser um número.'); return; }
    const recusa = onCommit(novo);
    if (recusa) setErro(recusa.problems?.[0]?.message ?? recusa.message); else setErro(null);
  };
  const comum = { value: texto, 'data-testid': testid, onChange: (e) => setTexto(e.target.value), onBlur: enviar, className: erro ? 'has-error' : '' };
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? <textarea rows={3} {...comum} /> : <input type="text" inputMode={type === 'number' ? 'decimal' : 'text'} step={step} {...comum} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setTexto(String(value ?? '')); setErro(null); } }} />}
      {erro && <em className="field-error" data-testid={testid && `${testid}-error`}>{erro}</em>}
      {hint && !erro && <em className="field-hint">{hint}</em>}
    </label>
  );
}

function Select({ label, value, options, onCommit, testid }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value ?? ''} data-testid={testid} onChange={(e) => onCommit(e.target.value)}>
        {options.map(([v, nome]) => <option key={v} value={v}>{nome}</option>)}
      </select>
    </label>
  );
}

function ColorField({ label, value, brand, onCommit, testid }) {
  const tokens = ['brand.background', 'brand.text', 'brand.accent', ...(brand.colors.darkBase ? ['brand.darkBase'] : []), ...(brand.colors.secondary ?? []).map((_, i) => `brand.secondary.${i}`)];
  const cor = (t) => (t.startsWith('brand.secondary') ? brand.colors.secondary[Number(t.split('.')[2])] : brand.colors[t.split('.')[1]]);
  return (
    <div className="field">
      <Field label={label} value={value} onCommit={onCommit} testid={testid} hint="#RRGGBB ou uma cor da marca" />
      <div className="swatches">
        {tokens.map((t) => <button key={t} type="button" className={value === t ? 'is-on' : ''} style={{ background: cor(t) }} title={t} onClick={() => onCommit(t)} />)}
        <button type="button" className={value === '#FFFFFF' ? 'is-on' : ''} style={{ background: '#FFFFFF' }} title="#FFFFFF" onClick={() => onCommit('#FFFFFF')} />
      </div>
    </div>
  );
}

const Grupo = ({ titulo, children }) => <section className="group"><h3>{titulo}</h3>{children}</section>;
const Par = ({ children }) => <div className="pair">{children}</div>;

function Animacoes({ store, layer }) {
  const presets = listPresets().map((p) => [p.id, p.id]);
  const mudar = (a, patch) => store.dispatch([{ type: 'animation.update', layerId: layer.id, animationId: a.id, patch }]);
  const nova = (role) => store.dispatch([{ type: 'animation.add', layerId: layer.id, animation: { id: uniqueId(role === 'in' ? 'entra' : 'sai', (layer.animations ?? []).map((a) => a.id)), preset: 'fade', role, durationFrames: 10 } }]);
  return (
    <Grupo titulo="Entrada e saída">
      {(layer.animations ?? []).map((a) => (
        <div key={a.id} className="anim" data-testid={`anim-${a.id}`}>
          <Par>
            <Select label={a.role === 'in' ? 'Entrada' : 'Saída'} value={a.preset} options={presets} onCommit={(v) => mudar(a, { preset: v, params: v === 'slide' ? { direction: a.params?.direction ?? 'up' } : null })} />
            <Field label="Quadros" type="number" value={a.durationFrames} onCommit={(v) => mudar(a, { durationFrames: v })} testid={`anim-${a.id}-duration`} />
          </Par>
          <Par>
            <Field label={a.role === 'in' ? 'Espera' : 'Folga no fim'} type="number" value={a.delayFrames ?? 0} onCommit={(v) => mudar(a, { delayFrames: v })} />
            <Select label="Curva" value={typeof a.easing === 'string' ? a.easing : ''} options={[['', 'padrão'], ...EASING_NAMES.map((n) => [n, n])]} onCommit={(v) => mudar(a, { easing: v || null })} />
          </Par>
          {a.preset === 'slide' && <Par>
            <Select label="Sentido" value={a.params?.direction ?? 'up'} options={DIRECOES} onCommit={(v) => mudar(a, { params: { direction: v } })} />
            <Field label="Distância (px)" type="number" value={a.params?.distance ?? 80} onCommit={(v) => mudar(a, { params: { distance: v } })} />
          </Par>}
          {a.preset === 'scale' && <Field label={a.role === 'in' ? 'Escala de partida' : 'Escala de chegada'} type="number" value={a.params?.scale ?? 0.8} onCommit={(v) => mudar(a, { params: { scale: v } })} />}
          <button type="button" className="link danger" onClick={() => store.dispatch([{ type: 'animation.remove', layerId: layer.id, animationId: a.id }])}>remover</button>
        </div>
      ))}
      <div className="row-buttons">
        <button type="button" onClick={() => nova('in')} data-testid="add-in">+ entrada</button>
        <button type="button" onClick={() => nova('out')} data-testid="add-out">+ saída</button>
      </div>
    </Grupo>
  );
}

function CamadaInspector({ store, project, scene, layer }) {
  const mudar = (patch) => store.dispatch([{ type: 'layer.update', layerId: layer.id, patch }]);
  const t = layer.transform ?? {};
  const assets = (tipo) => project.assets.filter((a) => a.type === tipo).map((a) => [a.id, a.name ?? a.id]);
  const trilhas = Object.keys(layer.keyframes ?? {});
  return (
    <>
      <Grupo titulo={`Camada · ${layer.type}`}>
        <Field label="Nome" value={layer.name} onCommit={(v) => mudar({ name: v })} testid="f-name" />
        <Par>
          <Field label="Começa no quadro" type="number" value={layer.startFrame} onCommit={(v) => mudar({ startFrame: v })} testid="f-start" hint={`da cena (${scene.durationFrames} quadros)`} />
          <Field label="Dura (quadros)" type="number" value={layer.durationFrames} onCommit={(v) => mudar({ durationFrames: v })} testid="f-duration" />
        </Par>
        <label className="check"><input type="checkbox" checked={Boolean(layer.locked)} onChange={(e) => mudar({ locked: e.target.checked || null })} data-testid="f-locked" /> Travar no palco</label>
        <label className="check"><input type="checkbox" checked={layer.visible !== false} onChange={(e) => mudar({ visible: e.target.checked ? null : false })} /> Visível</label>
      </Grupo>

      <Grupo titulo="Posição e tamanho">
        <Par>
          <Field label="X" type="number" value={layer.box.x} onCommit={(v) => mudar({ box: { x: v } })} testid="f-x" />
          <Field label="Y" type="number" value={layer.box.y} onCommit={(v) => mudar({ box: { y: v } })} testid="f-y" />
        </Par>
        <Par>
          <Field label="Largura" type="number" value={layer.box.width} onCommit={(v) => mudar({ box: { width: v } })} testid="f-width" />
          <Field label="Altura" type="number" value={layer.box.height} onCommit={(v) => mudar({ box: { height: v } })} testid="f-height" />
        </Par>
        <Par>
          <Field label="Opacidade (0 a 1)" type="number" value={layer.opacity ?? 1} onCommit={(v) => mudar({ opacity: v })} testid="f-opacity" />
          <Field label="Escala" type="number" value={t.scale ?? 1} onCommit={(v) => mudar({ transform: { scale: v } })} testid="f-scale" />
        </Par>
        <Field label="Rotação (graus)" type="number" value={t.rotation ?? 0} onCommit={(v) => mudar({ transform: { rotation: v } })} testid="f-rotation" />
        {trilhas.length > 0 && <p className="note">Com keyframes: {trilhas.join(', ')}. Nessas propriedades, o valor da trilha vale mais que o daqui.</p>}
      </Grupo>

      {layer.type === 'text' && (
        <Grupo titulo="Texto">
          <Field label="Conteúdo" multiline value={layer.text.content} onCommit={(v) => mudar({ text: { content: v } })} testid="f-content" />
          <Par>
            <Select label="Fonte" value={layer.text.fontFamily} options={[['brand.heading', `Títulos (${project.brand.fonts.heading.family})`], ['brand.body', `Corpo (${project.brand.fonts.body.family})`]]} onCommit={(v) => mudar({ text: { fontFamily: v } })} testid="f-font" />
            <Field label="Tamanho (px)" type="number" value={layer.text.fontSize} onCommit={(v) => mudar({ text: { fontSize: v } })} testid="f-fontsize" />
          </Par>
          <Par>
            <Field label="Peso" type="number" value={layer.text.fontWeight ?? 400} onCommit={(v) => mudar({ text: { fontWeight: v } })} />
            <Field label="Entrelinha" type="number" value={layer.text.lineHeight ?? 1.1} onCommit={(v) => mudar({ text: { lineHeight: v } })} />
          </Par>
          <Par>
            <Select label="Alinhar" value={layer.text.align ?? 'left'} options={[['left', 'esquerda'], ['center', 'centro'], ['right', 'direita']]} onCommit={(v) => mudar({ text: { align: v } })} />
            <Select label="Na vertical" value={layer.text.verticalAlign ?? 'top'} options={[['top', 'em cima'], ['middle', 'no meio'], ['bottom', 'embaixo']]} onCommit={(v) => mudar({ text: { verticalAlign: v } })} />
          </Par>
          <ColorField label="Cor" value={layer.text.color} brand={project.brand} onCommit={(v) => mudar({ text: { color: v } })} testid="f-color" />
        </Grupo>
      )}
      {layer.type === 'image' && (
        <Grupo titulo="Imagem">
          <Select label="Arquivo" value={layer.image.assetId} options={assets('image')} onCommit={(v) => mudar({ image: { assetId: v } })} />
          <Par>
            <Select label="Encaixe" value={layer.image.fit ?? 'cover'} options={[['cover', 'preencher (corta)'], ['contain', 'inteira']]} onCommit={(v) => mudar({ image: { fit: v } })} />
            <Field label="Canto arredondado" type="number" value={layer.image.borderRadius ?? 0} onCommit={(v) => mudar({ image: { borderRadius: v } })} />
          </Par>
          <Par>
            <Field label="Foco X (0 a 1)" type="number" value={layer.image.focusX ?? 0.5} onCommit={(v) => mudar({ image: { focusX: v } })} />
            <Field label="Foco Y (0 a 1)" type="number" value={layer.image.focusY ?? 0.5} onCommit={(v) => mudar({ image: { focusY: v } })} />
          </Par>
        </Grupo>
      )}
      {layer.type === 'logo' && <Grupo titulo="Logo"><Select label="Arquivo" value={layer.logo.assetId} options={assets('logo')} onCommit={(v) => mudar({ logo: { assetId: v } })} /><p className="note">O logo entra sempre inteiro e sem distorção.</p></Grupo>}
      {layer.type === 'shape' && (
        <Grupo titulo="Forma">
          <Par>
            <Select label="Tipo" value={layer.shape.kind} options={[['rect', 'retângulo'], ['ellipse', 'elipse']]} onCommit={(v) => mudar({ shape: { kind: v } })} />
            <Field label="Canto arredondado" type="number" value={layer.shape.borderRadius ?? 0} onCommit={(v) => mudar({ shape: { borderRadius: v } })} />
          </Par>
          <ColorField label="Preenchimento" value={layer.shape.fill ?? ''} brand={project.brand} onCommit={(v) => mudar({ shape: { fill: v } })} testid="f-fill" />
        </Grupo>
      )}
      <Animacoes store={store} layer={layer} />
    </>
  );
}

function CenaInspector({ store, project, scene }) {
  const indice = project.scenes.indexOf(scene);
  const mudar = (patch) => store.dispatch([{ type: 'scene.update', sceneId: scene.id, patch }]);
  const t = scene.transitionIn;
  const transicao = (nova) => store.dispatch([{ type: 'scene.setTransition', sceneId: scene.id, transition: nova }]);
  return (
    <>
      <Grupo titulo="Cena">
        <Field label="Nome" value={scene.name} onCommit={(v) => mudar({ name: v })} testid="s-name" />
        <Par>
          <Field label="Dura (quadros)" type="number" value={scene.durationFrames} onCommit={(v) => mudar({ durationFrames: v })} testid="s-duration" />
          <Select label="Papel no roteiro" value={scene.beat?.role ?? 'other'} options={PAPEIS} onCommit={(v) => mudar({ beat: { role: v } })} />
        </Par>
        <ColorField label="Fundo" value={scene.background ?? ''} brand={project.brand} onCommit={(v) => mudar({ background: v || null })} testid="s-background" />
      </Grupo>
      {indice > 0 && (
        <Grupo titulo="Como a cena entra">
          <Select label="Transição" value={t?.type ?? ''} options={[['', 'corte seco'], ...listTransitions().map((x) => [x.id, x.id])]} testid="s-transition"
            onCommit={(v) => transicao(v ? { type: v, durationFrames: t?.durationFrames ?? 12, ...(v !== 'fade' ? { direction: t?.direction ?? 'left' } : {}) } : null)} />
          {t && <Par>
            <Field label="Quadros" type="number" value={t.durationFrames} onCommit={(v) => transicao({ ...t, durationFrames: v })} testid="s-transition-duration" />
            {t.type !== 'fade' && <Select label="Sentido" value={t.direction ?? 'left'} options={DIRECOES} onCommit={(v) => transicao({ ...t, direction: v })} />}
          </Par>}
        </Grupo>
      )}
    </>
  );
}

export function Inspector({ store, state }) {
  const { project, selection } = state;
  const achada = selection?.layerId ? findLayer(project, selection.layerId) : null;
  const cena = selection?.sceneId ? project.scenes.find((s) => s.id === selection.sceneId) : null;
  return (
    <aside className="inspector" data-testid="inspector">
      {achada ? <CamadaInspector store={store} project={project} scene={achada.scene} layer={achada.layer} key={achada.layer.id} />
        : cena ? <CenaInspector store={store} project={project} scene={cena} key={cena.id} />
          : (
            <Grupo titulo="Projeto">
              <Field label="Nome" value={project.project.name} onCommit={(v) => store.dispatch([{ type: 'project.update', patch: { name: v } }])} testid="p-name" />
              <Field label="Qualidade do MP4 (CRF)" type="number" value={project.export.crf} onCommit={(v) => store.dispatch([{ type: 'export.update', patch: { crf: v } }])} hint="18 é entrega; 28 é rascunho" />
              <p className="note">Clique numa camada no palco ou na timeline para editar.</p>
            </Grupo>
          )}
    </aside>
  );
}
