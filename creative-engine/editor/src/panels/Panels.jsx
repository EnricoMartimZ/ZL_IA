// Painéis que abrem por cima: histórico (checkpoints, versões, voltar) e crítica por regras.
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

function Modal({ titulo, onClose, children, testid }) {
  return (
    <div className="modal-back" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" data-testid={testid}>
        <header><h2>{titulo}</h2><button type="button" className="link" onClick={onClose} data-testid="modal-close">fechar</button></header>
        {children}
      </div>
    </div>
  );
}

export function HistoryPanel({ onClose, onRestored, beforeAction }) {
  const [itens, setItens] = useState(null);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState(null);
  const carregar = () => api.history().then((r) => setItens(r.items), (e) => setErro(e.message));
  useEffect(() => { carregar(); }, []);
  const fazer = async (acao) => { try { setErro(null); await beforeAction(); await acao(); await carregar(); } catch (e) { setErro(e.message); } };
  return (
    <Modal titulo="Histórico" onClose={onClose} testid="history">
      <div className="row-buttons">
        <button type="button" onClick={() => fazer(() => api.checkpoint('checkpoint do editor'))} data-testid="make-checkpoint">Guardar um ponto agora</button>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="nome da versão (ex.: aprovada pelo cliente)" data-testid="version-name" />
        <button type="button" disabled={!nome.trim()} onClick={() => fazer(async () => { await api.version(nome.trim()); setNome(''); })} data-testid="make-version">Guardar versão</button>
      </div>
      {erro && <p className="field-error">{erro}</p>}
      {itens === null ? <p className="note">Carregando…</p> : itens.length === 0 ? <p className="note">Ainda não há pontos guardados.</p> : (
        <ul className="history-list">
          {itens.map((h) => (
            <li key={h.id} data-testid={`history-${h.kind}`}>
              <span className={`kind kind-${h.kind}`}>{h.kind === 'version' ? '★ versão' : 'ponto'}</span>
              <span className="when">{h.at.slice(0, 19).replace('T', ' ')}</span>
              <span className="who">{h.source}</span>
              <span className="what">{h.label} <small>(revisão {h.revision})</small></span>
              <button type="button" onClick={() => fazer(async () => { await api.rollback(h.id); await onRestored(); })} data-testid="rollback">Voltar para este</button>
            </li>
          ))}
        </ul>
      )}
      <p className="note">Voltar guarda antes o estado atual: dá para desfazer voltando para o ponto “antes de voltar”.</p>
    </Modal>
  );
}

const NOMES = { legibilidade: 'Legibilidade', mensagem: 'Mensagem', marca: 'Marca', ritmo: 'Ritmo', tecnica: 'Técnica' };
const MARCAS = { critical: '✗', warning: '!', info: '·', strength: '✓' };

export function CritiquePanel({ onClose, beforeAction, onPick }) {
  const [critica, setCritica] = useState(null);
  const [erro, setErro] = useState(null);
  useEffect(() => { beforeAction().then(() => api.critique()).then(setCritica, (e) => setErro(e.message)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Modal titulo="Crítica por regras" onClose={onClose} testid="critique">
      {erro && <p className="field-error">{erro}</p>}
      {!critica && !erro && <p className="note">Medindo a peça…</p>}
      {critica && (
        <>
          <p className="score" data-testid="critique-score">{critica.score}<small>/100</small></p>
          {Object.entries(critica.dimensions).map(([nome, d]) => (
            <section key={nome} className="crit-dim">
              <h3>{NOMES[nome]} <small>{d.score}/100</small></h3>
              {d.findings.length === 0 && <p className="note">Nada a apontar.</p>}
              {d.findings.map((f, i) => (
                <p key={i} className={`finding finding-${f.severity}`} onClick={() => f.layerId && onPick(f.layerId)} style={{ cursor: f.layerId ? 'pointer' : 'default' }}>
                  <b>{MARCAS[f.severity]}</b> {f.message}
                </p>
              ))}
            </section>
          ))}
          <p className="note">Regra não mede composição, foto nem clareza da mensagem: isso se confere olhando a peça.</p>
        </>
      )}
    </Modal>
  );
}
