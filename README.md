# VFX Motion AI — Motor 3D local (v3)

## O que esta versão oferece
- Cena 3D WebGL com Three.js: texto com extrusão geométrica real, luzes, materiais, anéis e partículas.
- Presets de Logo Reveal 3D, Órbita Cinematográfica, Tempestade de Partículas e Pulso de Energia.
- Controles de paleta, intensidade, duração e proporção (9:16, 1:1, 16:9).
- Importação opcional de logotipo PNG/JPG/WebP.
- Controles por toque para girar a cena.
- Exportação de vídeo WebM via MediaRecorder, captura PNG e exportação/importação de configurações JSON.
- PWA instalável e cache dos arquivos locais. O loop de renderização pausa quando a aba fica em segundo plano para economizar bateria.

## Limites importantes
- Não é IA generativa: os efeitos são procedurais e renderizados no aparelho. Não há API paga nem sistema de créditos.
- Three.js é carregado de um CDN gratuito (jsDelivr). O primeiro carregamento e a inicialização do motor 3D precisam de internet. Esta versão ainda não é totalmente offline.
- A exportação WebM depende do suporte do navegador Android a `canvas.captureStream()` e `MediaRecorder`; mantenha o Chrome em primeiro plano durante a renderização.
- A tipografia 3D é geométrica/procedural e simplificada; para preservar um logotipo oficial complexo, importe a imagem original.
- Desempenho, memória, bateria e suporte a WebGL variam por aparelho.

## Atualizar um repositório GitHub Pages existente
1. Extraia este ZIP no Android em **Meus Arquivos**.
2. No repositório GitHub, substitua os arquivos `index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `sw.js` e `README.md` pelos arquivos desta versão.
3. Envie também a pasta `icons` inteira, mantendo `icons/icon.svg` no caminho correto.
4. Faça commit na branch `main`. Se o GitHub não permitir substituir os arquivos pelo envio, abra cada arquivo no site, use o lápis **Edit**, substitua o conteúdo pelo arquivo correspondente e salve; para a pasta `icons`, envie `icons/icon.svg` mantendo o caminho.
5. Em **Settings → Pages**, mantenha `main` e `/(root)`. Aguarde a execução verde em **Actions**.
6. Abra o site publicado no Chrome. Se continuar mostrando a versão antiga, feche a aba, reabra o endereço e faça uma atualização forçada; o cache do service worker usa agora um nome novo.

## Publicar do zero
Envie todos os arquivos e pastas deste ZIP à raiz de um repositório público, depois ative **Settings → Pages → Deploy from a branch → main → /(root)**.
