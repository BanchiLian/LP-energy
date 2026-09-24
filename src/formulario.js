/**
 * Envio do formulário de contato.
 *
 * Por padrão, a mensagem é montada a partir dos campos preenchidos e aberta
 * diretamente no WhatsApp (confirmado pelo cliente, seção 7 do prompt.md).
 *
 * Alternativas descartadas, mantidas comentadas para referência futura:
 *
 * // --- Opção Formspree ---
 * // async function enviarFormspree(dados) {
 * //   const resposta = await fetch('https://formspree.io/f/SEU_ID', {
 * //     method: 'POST',
 * //     headers: { Accept: 'application/json' },
 * //     body: dados,
 * //   });
 * //   return resposta.ok;
 * // }
 *
 * // --- Opção webhook próprio ---
 * // async function enviarWebhook(payload) {
 * //   const resposta = await fetch('https://SEU_ENDPOINT/lead', {
 * //     method: 'POST',
 * //     headers: { 'Content-Type': 'application/json' },
 * //     body: JSON.stringify(payload),
 * //   });
 * //   return resposta.ok;
 * // }
 */

const NUMERO_WHATSAPP = '5519996364904';
const SELETOR_CAMPOS_VALIDAVEIS = '#nome, #whatsapp, #modalidade, #horario';

// --- Máscara do campo WhatsApp: (99) 99999-9999 ou (99) 9999-9999 ---

function formatarTelefone(valorBruto) {
  const digitos = valorBruto.replace(/\D/g, '').slice(0, 11);

  if (digitos.length === 0) return '';

  let formatado = `(${digitos.slice(0, 2)}`;

  if (digitos.length >= 2) {
    formatado += digitos.length > 2 ? ') ' : ')';
  }

  if (digitos.length > 2) {
    const nonono = digitos.length > 10; // 11 dígitos = celular com 9º dígito
    const fimBloco1 = nonono ? 7 : 6;
    formatado += digitos.slice(2, fimBloco1);
    if (digitos.length > fimBloco1) {
      formatado += `-${digitos.slice(fimBloco1, 11)}`;
    }
  }

  return formatado;
}

function aplicarMascaraTelefone(campo) {
  const posicaoAntes = campo.selectionStart ?? campo.value.length;
  const digitosAntesDoCursor = campo.value.slice(0, posicaoAntes).replace(/\D/g, '').length;

  campo.value = formatarTelefone(campo.value);

  let contados = 0;
  let novaPosicao = campo.value.length;

  if (digitosAntesDoCursor === 0) {
    novaPosicao = 0;
  } else {
    for (let i = 0; i < campo.value.length; i += 1) {
      if (/\d/.test(campo.value[i])) {
        contados += 1;
        if (contados === digitosAntesDoCursor) {
          novaPosicao = i + 1;
          break;
        }
      }
    }
  }

  campo.setSelectionRange(novaPosicao, novaPosicao);
}

// --- Validação em tempo real ---

function mensagemErro(campo) {
  if (campo.validity.valueMissing) return 'Preencha este campo.';
  if (campo.validity.patternMismatch) return 'Use o formato (19) 99999-9999.';
  return 'Verifique o valor informado.';
}

function validarCampo(campo) {
  const erro = document.getElementById(`${campo.id}-erro`);
  const valido = campo.checkValidity();

  if (valido) {
    campo.removeAttribute('aria-invalid');
    campo.classList.remove('border-energy-red');
    campo.classList.add('border-white/30');
    if (erro) {
      erro.textContent = '';
      erro.classList.add('hidden');
    }
  } else {
    campo.setAttribute('aria-invalid', 'true');
    campo.classList.remove('border-white/30');
    campo.classList.add('border-energy-red');
    if (erro) {
      erro.textContent = mensagemErro(campo);
      erro.classList.remove('hidden');
    }
  }

  return valido;
}

function configurarValidacaoTempoReal(form) {
  const campos = form.querySelectorAll(SELETOR_CAMPOS_VALIDAVEIS);

  campos.forEach((campo) => {
    let tocado = false;

    campo.addEventListener('blur', () => {
      tocado = true;
      validarCampo(campo);
    });

    campo.addEventListener('input', () => {
      if (tocado) validarCampo(campo);
    });

    campo.addEventListener('change', () => {
      tocado = true;
      validarCampo(campo);
    });
  });
}

// --- Montagem da mensagem e envio via WhatsApp ---

function montarMensagem(form) {
  const dados = new FormData(form);
  const nome = (dados.get('nome') || '').toString().trim();
  const whatsapp = (dados.get('whatsapp') || '').toString().trim();
  const modalidade = (dados.get('modalidade') || '').toString().trim();
  const horario = (dados.get('horario') || '').toString().trim();
  const mensagem = (dados.get('mensagem') || '').toString().trim();

  const linhas = [
    'Olá! Quero agendar minha aula experimental gratuita na Energy.',
    `Nome: ${nome}`,
    `WhatsApp: ${whatsapp}`,
    `Modalidade: ${modalidade}`,
    `Melhor horário: ${horario}`,
  ];

  if (mensagem) {
    linhas.push(`Mensagem: ${mensagem}`);
  }

  return linhas.join('\n');
}

function montarUrlWhatsapp(mensagem) {
  return `https://api.whatsapp.com/send?phone=${NUMERO_WHATSAPP}&text=${encodeURIComponent(mensagem)}`;
}

function exibirSucesso(feedback, url, jaAbriu) {
  feedback.textContent = '';

  if (jaAbriu) {
    feedback.textContent = 'Tudo certo — abrimos o WhatsApp para você finalizar o agendamento.';
    return;
  }

  const texto = document.createTextNode('Não conseguimos abrir o WhatsApp automaticamente. ');
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.className = 'underline';
  link.textContent = 'Toque aqui para continuar no WhatsApp.';

  feedback.append(texto, link);
}

export function iniciarFormularioContato() {
  const form = document.getElementById('form-contato');
  const feedback = document.getElementById('form-feedback');
  const campoWhatsapp = document.getElementById('whatsapp');

  if (!form || !feedback) return;

  if (campoWhatsapp) {
    campoWhatsapp.addEventListener('input', () => aplicarMascaraTelefone(campoWhatsapp));
  }

  configurarValidacaoTempoReal(form);

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const campos = form.querySelectorAll(SELETOR_CAMPOS_VALIDAVEIS);
    let todosValidos = true;
    campos.forEach((campo) => {
      if (!validarCampo(campo)) todosValidos = false;
    });

    if (!todosValidos) {
      form.reportValidity();
      return;
    }

    const mensagem = montarMensagem(form);
    const url = montarUrlWhatsapp(mensagem);
    const janela = window.open(url, '_blank', 'noopener');
    const bloqueado = !janela || janela.closed || typeof janela.closed === 'undefined';

    exibirSucesso(feedback, url, !bloqueado);
  });
}
