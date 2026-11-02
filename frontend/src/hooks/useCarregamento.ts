import { useCallback, useEffect, useState } from 'react'
import { mensagemDeErro } from '../api/cliente'

/**
 * Carrega dados da API e controla os estados de "carregando" e "erro".
 * A função `carregar` deve vir de um useCallback, para não recarregar a cada render.
 */
export function useCarregamento<T>(carregar: () => Promise<T>) {
  const [dados, setDados] = useState<T | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    let ativo = true

    carregar()
      .then((resultado) => {
        if (!ativo) return
        setDados(resultado)
        setErro(null)
      })
      .catch((e: unknown) => {
        if (ativo) setErro(mensagemDeErro(e))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    // Ignora respostas que chegarem depois de sair da tela
    return () => {
      ativo = false
    }
  }, [carregar, versao])

  const recarregar = useCallback(() => {
    setCarregando(true)
    setVersao((v) => v + 1)
  }, [])

  return { dados, erro, carregando, recarregar }
}
