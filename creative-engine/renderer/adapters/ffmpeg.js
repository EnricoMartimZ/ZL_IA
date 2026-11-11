// Render Adapter do FFmpeg: recebe quadros PNG e entrega um MP4 (H.264, yuv420p).
// O contrato de um adaptador é: available() diz se dá para usar; open() devolve { write, close }.
import { spawn, spawnSync } from 'node:child_process';

/** Onde está o FFmpeg: variável MAZY_FFMPEG, senão o do PATH. */
export const ffmpegPath = () => process.env.MAZY_FFMPEG || 'ffmpeg';
export const ffprobePath = () => process.env.MAZY_FFPROBE || (process.env.MAZY_FFMPEG ? process.env.MAZY_FFMPEG.replace(/ffmpeg([^/\\]*)$/, 'ffprobe$1') : 'ffprobe');

const COMO_INSTALAR = 'Instale o FFmpeg (no Ubuntu: sudo apt install ffmpeg) ou aponte a variável MAZY_FFMPEG para o programa.';

export const ffmpegAdapter = {
  id: 'ffmpeg',

  /** @returns {{ ok: boolean, version?: string, reason?: string }} */
  available() {
    const r = spawnSync(ffmpegPath(), ['-hide_banner', '-encoders'], { encoding: 'utf8' });
    if (r.error || r.status !== 0) return { ok: false, reason: `FFmpeg não encontrado. ${COMO_INSTALAR}` };
    if (!/\blibx264\b/.test(r.stdout)) return { ok: false, reason: `Este FFmpeg não tem o codificador libx264 (H.264). ${COMO_INSTALAR}` };
    const versao = spawnSync(ffmpegPath(), ['-version'], { encoding: 'utf8' }).stdout.split('\n')[0].replace(/^ffmpeg version (\S+).*$/, '$1');
    return { ok: true, version: versao };
  },

  /**
   * @param {{ width: number, height: number, fps: number, output: string, crf: number }} opcoes
   * @returns {{ write: (png: Buffer) => Promise<void>, close: () => Promise<{ output: string }> }}
   */
  open({ width, height, fps, output, crf }) {
    const args = [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', 'pipe:0',
      '-vf', `scale=${width}:${height}:flags=lanczos`,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-pix_fmt', 'yuv420p',
      '-r', String(fps), '-movflags', '+faststart', '-an', output,
    ];
    const processo = spawn(ffmpegPath(), args, { stdio: ['pipe', 'ignore', 'pipe'] });
    let erros = '';
    let falha = null;
    processo.stderr.on('data', (d) => { erros += d; });
    processo.stdin.on('error', (e) => { falha ??= e; }); // FFmpeg morreu no meio: o close conta o motivo
    const fim = new Promise((resolve, reject) => {
      processo.on('error', (e) => reject(new Error(`Não consegui iniciar o FFmpeg: ${e.message}`)));
      processo.on('close', (codigo) => (codigo === 0 ? resolve() : reject(new Error(`FFmpeg saiu com código ${codigo}: ${erros.trim().slice(-600) || falha?.message || 'sem mensagem'}`))));
    });
    fim.catch(() => {}); // quem trata é o close()
    return {
      write(png) {
        if (falha) return Promise.reject(new Error(`FFmpeg parou de receber quadros: ${erros.trim().slice(-300) || falha.message}`));
        return new Promise((resolve) => { if (processo.stdin.write(png)) resolve(); else processo.stdin.once('drain', resolve); });
      },
      async close() {
        processo.stdin.end();
        await fim;
        return { output };
      },
      abort() { processo.kill('SIGKILL'); },
    };
  },
};
