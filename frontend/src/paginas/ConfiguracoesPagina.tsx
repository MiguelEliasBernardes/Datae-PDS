import { useCallback, useState } from 'react'
import olho from '../assets/eye.svg'
import casaBranca from '../assets/house-white.svg'
import engrenagemAtiva from '../assets/settings-active.svg'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import { atualizarEvento, excluirEvento, obterEvento } from '../api/eventos'
import type { Evento } from '../api/tipos'
import { AmostraCor } from '../componentes/AmostraCor'
import { AreaTexto } from '../componentes/AreaTexto'
import { AvisoErro } from '../componentes/AvisoErro'
import { Botao } from '../componentes/Botao'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CampoTexto } from '../componentes/CampoTexto'
import { EnvioImagem } from '../componentes/EnvioImagem'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { MensagemLista } from '../componentes/MensagemLista'
import { OpcaoConfiguracao } from '../componentes/OpcaoConfiguracao'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { coresTema } from '../dados/coresTema'
import { tonsRotulo } from '../dados/estilosCampo'
import { deCampoDataHora, paraCampoDataHora } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'

/** Tela O7 - Configurações da página. */
export function ConfiguracoesPagina({
  eventoId,
  onVoltar,
  onAbrirVisualizacao,
  onExcluido,
}: {
  eventoId: number
  onVoltar: () => void
  onAbrirVisualizacao: () => void
  onExcluido: () => void
}) {
  const carregar = useCallback(() => obterEvento(eventoId), [eventoId])
  const { dados: evento, erro, carregando, recarregar } = useCarregamento(carregar)

  const navegacao = [
    { icone: casaBranca, rotulo: 'Inicio', onClick: onVoltar },
    { icone: olho, rotulo: 'Visualizar', onClick: onAbrirVisualizacao },
    { icone: engrenagemAtiva, rotulo: 'Configurações', ativo: true },
  ]

  return (
    <LayoutPainel itens={navegacao}>
      <BotaoVoltar onVoltar={onVoltar} />

      <TituloDestaque>Configurações da página</TituloDestaque>

      <AvisoErro className="mt-4" mensagem={erro} onTentarNovamente={recarregar} />
      {carregando && !evento && <MensagemLista>Carregando configurações...</MensagemLista>}

      {/* key recria o formulário com os dados certos quando o evento carrega */}
      {evento && <FormularioConfiguracoes key={evento.id} evento={evento} onExcluido={onExcluido} />}
    </LayoutPainel>
  )
}

