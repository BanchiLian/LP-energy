# Decisões — LP Energy Treinamento

## Identidade extraída do site oficial (Fase 1)
- Paleta real (Elementor `--e-global-color-*`): accent `#A03A3B`, vermelho de marca `#CA3236`, primary `#111111`, escuros `#0E0E0E` / `#060607` / `#040404`, texto `#FFFFFF`, cinza `#4D4D4D`.
- Tipografia real: **Oswald** (títulos, pesos 300/500 no site) e **Montserrat** (corpo, 400). Não foi preciso recorrer a Sora/Space Grotesk.
- Logo branco baixado de `/wp-content/uploads/2024/08/White.png` para `public/img/originais/logo-white.png` (PNG 1000x500).
- Divergência de acessibilidade: o cinza oficial `#4D4D4D` dá 2,3:1 sobre fundo escuro (reprova AA). Uso `#A1A1AA` (7,6:1) em parágrafos e mantenho `#4D4D4D` só para bordas/divisórias.
- Divergência de acessibilidade: `#CA3236` como texto sobre fundo quase preto dá 3,8:1 (só AA para texto grande). Criado `#E8595C` (5,6:1) para texto de destaque; `#CA3236` fica em preenchimento de botão com texto branco (5,2:1).

## Decisões de projeto
- O projeto mora na raiz de `Peojeto jami/` (sem subpasta `energy-lp/`), para manter os caminhos curtos e o `prompt.md` ao lado.
- Tailwind CSS **v3** (não v4), porque a seção 6 exige design tokens em `tailwind.config.js`.
- O site é protegido por Mod_Security: qualquer download de asset precisa de User-Agent de navegador completo, senão retorna "Not Acceptable".

## Imagens (Fase 1)
- Os URLs listados na seção 4 do `prompt.md` são recortes reduzidos do Elementor (sufixo `-eNNNNNNNN`). Troquei todos pelo arquivo original do WordPress, no mesmo caminho e sem o sufixo, que é bem maior. Exemplo: o "hero" saiu de 372x1000 (retrato estreito) para 1500x1000 (paisagem).
- O script `scripts/otimizar-imagens.mjs` guarda uma lista de candidatos por slug e cai no URL do prompt se o original for bloqueado. Larguras alvo: 480, 960, 1200, 1600, sem upscale.
- `public/img/manifest.json` traz largura/altura intrínsecas, larguras geradas e o candidato usado por slug — a Fase 2 usa isso para `width`/`height`/`srcset` e evitar CLS.
- Limite do material de origem: só `squash` (1600px), `eventos` (1920px) e `energy-road` (1707px) chegam a 1600. O hero tem no máximo 1500px de largura — suficiente a 1x, mas macio em tela retina. Vale pedir os originais em alta ao cliente.
- `restaurante` e `churrasqueira` só existem a 849x650; entram na galeria horizontal em tamanho de card, onde isso basta.

## Ajustes pedidos pelo cliente apos ver a Fase 2
- **Formulario envia por WhatsApp.** Decisao do cliente, fecha a pergunta da secao 7 do prompt. Formspree e webhook ficam como alternativas comentadas no topo de `src/formulario.js`.
- **Mapa visivel na pagina.** Trocado o botao "Carregar o mapa" por um `<iframe>` do Google Maps com `loading="lazy"` nativo do HTML: adia o carregamento sem uma linha de JS e mantem CLS zero pela proporcao fixa. Link "Abrir no Google Maps" logo abaixo.
- **Video institucional removido.** O cliente nao tem video. A fachada com o ID `VhBl3dHT5SY` saiu da secao Estrutura.
- **Pilates e Fisioterapia passam a usar as fotos do site**, a pedido do cliente. Isso contraria a secao 4 do `prompt.md`, que mandava deixar placeholder por serem banco de imagens. A instrucao do cliente vence e fica registrada aqui.
  - Ressalva de licenciamento: o arquivo de Pilates se chama `depositphotos_81541380-stock-photo-pilates-woman-in-reformer-teaser.webp`, ou seja, e uma imagem licenciada da Depositphotos. Reusar na LP do mesmo cliente tende a estar coberto pela licenca que ele ja comprou para o site, mas convem confirmar com ele antes de publicar. Vale o mesmo cuidado para `o-que-e-fisioterapia.webp`.
  - Pilates so existe a 600x421: gera apenas a largura 480. Fisioterapia tem 1500x1000: gera 480, 960 e 1200.
- **Lighthouse autorizado** como ferramenta de auditoria (`npx lighthouse`), fora do bundle.

## Fase 2 fechada — auditoria
- Lighthouse mobile: Performance 99, Acessibilidade 100, Boas praticas 96, SEO 100. LCP 1890ms, CLS 0,043, TBT 0ms. Todas as metas da secao 8 batidas.
- O que derrubou o LCP de 2677ms para 1890ms foi hospedar as fontes localmente em `public/fonts/` (3 woff2, ~50 KB): sairam os dois preconnect e o `<link rel="stylesheet">` para fonts.googleapis.com, entrou um `preload` so do Oswald 500 do `<h1>`.
- `sizes` do hero fica em `100vw`. Uma tentativa de declarar `50vw` para ganhar LCP foi revertida: o hero e de largura total, entao isso fazia o celular baixar a variante de 480px e exibi-la esticada. Nitidez do hero vale mais que os ~200ms.
- Auditorias que seguem marcadas (cache lifetimes, render-blocking, network dependency tree, image delivery) sao informativas e dependem dos headers do servidor de hospedagem, nao do codigo. Revisitar na Fase 5.
