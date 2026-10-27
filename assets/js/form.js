/*
  FORM (ligação com a página)
  Lê o formulário, usa form-validation.js e mostra erros e avisos.
  É um formulário de DEMONSTRAÇÃO: nenhuma requisição de rede é feita.
*/
import { validateForm } from './form-validation.js';

const CAMPOS = ['name', 'contact', 'subject', 'consent'];

const AVISO_DEMO =
  'Formulário de demonstração: nada foi enviado nem guardado. Este escritório é fictício.';

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