function FormularioConfiguracoes({ evento, onExcluido }: { evento: Evento; onExcluido: () => void }) {
  const [nome, setNome] = useState(evento.nomeEvento)
  const [mensagem, setMensagem] = useState(evento.descricao ?? '')
  const [local, setLocal] = useState(evento.local ?? '')
  const [data, setData] = useState(paraCampoDataHora(evento.dataEvento))
  const [slug, setSlug] = useState(evento.slugPublico)
  const [cor, setCor] = useState(evento.corPrincipal ?? coresTema[0].valor)

  const [erro, setErro] = useState<ErroApi | null>(null)
  const [mensagemGeral, setMensagemGeral] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setSucesso(null)

    // Validação no navegador, antes de chamar a API
    if (!nome.trim() || !data) {
      setMensagemGeral('O nome e a data do evento são obrigatórios.')
      return
    }

    setMensagemGeral(null)
    setSalvando(true)
    try {
      const atualizado = await atualizarEvento(evento.id, {
        nomeEvento: nome,
        descricao: mensagem,
        local,
        dataEvento: deCampoDataHora(data),
        slugPublico: slug,
        corPrincipal: cor,
      })
      setSlug(atualizado.slugPublico)
      setSucesso('Alterações salvas.')
    } catch (e) {
      if (e instanceof ErroApi) setErro(e)
      setMensagemGeral(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  async function excluir() {
    setSalvando(true)
    setMensagemGeral(null)
    try {
      await excluirEvento(evento.id)
      onExcluido()
    } catch (e) {
      setMensagemGeral(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  return (
    <>
      <form
        onSubmit={salvar}
        noValidate
        className="mt-6 flex flex-col gap-5 lg:grid lg:max-w-3xl lg:grid-cols-2 lg:gap-x-6 lg:gap-y-5"
      >
        <AvisoErro className="lg:col-span-2" mensagem={mensagemGeral} />

        <div className="lg:col-span-2">
          {/* Upload de imagem ainda não tem backend */}
          <EnvioImagem rotulo="Imagem banner" />
        </div>

        <CampoTexto
          className="lg:col-span-2"
          rotulo="Nome do evento"
          tomRotulo="campo"
          placeholder="Ex: Marina & Rafael"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          erro={erro?.doCampo('nomeEvento')}
        />
        <AreaTexto
          className="lg:col-span-2"
          rotulo="Mensagem convite"
          tomRotulo="campo"
          placeholder="Digite o que você colocaria no convite"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          erro={erro?.doCampo('descricao')}
        />
        <CampoTexto
          rotulo="Local"
          tomRotulo="campo"
          placeholder="Endereço ou nome do local"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          erro={erro?.doCampo('local')}
        />
        <CampoTexto
          rotulo="Data"
          tomRotulo="campo"
          type="datetime-local"
          value={data}
          onChange={(e) => setData(e.target.value)}
          erro={erro?.doCampo('dataEvento')}
        />
        <CampoTexto
          className="lg:col-span-2"
          rotulo="Endereço da página"
          tomRotulo="campo"
          placeholder="ex: casamento-ana-e-pedro"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          erro={erro?.doCampo('slugPublico')}
        />

        <div className="flex flex-col gap-2 lg:col-span-2">
          <span className={tonsRotulo.campo}>Cor tema</span>
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
          {erro?.doCampo('corPrincipal') && <p className="text-[12px] text-danger">{erro.doCampo('corPrincipal')}</p>}
        </div>

        <div className="flex flex-col gap-2 lg:col-span-2 lg:max-w-xs">
          <Botao type="submit" carregando={salvando}>
            Salvar alterações
          </Botao>
          {sucesso && <span role="status" className="text-[12px] text-success">{sucesso}</span>}
        </div>
      </form>

      <div className="mt-8">
        <TituloDestaque>Configurações opcionais</TituloDestaque>
      </div>

      {/* Os interruptores ainda não têm backend */}
      <div className="mt-6 mb-6 flex flex-col gap-6 lg:max-w-3xl">
        <OpcaoConfiguracao
          titulo="Lista de presentes"
          descricao="Adiciona uma lista de presentes a página, onde convidados podem reservar ou pagar cotas de presentes cadastrados."
        />
        <OpcaoConfiguracao
          titulo="Pix dinâmico"
          ativoInicialmente
          descricao="Adicionar opção de presente via pix, convidado digita o valor e gerar um QRCode para pagamento, com confirmação automática."
        />
        <OpcaoConfiguracao
          titulo="Mural de fotos"
          ativoInicialmente
          descricao="Ativar opção de mural de fotos onde convidados podem enviar fotos e você libera se elas podem ou não aparecer no mural."
        />
      </div>

      {/* Zona de perigo */}
      <div className="mb-24 flex flex-col gap-2 lg:mb-0 lg:max-w-xs">
        {confirmandoExclusao ? (
          <>
            <p className="text-[12px] text-danger">
              Isso apaga o evento, os convidados e os presentes. Não dá para desfazer.
            </p>
            <div className="flex gap-2">
              <Botao type="button" variante="secundario" onClick={() => setConfirmandoExclusao(false)}>
                Cancelar
              </Botao>
              <Botao type="button" variante="perigo" carregando={salvando} onClick={() => void excluir()}>
                Excluir
              </Botao>
            </div>
          </>
        ) : (
          <Botao type="button" variante="perigo" onClick={() => setConfirmandoExclusao(true)}>
            Excluir evento
          </Botao>
        )}
      </div>
    </>
  )
}
