import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';
import { createStore } from './state/store.js';
import { api } from './api/client.js';

const raiz = createRoot(document.getElementById('app'));
try {
  const aberto = await api.open();
  const store = createStore({ project: aberto.project, revision: aberto.revision });
  window.__editor = { store }; // para os testes de ponta a ponta e para depurar
  raiz.render(<App store={store} name={aberto.name} />);
} catch (e) {
  raiz.render(<div className="fatal"><h1>Não consegui abrir o projeto</h1><p>{e.message}</p></div>);
}
