import type { StatusFoto, StatusPresenca, StatusPresente, TipoEvento } from '../api/tipos'

/** Rótulos exibidos para cada tipo de evento do backend. */
export const rotulosTipoEvento: Record<TipoEvento, string> = {
  ChaDePanela: 'Chá de Panela',
  Casamento: 'Casamento',
  Aniversario: 'Aniversário',
  Formatura: 'Formatura',
}

export const tiposEvento = Object.keys(rotulosTipoEvento) as TipoEvento[]

export const rotulosStatusPresenca: Record<StatusPresenca, string> = {
  Pendente: 'Pendente',
  Confirmado: 'Confirmado',
  Recusado: 'Recusado',
}

export const rotulosStatusPresente: Record<StatusPresente, string> = {
  Disponivel: 'Disponível',
  Reservado: 'Reservado',
  Comprado: 'Comprado',
}

export const rotulosStatusFoto: Record<StatusFoto, string> = {
  Pendente: 'Pendente',
  Aprovada: 'Aprovada',
  Recusada: 'Recusada',
}

/** Quanto falta até a data, em dias/horas/minutos/segundos (zera quando a data passa). */
export function tempoRestante(dataIso: string, agora: number) {
  const segundosTotais = Math.floor(Math.max(0, new Date(dataIso).getTime() - agora) / 1000)
  const doisDigitos = (n: number) => String(n).padStart(2, '0')
  return [
    { valor: String(Math.floor(segundosTotais / 86_400)), rotulo: 'dias' },
    { valor: doisDigitos(Math.floor((segundosTotais % 86_400) / 3600)), rotulo: 'horas' },
    { valor: doisDigitos(Math.floor((segundosTotais % 3600) / 60)), rotulo: 'min' },
    { valor: doisDigitos(segundosTotais % 60), rotulo: 'seg' },
  ]
}

/** "2026-12-20T19:00:00Z" → "20/12/2026". */
export function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

/** "2026-12-20T19:00:00Z" → "20 de dezembro de 2026 · 16h". */
export function formatarDataPorExtenso(iso: string) {
  const data = new Date(iso)
  const dia = data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  const minutos = data.getMinutes()
  const hora = `${data.getHours()}h${minutos ? String(minutos).padStart(2, '0') : ''}`
  return `${dia} · ${hora}`
}

/** 199.9 → "R$ 199,90". */
export function formatarMoeda(valor: number | null | undefined) {
  if (valor === null || valor === undefined) return 'Sem valor definido'
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Data ISO (UTC) → valor aceito por <input type="datetime-local"> no fuso local. */
export function paraCampoDataHora(iso: string) {
  const data = new Date(iso)
  const local = new Date(data.getTime() - data.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

/** Valor de <input type="datetime-local"> → data ISO em UTC para o backend. */
export function deCampoDataHora(valor: string) {
  return new Date(valor).toISOString()
}

/** "R$ 1.234,56", "1234,56" ou "1234.56" → 1234.56. Texto vazio vira null; inválido vira NaN. */
export function lerValorMonetario(texto: string): number | null {
  const limpo = texto.replace(/[R$\s]/g, '')
  if (!limpo) return null
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  return Number(normalizado)
}
