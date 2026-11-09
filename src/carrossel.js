/**
 * Carrossel infinito em passos: a cada N ms (data-intervalo, padrão 4000) avança um card,
 * com transição suave. Continua arrastável no dedo, no trackpad e no teclado.
 *
 * Marcação esperada: [data-carrossel] com overflow-x-auto, contendo um único filho com duas
 * listas idênticas (a segunda com aria-hidden). Ao passar do início da cópia, a posição
 * volta exatamente uma lista, então o salto não aparece e a volta nunca acaba.
 *
 * - Pausa com o mouse em cima, durante o toque e com foco do teclado.
 * - Só avança quando está visível na tela.
 * - Com prefers-reduced-motion não avança sozinho, mas o loop infinito no arraste continua.
 */

const DURACAO_TRANSICAO_MS = 700;
const RETOMAR_APOS_TOQUE_MS = 2500;

const suavizar = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function iniciarCarrossel(el, reduzMovimento) {
  const intervalo = Number(el.dataset.intervalo) || 4000;
  const [lista1, lista2] = el.querySelectorAll(':scope > * > ul');
  const [item1, item2] = lista1.children;

  // Medidas guardadas e refeitas só ao redimensionar: ler layout a cada quadro força reflow.
  let periodo = 0; // largura de uma lista inteira
  let passo = 0; // largura de um card + espaçamento
  // getBoundingClientRect (e não offsetLeft) porque os cards podem ter largura fracionária
  // (85vw) e o arredondamento acumularia desalinhamento a cada volta.
  const x = (n) => n.getBoundingClientRect().left;
  function medir() {
    periodo = x(lista2) - x(lista1);
    passo = item2 ? x(item2) - x(item1) : periodo;
  }

  let pausado = false;
  let visivel = false;
  let animando = false;
  let timer = 0;
  let timerToque = 0;

  // Faixa válida: [1, periodo + 1). As pontas são visualmente idênticas, então
  // a folga de 1px evita que 0 e periodo fiquem se jogando de um para o outro.
  function normalizar() {
    if (animando || periodo <= 0) return;
    if (el.scrollLeft >= periodo + 1) el.scrollLeft -= periodo;
    else if (el.scrollLeft < 1) el.scrollLeft += periodo;
  }

  function avancar() {
    if (passo <= 0) return;
    // Parte do card mais próximo, para alinhar mesmo depois de um arraste manual.
    const inicio = el.scrollLeft;
    const alvo = (Math.round(inicio / passo) + 1) * passo;
    const t0 = performance.now();
    animando = true;

    function quadro(agora) {
      const t = Math.min((agora - t0) / DURACAO_TRANSICAO_MS, 1);
      el.scrollLeft = inicio + (alvo - inicio) * suavizar(t);
      if (t < 1) {
        requestAnimationFrame(quadro);
        return;
      }
      animando = false;
      if (el.scrollLeft >= periodo + 1) el.scrollLeft -= periodo;
      agendar();
    }
    requestAnimationFrame(quadro);
  }

  function agendar() {
    clearTimeout(timer);
    if (!visivel || pausado || reduzMovimento.matches) return;
    // Desconta a transição, para que um card novo entre exatamente a cada "intervalo".
    timer = setTimeout(avancar, Math.max(0, intervalo - DURACAO_TRANSICAO_MS));
  }

  function pausar() {
    pausado = true;
    clearTimeout(timer);
    clearTimeout(timerToque);
  }

  function retomar() {
    pausado = false;
    if (!animando) agendar();
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

  window.addEventListener('resize', () => {
    medir();
    el.scrollLeft = Math.max(1, Math.round(el.scrollLeft / passo) * passo);
  }, { passive: true });

  reduzMovimento.addEventListener('change', agendar);

  medir();
  // Começa alinhado no início da cópia (idêntico ao início), para poder arrastar para os dois lados.
  el.scrollLeft = periodo;

  return (estaVisivel) => {
    visivel = estaVisivel;
    if (visivel) agendar();
    else clearTimeout(timer);
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

/**
 * Troca de fotos no mesmo lugar (fade): [data-slideshow] com várias <picture> empilhadas.
 * Avança a cada data-intervalo ms, só quando está visível e sem prefers-reduced-motion.
 */
export function iniciarSlideshows() {
  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('[data-slideshow]').forEach((el) => {
    const fotos = [...el.children];
    if (fotos.length < 2) return;
    const intervalo = Number(el.dataset.intervalo) || 4000;
    let atual = 0;
    let timer = 0;

    function mostrar(i) {
      fotos.forEach((foto, k) => {
        const ativa = k === i;
        foto.classList.toggle('opacity-100', ativa);
        foto.classList.toggle('opacity-0', !ativa);
        if (ativa) foto.removeAttribute('aria-hidden');
        else foto.setAttribute('aria-hidden', 'true');
      });
      atual = i;
    }

    function agendar() {
      clearInterval(timer);
      if (reduzMovimento.matches) return;
      timer = setInterval(() => mostrar((atual + 1) % fotos.length), intervalo);
    }

    // Guardado no elemento para o navegador não coletar o observador.
    el._observador = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) agendar();
      else clearInterval(timer);
    });
    el._observador.observe(el);
    reduzMovimento.addEventListener('change', agendar);
  });
}
