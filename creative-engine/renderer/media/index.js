// Media Processing: medidas de imagem lidas do cabeçalho do arquivo, hash e conferência de vídeo.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ffprobePath } from '../adapters/ffmpeg.js';

/**
 * Largura e altura de PNG, JPEG, GIF, WebP ou SVG, sem biblioteca. null se não reconhecer.
 * @param {Buffer} dados
 * @returns {{ width: number, height: number } | null}
 */
export function imageSize(dados) {
  if (dados.length >= 24 && dados.readUInt32BE(0) === 0x89504e47) return { width: dados.readUInt32BE(16), height: dados.readUInt32BE(20) };
  if (dados.length >= 10 && dados.toString('latin1', 0, 3) === 'GIF') return { width: dados.readUInt16LE(6), height: dados.readUInt16LE(8) };
  if (dados.length >= 4 && dados[0] === 0xff && dados[1] === 0xd8) {
    let i = 2;
    while (i + 9 < dados.length) {
      if (dados[i] !== 0xff) { i++; continue; }
      const marca = dados[i + 1];
      // SOF0 a SOF15, menos os que não são quadro (DHT, JPG, DAC)
      if (marca >= 0xc0 && marca <= 0xcf && marca !== 0xc4 && marca !== 0xc8 && marca !== 0xcc) {
        return { width: dados.readUInt16BE(i + 7), height: dados.readUInt16BE(i + 5) };
      }
      if (marca === 0xd8 || (marca >= 0xd0 && marca <= 0xd7) || marca === 0x01) { i += 2; continue; }
      i += 2 + dados.readUInt16BE(i + 2);
    }
    return null;
  }
  if (dados.length >= 30 && dados.toString('latin1', 0, 4) === 'RIFF' && dados.toString('latin1', 8, 12) === 'WEBP') {
    const tipo = dados.toString('latin1', 12, 16);
    if (tipo === 'VP8 ') return { width: dados.readUInt16LE(26) & 0x3fff, height: dados.readUInt16LE(28) & 0x3fff };
    if (tipo === 'VP8L') { const b = dados.readUInt32LE(21); return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 }; }
    if (tipo === 'VP8X') return { width: dados.readUIntLE(24, 3) + 1, height: dados.readUIntLE(27, 3) + 1 };
    return null;
  }
  const texto = dados.toString('utf8', 0, Math.min(dados.length, 4096));
  const svg = /<svg\b[^>]*>/i.exec(texto)?.[0];
  if (svg) {
    const numero = (nome) => { const m = new RegExp(`\\b${nome}\\s*=\\s*["']\\s*([0-9.]+)(px)?\\s*["']`, 'i').exec(svg); return m ? Number(m[1]) : null; };
    const w = numero('width'), h = numero('height');
    if (w && h) return { width: Math.round(w), height: Math.round(h) };
    const caixa = /\bviewBox\s*=\s*["']\s*[-0-9.]+[\s,]+[-0-9.]+[\s,]+([0-9.]+)[\s,]+([0-9.]+)\s*["']/i.exec(svg);
    if (caixa) return { width: Math.round(Number(caixa[1])), height: Math.round(Number(caixa[2])) };
  }
  return null;
}

const EXTENSOES = { image: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'], logo: ['.svg', '.png', '.webp', '.jpg', '.jpeg'], font: ['.woff2', '.woff', '.ttf', '.otf'] };

/** O tipo de asset que um arquivo pode ser, pela extensão. */
export function assetTypesFor(arquivo) {
  const ext = path.extname(arquivo).toLowerCase();
  return Object.entries(EXTENSOES).filter(([, lista]) => lista.includes(ext)).map(([tipo]) => tipo);
}

/** Medidas, tamanho e hash de um arquivo de asset. */
export function describeAsset(arquivo) {
  const dados = readFileSync(arquivo);
  const medidas = imageSize(dados);
  return { bytes: dados.length, sha256: createHash('sha256').update(dados).digest('hex'), ...(medidas ?? {}) };
}

/**
 * Confere um vídeo com o ffprobe, contando os quadros de verdade.
 * @returns {{ width: number, height: number, codec: string, pixelFormat: string, fps: number, frames: number, seconds: number }}
 */
export function probeVideo(arquivo) {
  const r = spawnSync(ffprobePath(), ['-v', 'error', '-select_streams', 'v:0', '-count_frames',
    '-show_entries', 'stream=width,height,codec_name,pix_fmt,r_frame_rate,nb_read_frames:format=duration', '-of', 'json', arquivo], { encoding: 'utf8' });
  if (r.error || r.status !== 0) throw new Error(`ffprobe falhou em ${arquivo}: ${r.error?.message ?? r.stderr.trim()}`);
  const { streams: [s], format } = JSON.parse(r.stdout);
  const [n, d] = s.r_frame_rate.split('/').map(Number);
  return { width: s.width, height: s.height, codec: s.codec_name, pixelFormat: s.pix_fmt, fps: n / d, frames: Number(s.nb_read_frames), seconds: Number(format.duration) };
}
