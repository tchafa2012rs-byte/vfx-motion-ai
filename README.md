# VFX Motion AI — PWA local (MVP gratuito)

Este é um protótipo web independente de APIs de IA pagas. Ele usa Canvas 2D e APIs do navegador para criar uma animação gráfica com profundidade visual, partículas e luzes; permite carregar uma imagem e gravar a pré-visualização em vídeo WebM.

## O que já funciona
- Interface mobile-first em português.
- Efeitos gráficos locais: 3D Logo Reveal (profundidade simulada), partículas, energia e órbita.
- Texto, cores, formatos vertical/quadrado/horizontal e imagem de logotipo.
- Pré-visualização animada.
- Exportação WebM com `MediaRecorder` quando o navegador oferece suporte.
- Manifesto PWA e service worker para instalação/cache.
- Sem login, sem API, sem cobrança por geração.

## Limites honestos
- Este MVP não é um gerador de vídeo por IA e não cria cenas 3D reais com geometria 3D completa. A profundidade atual é simulada em Canvas 2D.
- A exportação é WebM, não MP4. Conversão para MP4 dentro do celular pode ser pesada; não foi incluído FFmpeg para manter o pacote leve.
- A instalação PWA requer HTTPS (ou localhost). Abrir o `index.html` diretamente não permite instalar o PWA.
- O navegador pode limitar a gravação se você trocar de aplicativo, bloquear a tela ou ficar sem memória.
- O projeto ainda precisa de testes em diferentes modelos Android e melhorias antes de ser considerado produção.

## Publicar gratuitamente com GitHub Pages
1. Crie uma conta no GitHub, caso não tenha.
2. Crie um repositório público chamado `vfx-motion-ai`.
3. Envie todos os arquivos e pastas deste pacote para a raiz do repositório.
4. No repositório, abra **Settings → Pages**.
5. Em **Build and deployment**, selecione **Deploy from a branch**, escolha `main` e `/ (root)`, e salve.
6. Aguarde o endereço HTTPS aparecer na página Pages.
7. Abra esse endereço no Chrome do Android. No menu `⋮`, escolha **Instalar app** ou **Adicionar à tela inicial**.

A hospedagem GitHub Pages é gratuita para repositórios públicos dentro das regras do serviço, mas é um serviço de terceiros. O código do app em si não depende do Lovable e pode ser hospedado em outro servidor estático compatível com HTTPS.

## Privacidade
O protótipo não faz upload das imagens escolhidas. Os arquivos são usados localmente para a pré-visualização e gravação. O cache do PWA armazena os arquivos da aplicação, não uma biblioteca de projetos.
