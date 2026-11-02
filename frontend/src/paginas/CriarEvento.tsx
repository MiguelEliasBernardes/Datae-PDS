import { useState } from 'react'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import { criarEvento } from '../api/eventos'
import type { Evento, TipoEvento } from '../api/tipos'
import { AmostraCor } from '../componentes/AmostraCor'
import { AvisoErro } from '../componentes/AvisoErro'
import { Botao } from '../componentes/Botao'
import { BotaoOpcao } from '../componentes/BotaoOpcao'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CampoTexto } from '../componentes/CampoTexto'
import { coresTema } from '../dados/coresTema'
import { deCampoDataHora, rotulosTipoEvento, tiposEvento } from '../dados/formatacao'

const classeRotulo = 'text-[13px] font-medium text-heading'

/** Tela O3 - Criação de Evento. */
export function CriarEvento({
  onVoltar,
  onCriado,
}: {
  onVoltar: () => void
  onCriado: (evento: Evento) => void
}) {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoEvento>('Casamento')
  const [data, setData] = useState('')
  const [local, setLocal] = useState('')
  const [cor, setCor] = useState(coresTema[0].valor)

  const [erro, setErro] = useState<ErroApi | null>(null)
  const [mensagemGeral, setMensagemGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    // Validação no navegador, antes de chamar a API
    if (!nome.trim() || !data) {
      setMensagemGeral('Informe o nome e a data do evento.')
      return
    }

    setMensagemGeral(null)
    setEnviando(true)
    try {
      const evento = await criarEvento({
        nomeEvento: nome,
        tipo,
        dataEvento: deCampoDataHora(data),
        local,
        corPrincipal: cor,
      })
      onCriado(evento)
    } catch (e) {
      if (e instanceof ErroApi) setErro(e)
      setMensagemGeral(mensagemDeErro(e))
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full justify-center lg:items-center lg:p-10">
      <div className="flex min-h-screen w-full max-w-[402px] flex-col bg-surface px-6 pt-12 lg:min-h-0 lg:max-w-2xl lg:rounded-3xl lg:px-10 lg:py-10 lg:shadow-[0_10px_40px_rgba(38,33,92,0.12)]">
        <BotaoVoltar onVoltar={onVoltar} />

        <form
          onSubmit={aoEnviar}
          noValidate
          className="mt-4 flex flex-1 flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-5"
        >
          <AvisoErro className="lg:col-span-2" mensagem={mensagemGeral} />

          <CampoTexto
            className="lg:col-span-2"
            rotulo="Nome do evento"
            placeholder="Ex: Casamento de Ana e Pedro"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            erro={erro?.doCampo('nomeEvento')}
          />

          <div className="flex flex-col gap-2 lg:col-span-2">
            <span className={classeRotulo}>Tipo de evento</span>
            <div className="grid grid-cols-2 gap-3">
              {tiposEvento.map((t) => (
                <BotaoOpcao
                  key={t}
                  rotulo={rotulosTipoEvento[t]}
                  selecionado={tipo === t}
                  onClick={() => setTipo(t)}
                />
              ))}
            </div>
          </div>

          <CampoTexto
            rotulo="Data do evento"
            type="datetime-local"
            value={data}
            onChange={(e) => setData(e.target.value)}
            erro={erro?.doCampo('dataEvento')}
          />

          <CampoTexto
            rotulo="Local"
            placeholder="Endereço ou nome do local"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            erro={erro?.doCampo('local')}
          />

          <div className="flex flex-col gap-2 lg:col-span-2">
            <span className={classeRotulo}>Cor do tema</span>
            <div className="flex gap-2">
              {coresTema.map((c) => (
                <AmostraCor
                  key={c.valor}
                  cor={c.valor}
                  rotulo={c.nome}
                  selecionada={cor === c.valor}
                  onClick={() => setCor(c.valor)}
                />
              ))}
            </div>
          </div>

          <Botao
            type="submit"
            fonte="sans"
            carregando={enviando}
            className="mt-auto mb-8 h-[52px] lg:col-span-2 lg:mt-2 lg:mb-0"
          >
            Criar evento
          </Botao>
        </form>
      </div>
    </div>
  )
}
