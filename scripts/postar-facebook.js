// Publica o carrossel de uma pasta de conteúdo na Página do Facebook (Meta Graph API).
//
// Uso:
//   node --env-file=.env scripts/postar-facebook.js marketing/conteudo/<slug>-<data> [--slug <slug>] [--dry-run]
//
// As imagens precisam estar públicas em <SITE_URL>/img/posts/<slug>/slide-XX.png.
// Cada slide sobe como foto não publicada e depois vira um único post com todas.

import { lerArgs, exigirEnv, slugDaPasta, listarSlides, urlsPublicas, lerLegenda, graph, rodar } from './lib/meta.js';

await rodar(async () => {
  const args = lerArgs(process.argv.slice(2));
  if (!args.pasta) throw new Error('uso: postar-facebook.js <pasta-do-conteudo> [--slug X] [--dry-run]');
  exigirEnv(['META_PAGE_ACCESS_TOKEN', 'META_PAGE_ID', 'SITE_URL'], args.dryRun);

  const slug = args.slug || slugDaPasta(args.pasta);
  const slides = await listarSlides(args.pasta);
  const urls = urlsPublicas(slug, slides);
  const legenda = await lerLegenda(args.pasta);

  const pagina = process.env.META_PAGE_ID || 'PAGE_ID';
  const opts = { dryRun: args.dryRun };

  const fotos = [];
  for (const url of urls) {
    const { id } = await graph(`${pagina}/photos`, { url, published: 'false' }, opts);
    fotos.push(id);
    console.log(`  foto ok: ${url}`);
  }

  const params = { message: legenda };
  fotos.forEach((id, i) => {
    params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
  });
  const { id: postId } = await graph(`${pagina}/feed`, params, opts);

  console.log(`Facebook publicado: ${postId} — https://facebook.com/${postId}`);
});
