/**
 * Códigos das reservas feitas por este navegador na página pública.
 * O convidado não tem login: é o código que prova que foi ele quem reservou,
 * permitindo marcar como comprado ou cancelar depois. Fica só neste aparelho.
 */
const CHAVE = 'datae.reservas'

type Reservas = Record<string, string>

function ler(): Reservas {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? '{}') as Reservas
  } catch {
    return {}
  }
}

function gravar(reservas: Reservas) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(reservas))
  } catch {
    // Navegador sem armazenamento (ex.: aba anônima): a reserva continua valendo, só não dá para alterar depois
  }
}

export const codigoReserva = (presenteId: number): string | null => ler()[presenteId] ?? null

export function guardarReserva(presenteId: number, codigo: string) {
  gravar({ ...ler(), [presenteId]: codigo })
}

export function esquecerReserva(presenteId: number) {
  const reservas = ler()
  delete reservas[presenteId]
  gravar(reservas)
}
