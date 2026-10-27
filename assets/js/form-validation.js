/*
  VALIDAÇÃO DO FORMULÁRIO
  Funções puras: recebem valores e devolvem texto de erro (ou null se estiver ok).
  Não tocam no DOM, por isso são fáceis de testar com `npm run test:unit`.
*/

const NOME_MIN = 2;
const NOME_MAX = 80;
const ASSUNTO_MIN = 10;
const ASSUNTO_MAX = 500;

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGEX_LETRA = /\p{L}/u;

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : null);

export function validateName(valor) {
  const nome = texto(valor);
  if (nome === null || nome.length === 0) return 'Informe seu nome.';
  if (nome.length < NOME_MIN) return 'O nome precisa ter pelo menos 2 letras.';
  if (nome.length > NOME_MAX) return 'O nome pode ter no máximo 80 caracteres.';
  if (!REGEX_LETRA.test(nome)) return 'O nome precisa ter letras.';
  return null;
}

export function validateContact(valor) {
  const contato = texto(valor);
  if (contato === null || contato.length === 0) return 'Informe um e-mail ou telefone.';
  if (contato.length > 120) return 'Informe um e-mail ou telefone válido.';

  if (contato.includes('@')) {
    return REGEX_EMAIL.test(contato) ? null : 'Informe um e-mail válido, como nome@exemplo.com.';
  }

  // Telefone: só dígitos e símbolos comuns; DDD + número (10 ou 11 dígitos), com +55 opcional.
  if (!/^[\d\s()+-]+$/.test(contato)) return 'Informe um e-mail ou telefone válido.';
  let digitos = contato.replace(/\D/g, '');
  if (contato.startsWith('+')) {
    if (!digitos.startsWith('55')) return 'Informe um telefone brasileiro, com DDD.';
    digitos = digitos.slice(2);
  }
  return digitos.length === 10 || digitos.length === 11
    ? null
    : 'Informe o telefone com DDD, por exemplo (11) 91234-5678.';
}

export function validateSubject(valor) {
  const assunto = texto(valor);
  if (assunto === null || assunto.length === 0) return 'Descreva em poucas palavras o motivo do contato.';
  if (assunto.length < ASSUNTO_MIN) return 'Escreva pelo menos 10 caracteres.';
  if (assunto.length > ASSUNTO_MAX) return 'Use no máximo 500 caracteres.';
  return null;
}

export function validateConsent(valor) {
  return valor === true ? null : 'Para continuar, confirme que leu a política de privacidade.';
}

/** Campo oculto: pessoas não o veem, robôs costumam preenchê-lo. */
export function isSpam(dados) {
  const campo = dados && typeof dados === 'object' ? dados.website : '';
  return typeof campo === 'string' && campo.trim().length > 0;
}

export function validateForm(dados) {
  const entrada = dados && typeof dados === 'object' ? dados : {};
  const errors = {};

  const resultados = {
    name: validateName(entrada.name),
    contact: validateContact(entrada.contact),
    subject: validateSubject(entrada.subject),
    consent: validateConsent(entrada.consent),
  };
  for (const [campo, erro] of Object.entries(resultados)) {
    if (erro) errors[campo] = erro;
  }

  // Robô: inválido, mas sem dizer o motivo (não ensina como contornar).
  const valid = Object.keys(errors).length === 0 && !isSpam(entrada);
  return { valid, errors };
}
