// Publica o carrossel de uma pasta de conteúdo no Instagram (Meta Graph API).
//
// Uso:
//   node --env-file=.env scripts/postar-instagram.js marketing/conteudo/<slug>-<data> [--slug <slug>] [--dry-run]
//
// As imagens precisam estar públicas em <SITE_URL>/img/posts/<slug>/slide-XX.png
// (o /aprovar-post faz isso antes de chamar este script).
// --dry-run mostra as chamadas sem publicar nada.

import { lerArgs, exigirEnv, slugDaPasta, listarSlides, urlsPublicas, lerLegenda, graph, rodar } from './lib/meta.js';

const LIMITE_LEGENDA = 2200;

async function esperarProcessar(containerId, opts) {
  for (let tentativa = 0; tentativa < 30; tentativa++) {
    const { status_code } = await graph(containerId, { fields: 'status_code' }, { ...opts, metodo: 'GET' });
    if (status_code === 'FINISHED') return;
    if (status_code === 'ERROR' || status_code === 'EXPIRED') {
      throw new Error(`Instagram recusou a mídia ${containerId} (status ${status_code})`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`mídia ${containerId} não terminou de processar em 60s`);
}

await rodar(async () => {
  const args = lerArgs(process.argv.slice(2));
  if (!args.pasta) throw new Error('uso: postar-instagram.js <pasta-do-conteudo> [--slug X] [--dry-run]');
  exigirEnv(['META_PAGE_ACCESS_TOKEN', 'META_IG_USER_ID', 'SITE_URL'], args.dryRun);

  const slug = args.slug || slugDaPasta(args.pasta);
  const slides = await listarSlides(args.pasta);
  const urls = urlsPublicas(slug, slides);
  const legenda = await lerLegenda(args.pasta);
  if (legenda.length > LIMITE_LEGENDA) {
    throw new Error(`legenda com ${legenda.length} caracteres — o Instagram aceita até ${LIMITE_LEGENDA}`);
  }

  const ig = process.env.META_IG_USER_ID || 'IG_USER_ID';
  const opts = { dryRun: args.dryRun };
  let criacaoId;

  if (urls.length === 1) {
    console.log('post único');
    ({ id: criacaoId } = await graph(`${ig}/media`, { image_url: urls[0], caption: legenda }, opts));
  } else {
    console.log(`carrossel com ${urls.length} slides`);
    const filhos = [];
    for (const url of urls) {
      const { id } = await graph(`${ig}/media`, { image_url: url, is_carousel_item: 'true' }, opts);
      await esperarProcessar(id, opts);
      filhos.push(id);
      console.log(`  slide ok: ${url}`);
    }
    ({ id: criacaoId } = await graph(
      `${ig}/media`,
      { media_type: 'CAROUSEL', children: filhos.join(','), caption: legenda },
      opts,
    ));
  }

  await esperarProcessar(criacaoId, opts);
  const { id: postId } = await graph(`${ig}/media_publish`, { creation_id: criacaoId }, opts);

  let link = '';
  if (!args.dryRun) {
    ({ permalink: link } = await graph(postId, { fields: 'permalink' }, { metodo: 'GET' }));
  }
  console.log(`Instagram publicado: ${postId}${link ? ` — ${link}` : ''}`);
});
