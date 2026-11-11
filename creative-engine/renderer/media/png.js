// Leitor de PNG sem biblioteca, para os testes e a crítica conferirem a cor de um ponto.
// Cobre o que o Chromium grava: 8 bits por canal, RGB ou RGBA, sem entrelaçamento.
import { inflateSync } from 'node:zlib';

/** @returns {{ width: number, height: number, pixel: (x: number, y: number) => [number, number, number, number] }} */
export function decodePng(dados) {
  if (dados.readUInt32BE(0) !== 0x89504e47) throw new Error('não é PNG');
  let pos = 8, largura = 0, altura = 0, canais = 0;
  const partes = [];
  while (pos < dados.length) {
    const tamanho = dados.readUInt32BE(pos);
    const tipo = dados.toString('latin1', pos + 4, pos + 8);
    const corpo = dados.subarray(pos + 8, pos + 8 + tamanho);
    if (tipo === 'IHDR') {
      largura = corpo.readUInt32BE(0); altura = corpo.readUInt32BE(4);
      const [bits, cor, , , entrelacado] = corpo.subarray(8);
      if (bits !== 8 || (cor !== 2 && cor !== 6) || entrelacado) throw new Error(`PNG fora do esperado (bits ${bits}, cor ${cor})`);
      canais = cor === 6 ? 4 : 3;
    } else if (tipo === 'IDAT') partes.push(corpo);
    else if (tipo === 'IEND') break;
    pos += 12 + tamanho;
  }
  const bruto = inflateSync(Buffer.concat(partes));
  const passo = largura * canais;
  const saida = Buffer.alloc(passo * altura);
  for (let y = 0; y < altura; y++) {
    const filtro = bruto[y * (passo + 1)];
    const linha = y * (passo + 1) + 1, destino = y * passo;
    for (let x = 0; x < passo; x++) {
      const a = x >= canais ? saida[destino + x - canais] : 0;
      const b = y > 0 ? saida[destino - passo + x] : 0;
      const c = x >= canais && y > 0 ? saida[destino - passo + x - canais] : 0;
      let previsto = 0;
      if (filtro === 1) previsto = a;
      else if (filtro === 2) previsto = b;
      else if (filtro === 3) previsto = (a + b) >> 1;
      else if (filtro === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); previsto = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      saida[destino + x] = (bruto[linha + x] + previsto) & 255;
    }
  }
  return {
    width: largura, height: altura,
    pixel: (x, y) => { const i = y * passo + x * canais; return [saida[i], saida[i + 1], saida[i + 2], canais === 4 ? saida[i + 3] : 255]; },
  };
}
