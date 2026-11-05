import { useEffect, useState } from 'react'

/** Horário atual (em ms), atualizado a cada `intervaloMs`. Usado na contagem regressiva. */
export function useAgora(intervaloMs = 1000) {
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), intervaloMs)
    return () => window.clearInterval(id)
  }, [intervaloMs])

  return agora
}
