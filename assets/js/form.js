/*
  FORM (ligação com a página)
  Lê o formulário, usa form-validation.js e mostra erros e avisos.
  É um formulário de DEMONSTRAÇÃO: nenhuma requisição de rede é feita.
*/
import { validateForm } from './form-validation.js';

const CAMPOS = ['name', 'contact', 'subject', 'consent'];

const AVISO_DEMO =
  'Formulário de demonstração: nada foi enviado nem guardado. Este escritório é fictício.';

// Canal de resposta escolhido: muda o rótulo e o teclado do celular no campo de contato.
// A validação não muda: validateContact aceita e-mail e telefone.
const CANAIS = {
  email: { rotulo: 'E-mail', teclado: 'email', preenchimento: 'email' },
  telefone: { rotulo: 'Telefone com DDD', teclado: 'tel', preenchimento: 'tel' },
};

function ligarCanal(form) {
  const campo = form.elements.contact;
  const rotulo = form.querySelector('label[for="campo-contact"]');
  if (!form.elements.canal || !rotulo) return;

  const aplicar = () => {
    const canal = CANAIS[form.elements.canal.value] || CANAIS.email;
    rotulo.textContent = canal.rotulo;
    // Atributos, não propriedades: é o atributo que o navegador usa, e o Firefox não
    // espelha a propriedade autocomplete do mesmo jeito que o Chrome.
    campo.setAttribute('inputmode', canal.teclado);
    campo.setAttribute('autocomplete', canal.preenchimento);
  };

  form.addEventListener('change', (evento) => {
    if (evento.target.name === 'canal') aplicar();
  });
  // O reset volta as opções ao padrão sem disparar "change"; aplica depois que ele termina.
  form.addEventListener('reset', () => setTimeout(aplicar));
  aplicar();
}

function mostrarErros(form, errors) {
  for (const campo of CAMPOS) {
    const entrada = form.elements[campo];
    const lugar = form.querySelector(`#erro-${campo}`);
    const mensagem = errors[campo];
    if (mensagem) {
      entrada.setAttribute('aria-invalid', 'true');
      lugar.textContent = mensagem;
      lugar.hidden = false;
    } else {
      entrada.removeAttribute('aria-invalid');
      lugar.textContent = '';
      lugar.hidden = true;
    }
  }
}

export function initForm(form) {
  if (!form) return;
  const status = document.getElementById('contato-status');
  ligarCanal(form);

  form.addEventListener('submit', (evento) => {
    evento.preventDefault(); // nunca envia nada

    const dados = {
      name: form.elements.name.value,
      contact: form.elements.contact.value,
      subject: form.elements.subject.value,
      consent: form.elements.consent.checked,
      website: form.elements.website.value,
    };
    const { valid, errors } = validateForm(dados);

    mostrarErros(form, errors);

    const primeiroErro = CAMPOS.find((campo) => errors[campo]);
    if (primeiroErro) {
      status.textContent = 'Há campos a corrigir. Veja as mensagens abaixo de cada campo.';
      form.elements[primeiroErro].focus();
      return;
    }

    // Válido (ou robô, que recebe o mesmo aviso sem pistas): só mostra a demonstração.
    status.textContent = AVISO_DEMO;
    if (valid) form.reset();
  });
}
