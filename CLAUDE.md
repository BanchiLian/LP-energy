# Energy Treinamento — Landing Page

LP estática de captação de leads. A especificação completa está em `prompt.md`; as decisões
tomadas estão em `DECISOES.md`. Leia apenas as seções citadas na tarefa, nunca o prompt inteiro.

## Stack
Vite (sem framework) · Tailwind CSS v3 (tokens em `tailwind.config.js`) · JS vanilla em módulos ES
GSAP + ScrollTrigger · Lenis · sharp (`npm run img`). Sem React, sem jQuery, sem backend.

## Tokens da marca (extraídos do site oficial — não invente cor nova)
Cores: `energy-red` #CA3236 (botão) · `energy-wine` #A03A3B (hover/borda) · `energy-red-lt` #E8595C
(texto de destaque) · `ink-0` #0B0B0C · `ink-1` #111111 · `ink-2` #060607 · `line` #4D4D4D · `muted` #A1A1AA.
Fontes: `font-display` = Oswald (títulos) · `font-sans` = Montserrat (corpo).
Nunca use #4D4D4D como texto e nunca #CA3236 como texto sobre fundo escuro: reprovam AA.

## Regras invioláveis
- Conteúdo só do cliente. Nunca invente número (alunos, anos, avaliações) — deixe variável e pergunte.
- Pilates e Fisioterapia ficam com placeholder: as fotos do site são de banco de imagens.
- `prefers-reduced-motion` desliga toda animação de scroll e o canvas do hero.
- WhatsApp sempre via `https://api.whatsapp.com/send?phone=5519996364904&text=` + texto codificado,
  variando a mensagem conforme a origem do clique.
- Metas Lighthouse mobile: performance >=90, acessibilidade >=95, boas praticas >=95, SEO >=95.
  JS total < 150 KB comprimido. Corte qualquer efeito que passe de 30 KB de JS ou 100 ms de bloqueio.
- Imagens sempre com width, height, srcset e loading="lazy" (exceto o hero).
- Projeto pequeno: ~10 arquivos-fonte. Nao crie README, testes de UI nem refatoracao nao pedida.

## Download de assets do site do cliente
O servidor usa Mod_Security: `curl` precisa de User-Agent de navegador completo, senao retorna
"Not Acceptable". Prefixo das imagens: `https://energytreinamento.com.br`.
