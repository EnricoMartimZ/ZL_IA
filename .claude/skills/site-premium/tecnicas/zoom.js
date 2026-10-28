// Zoom contínuo — a câmera mergulha de uma cena na próxima sem corte: a cena seguinte já está
// dentro da anterior, pequena, e cresce até ocupar a tela. Uma história inteira num plano-sequência.
// Serve pra contar processo e escala: do bairro à fachada, da fachada à bancada, da bancada ao detalhe
// (o parafuso, a fibra, o filtro). Só CSS transform: leve, sem WebGL.
//
// import { zoom } from './tecnicas/zoom.js';
// const z = zoom(document.querySelector('#quadro'), [
//   'img/zoom/1-bairro.webp', 'img/zoom/2-fachada.webp', 'img/zoom/3-bancada.webp', 'img/zoom/4-detalhe.webp',
// ], { fator: 3.5, proporcao: 16 / 10 });
// palco(secao, z.progresso);
//
// Pra emenda não aparecer, as imagens são geradas em cadeia (ver tecnicas/README.md, "Zoom contínuo"):
// o centro da imagem N, reduzido `fator` vezes, É a imagem N+1. Todas com a mesma proporção.
// Cada camada mantém a proporção da imagem e cobre a tela (sem recortar com object-fit), então o
// encaixe continua exato em qualquer tela, do celular em pé ao monitor largo.

export function zoom(quadro, imagens, opcoes = {}) {
  // moldura: true mostra a próxima cena como um quadro (cantos + sombra + troca suave) — pra imagens que
  // NÃO emendam. Sem moldura (padrão), com imagens em cadeia, o mergulho não tem corte nenhum.
  const o = { fator: 3.5, proporcao: 16 / 10, moldura: false, cantos: 18, ...opcoes };
  if (o.moldura) quadro.classList.add('zoom-moldura');
  const camadas = imagens.map((src, j) => {
    const d = document.createElement('div');
    d.className = 'zoom-camada';
    d.style.zIndex = String(j + 1);
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.decoding = 'async';
    if (j > 1) img.loading = 'lazy';
    d.appendChild(img);
    quadro.appendChild(d);
    return d;
  });
  const n = camadas.length;
  let ultimoP = 0;

  function ajustar() {
    const W = quadro.clientWidth, H = quadro.clientHeight;
    const w = W / H > o.proporcao ? W : H * o.proporcao;
    const h = w / o.proporcao;
    for (const d of camadas) { d.style.width = `${w}px`; d.style.height = `${h}px`; }
  }
  new ResizeObserver(() => { ajustar(); progresso(ultimoP); }).observe(quadro);
  ajustar();

  function progresso(p) {
    ultimoP = p;
    const x = Math.min(1, Math.max(0, p)) * (n - 1);
    camadas.forEach((d, j) => {
      const e = x - j; // 0 = ocupando a tela; <0 = ainda dentro da anterior; >0 = já passou
      // a de fora só some quando a de dentro já cobriu a tela inteira (e >= 1)
      const fim = o.moldura ? 1.15 : 1;
      if (e < -1.3 || e >= fim) { d.style.visibility = 'hidden'; return; }
      d.style.visibility = 'visible';
      const s = o.fator ** e;
      d.style.transform = `translate(-50%, -50%) scale(${s})`;
      d.style.opacity = o.moldura && e > 0 ? String(1 - Math.min(1, Math.max(0, (e - 0.55) / 0.45))) : '1';
      if (o.moldura) d.style.borderRadius = `${Math.min(1, Math.max(0, -e)) * o.cantos / Math.max(s, 0.001)}px`;
      d.style.setProperty('--e', e.toFixed(3));
    });
  }
  progresso(0);
  return { progresso };
}
