import type { HTMLAttributes } from 'react'

/** Tipos de chave Pix. O tipo não é gravado: ele sai do formato da chave salva. */
export type TipoChavePix = 'cpf' | 'cnpj' | 'telefone' | 'email' | 'aleatoria'

export const opcoesTipoChavePix: {
  valor: TipoChavePix
  rotulo: string
  placeholder: string
  modoTeclado: HTMLAttributes<HTMLInputElement>['inputMode']
}[] = [
  { valor: 'cpf', rotulo: 'CPF', placeholder: '000.000.000-00', modoTeclado: 'numeric' },
  { valor: 'cnpj', rotulo: 'CNPJ', placeholder: '00.000.000/0000-00', modoTeclado: 'numeric' },
  { valor: 'telefone', rotulo: 'Telefone', placeholder: '+55 (11) 99999-8888', modoTeclado: 'tel' },
  { valor: 'email', rotulo: 'E-mail', placeholder: 'nome@exemplo.com', modoTeclado: 'email' },
  { valor: 'aleatoria', rotulo: 'Aleatória', placeholder: '0000aaaa-00aa-00aa-00aa-000000aaaaaa', modoTeclado: 'text' },
]

const REGEX_ALEATORIA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const apenasDigitos = (texto: string) => texto.replace(/\D/g, '')

export const tipoChaveNumerico = (tipo: TipoChavePix) => tipo === 'cpf' || tipo === 'cnpj' || tipo === 'telefone'

/** DDD + número do telefone, sem o 55 do Brasil (que vem do "+55" ou de 12-13 dígitos colados). */
function digitosTelefone(texto: string) {
  let digitos = apenasDigitos(texto)
  if (digitos.startsWith('55') && (texto.trim().startsWith('+') || digitos.length > 11)) digitos = digitos.slice(2)
  return digitos.slice(0, 11)
}

/** Monta o texto com a máscara, pondo cada separador só quando já existe um dígito depois dele. */
function aplicarMascara(digitos: string, grupos: number[], separadores: string[]) {
  let resultado = ''
  let posicao = 0
  grupos.forEach((tamanho, i) => {
    const parte = digitos.slice(posicao, posicao + tamanho)
    if (!parte) return
    resultado += (i > 0 ? separadores[i - 1] : '') + parte
    posicao += tamanho
  })
  return resultado
}

function digitoCpf(parte: string, pesoInicial: number) {
  const soma = [...parte].reduce((total, d, i) => total + Number(d) * (pesoInicial - i), 0)
  const resto = (soma * 10) % 11
  return resto === 10 ? 0 : resto
}

export function cpfValido(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false
  return digitoCpf(cpf.slice(0, 9), 10) === Number(cpf[9]) && digitoCpf(cpf.slice(0, 10), 11) === Number(cpf[10])
}

function digitoCnpj(cnpj: string, pesos: number[]) {
  const resto = pesos.reduce((total, peso, i) => total + Number(cnpj[i]) * peso, 0) % 11
  return resto < 2 ? 0 : 11 - resto
}

export function cnpjValido(cnpj: string) {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1+$/.test(cnpj)) return false
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const pesos2 = [6, ...pesos1]
  return digitoCnpj(cnpj, pesos1) === Number(cnpj[12]) && digitoCnpj(cnpj, pesos2) === Number(cnpj[13])
}

/**
 * Palpite do tipo pela chave (a salva ou a colada). 11 dígitos podem ser CPF ou celular:
 * vira CPF se os dígitos verificadores baterem; senão, telefone se o 3º dígito for 9.
 */
export function detectarTipoChave(chave: string): TipoChavePix {
  const texto = chave.trim()
  if (!texto) return 'cpf'
  if (texto.startsWith('+')) return 'telefone'
  if (texto.includes('@')) return 'email'
  if (/[a-z]/i.test(texto)) return /^[0-9a-f-]+$/i.test(texto) ? 'aleatoria' : 'email'

  const digitos = apenasDigitos(texto)
  if (digitos.length === 14) return 'cnpj'
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) return 'telefone'
  if (digitos.length === 10) return 'telefone'
  if (digitos.length === 11 && !cpfValido(digitos) && digitos[2] === '9') return 'telefone'
  return 'cpf'
}

/** Texto do campo com a máscara do tipo: "123.456.789-09", "+55 (11) 99999-8888"... */
export function formatarChavePix(tipo: TipoChavePix, texto: string) {
  switch (tipo) {
    case 'cpf':
      return aplicarMascara(apenasDigitos(texto).slice(0, 11), [3, 3, 3, 2], ['.', '.', '-'])
    case 'cnpj':
      return aplicarMascara(apenasDigitos(texto).slice(0, 14), [2, 3, 3, 4, 2], ['.', '.', '/', '-'])
    case 'telefone': {
      const digitos = digitosTelefone(texto)
      if (!digitos) return ''
      // Fixo (10 dígitos): 4 + 4; celular (11): 5 + 4
      const numero = aplicarMascara(digitos.slice(2), digitos.length === 11 ? [5, 4] : [4, 4], ['-'])
      return `+55 (${digitos.slice(0, 2)}${numero ? `) ${numero}` : ''}`
    }
    case 'email':
      return texto.replace(/\s/g, '').toLowerCase().slice(0, 77)
    case 'aleatoria':
      return texto.replace(/\s/g, '').toLowerCase().slice(0, 36)
  }
}

/** Chave no formato que vai para a API: só dígitos no CPF/CNPJ e "+55..." no telefone. */
export function normalizarChavePix(tipo: TipoChavePix, texto: string) {
  if (!texto.trim()) return ''
  switch (tipo) {
    case 'cpf':
    case 'cnpj':
      return apenasDigitos(texto)
    case 'telefone':
      return `+55${digitosTelefone(texto)}`
    default:
      return texto.trim().toLowerCase()
  }
}

/** Mensagem de erro da chave, ou nulo se estiver certa. Chave vazia é válida (desliga o Pix). */
export function validarChavePix(tipo: TipoChavePix, texto: string): string | null {
  if (!texto.trim()) return null
  const chave = normalizarChavePix(tipo, texto)
  switch (tipo) {
    case 'cpf':
      return cpfValido(chave) ? null : 'CPF inválido. Confira os 11 números.'
    case 'cnpj':
      return cnpjValido(chave) ? null : 'CNPJ inválido. Confira os 14 números.'
    case 'telefone':
      return /^\+55[1-9]\d{9,10}$/.test(chave) ? null : 'Informe o telefone com DDD, ex.: (11) 99999-8888.'
    case 'email':
      return REGEX_EMAIL.test(chave) ? null : 'Informe um e-mail válido.'
    case 'aleatoria':
      return REGEX_ALEATORIA.test(chave) ? null : 'A chave aleatória tem 32 letras e números, separados por hífens.'
  }
}
