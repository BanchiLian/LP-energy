/**
 * Carrossel infinito: rola sozinho e continua arrastável no dedo, no trackpad e no teclado.
 *
 * Marcação esperada: [data-carrossel] com overflow-x-auto, contendo um único filho com duas
 * listas idênticas (a segunda com aria-hidden). Ao chegar no início da cópia, a posição
 * volta exatamente uma lista, então o salto não aparece e a volta nunca acaba.
 *
 * - Pausa com o mouse em cima, durante o toque e com foco do teclado.
 * - Só anima quando está visível na tela.
 * - Com prefers-reduced-motion não anima, mas o loop infinito no arraste continua.
 */

const RETOMAR_APOS_TOQUE_MS = 2500;

function iniciarCarrossel(el, reduzMovimento) {
  const velocidade = Number(el.dataset.velocidade) || 40; // px por segundo
  let posicao = el.scrollLeft;
  let pausado = false;
  let visivel = false;
  let ultimoQuadro = 0;
  let timerToque = 0;
  let quadro = 0;

  const [lista1, lista2] = el.querySelectorAll(':scope > * > ul');

  // Distância de uma volta: do início da 1ª lista ao início da cópia.
  // (Não dá para usar scrollWidth / 2, porque ele soma o padding lateral do container.)
  // Medido só no início e ao redimensionar: ler layout a cada quadro força reflow.
  let periodoAtual = 0;
  const medir = () => { periodoAtual = lista2.offsetLeft - lista1.offsetLeft; };
  const periodo = () => periodoAtual;
  medir();
  window.addEventListener('resize', medir, { passive: true });

  // Faixa válida: [1, periodo + 1). As pontas são visualmente idênticas, então
  // a folga de 1px evita que 0 e periodo fiquem se jogando de um para o outro.
  function normalizar() {
    const p = periodo();
    if (p <= 0) return;
    if (el.scrollLeft >= p + 1) el.scrollLeft -= p;
    else if (el.scrollLeft < 1) el.scrollLeft += p;
  }

  function animar(agora) {
    quadro = 0;
    if (!visivel || pausado || reduzMovimento.matches) return;

    const dt = ultimoQuadro ? Math.min((agora - ultimoQuadro) / 1000, 0.05) : 0;
    ultimoQuadro = agora;

    // Se alguém rolou manualmente, parte de onde a pessoa deixou.
    if (Math.abs(el.scrollLeft - posicao) > 2) posicao = el.scrollLeft;

    posicao += velocidade * dt;
    const p = periodo();
    if (p > 0 && posicao >= p + 1) posicao -= p;
    el.scrollLeft = posicao;

    quadro = requestAnimationFrame(animar);
  }

  function retomar() {
    pausado = false;
    posicao = el.scrollLeft;
    ultimoQuadro = 0;
    if (!quadro) quadro = requestAnimationFrame(animar);
  }

  function pausar() {
    pausado = true;
    clearTimeout(timerToque);
  }

  el.addEventListener('scroll', normalizar, { passive: true });

  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') pausar();
  });
  el.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') retomar();
  });

  el.addEventListener('touchstart', pausar, { passive: true });
  el.addEventListener('touchend', () => {
    clearTimeout(timerToque);
    timerToque = setTimeout(retomar, RETOMAR_APOS_TOQUE_MS);
  }, { passive: true });

  el.addEventListener('focusin', pausar);
  el.addEventListener('focusout', retomar);

  // Começa um pouco depois do início, para dar para arrastar para a esquerda também.
  el.scrollLeft = 1;
  posicao = el.scrollLeft;

  reduzMovimento.addEventListener('change', () => {
    if (!reduzMovimento.matches) retomar();
  });

  return (estaVisivel) => {
    visivel = estaVisivel;
    if (visivel) retomar();
  };
}

// Guardado no módulo: um IntersectionObserver sem referência pode ser coletado pelo navegador.
const aoMudarVisibilidade = new Map();
let observador = null;

export function iniciarCarrosseis() {
  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
  observador = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => aoMudarVisibilidade.get(e.target)?.(e.isIntersecting));
  });

  document.querySelectorAll('[data-carrossel]').forEach((el) => {
    aoMudarVisibilidade.set(el, iniciarCarrossel(el, reduzMovimento));
    observador.observe(el);
  });
}
