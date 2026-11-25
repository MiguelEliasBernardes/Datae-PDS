import { useState } from 'react'
import { Botao } from './Botao'
import { CampoTexto } from './CampoTexto'

/**
 * Campo para quem recebeu só o código do convite (sem o link). Ao enviar, abre a mesma
 * tela de aceitar convite do link, que confere o código e mostra de qual evento ele é
 * (organização de um evento ou comissão de uma formatura).
 */
export function EntrarComCodigo({ onUsarCodigo }: { onUsarCodigo: (codigo: string) => void }) {
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState<string | undefined>()

  function aoEnviar(e: React.FormEvent) {
    e.preventDefault()

    // Validação no navegador: o código tem letras e números (espaços e hífens são ignorados)
    const limpo = codigo.replace(/[^0-9a-z]/gi, '').toUpperCase()
    if (!limpo) {
      setErro('Digite o código que você recebeu.')
      return
    }

    setErro(undefined)
    onUsarCodigo(limpo)
  }

  return (
    <form
      onSubmit={aoEnviar}
      noValidate
      className="flex flex-col gap-2 rounded-[12px] border-[1.5px] border-field-border p-4 lg:max-w-xl"
    >
      <span className="font-display text-[14px] font-semibold text-primary-strong">Recebeu um código de convite?</span>
      <p className="font-display text-[11px] text-muted">
        Digite o código para ajudar a organizar um evento ou entrar na comissão da sua formatura.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <CampoTexto
          className="flex-1"
          name="codigo-convite"
          placeholder="Ex: ABCD2345"
          autoComplete="off"
          autoCapitalize="characters"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          erro={erro}
        />
        <Botao type="submit" variante="secundario" className="sm:max-w-[160px]">
          Usar código
        </Botao>
      </div>
    </form>
  )
}
