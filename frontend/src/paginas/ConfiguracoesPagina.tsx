import { useCallback, useState } from 'react'
import olho from '../assets/eye.svg'
import casaBranca from '../assets/house-white.svg'
import engrenagemAtiva from '../assets/settings-active.svg'
import { ErroApi, mensagemDeErro, urlApi } from '../api/cliente'
import { atualizarEvento, enviarBanner, excluirEvento, obterEvento, removerBanner } from '../api/eventos'
import type { Evento } from '../api/tipos'
import { AmostraCor } from '../componentes/AmostraCor'
import { AreaTexto } from '../componentes/AreaTexto'
import { AvisoErro } from '../componentes/AvisoErro'
import { Botao } from '../componentes/Botao'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CampoChavePix } from '../componentes/CampoChavePix'
import { CampoTexto } from '../componentes/CampoTexto'
import { EnvioImagem } from '../componentes/EnvioImagem'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { MensagemLista } from '../componentes/MensagemLista'
import { OpcaoConfiguracao } from '../componentes/OpcaoConfiguracao'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { detectarTipoChave, formatarChavePix, normalizarChavePix, validarChavePix } from '../dados/chavePix'
import { coresTema } from '../dados/coresTema'
import { tonsRotulo } from '../dados/estilosCampo'
import { deCampoDataHora, paraCampoDataHora } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'

const TAMANHO_MAXIMO_BANNER_MB = 10

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
  const [tipoChavePix, setTipoChavePix] = useState(() => detectarTipoChave(evento.chavePix ?? ''))
  const [chavePix, setChavePix] = useState(() => formatarChavePix(tipoChavePix, evento.chavePix ?? ''))
  const [erroChavePix, setErroChavePix] = useState<string | null>(null)
  const [nomeRecebedorPix, setNomeRecebedorPix] = useState(evento.nomeRecebedorPix ?? '')
  const [cidadePix, setCidadePix] = useState(evento.cidadePix ?? '')
  const [bannerUrl, setBannerUrl] = useState(evento.bannerUrl)
  const [enviandoBanner, setEnviandoBanner] = useState(false)
  const [erroBanner, setErroBanner] = useState<string | null>(null)
  const [listaPresentesAtiva, setListaPresentesAtiva] = useState(evento.listaPresentesAtiva)
  const [muralAtivo, setMuralAtivo] = useState(evento.muralAtivo)
  const [salvandoOpcao, setSalvandoOpcao] = useState(false)
  const [erroOpcoes, setErroOpcoes] = useState<string | null>(null)

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
    const problemaChave = validarChavePix(tipoChavePix, chavePix)
    setErroChavePix(problemaChave)
    if (problemaChave) {
      setMensagemGeral('Confira a chave Pix.')
      return
    }
    if (chavePix.trim() && (!nomeRecebedorPix.trim() || !cidadePix.trim())) {
      setMensagemGeral('Para receber via Pix, informe também o nome e a cidade de quem recebe.')
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
        chavePix: normalizarChavePix(tipoChavePix, chavePix),
        nomeRecebedorPix,
        cidadePix,
      })
      setSlug(atualizado.slugPublico)
      // O servidor padroniza os dados do Pix (ex.: tira acentos do nome); a chave volta com a máscara do tipo
      const tipoSalvo = detectarTipoChave(atualizado.chavePix ?? '')
      setTipoChavePix(atualizado.chavePix ? tipoSalvo : tipoChavePix)
      setChavePix(formatarChavePix(tipoSalvo, atualizado.chavePix ?? ''))
      setNomeRecebedorPix(atualizado.nomeRecebedorPix ?? '')
      setCidadePix(atualizado.cidadePix ?? '')
      setSucesso('Alterações salvas.')
    } catch (e) {
      if (e instanceof ErroApi) setErro(e)
      setMensagemGeral(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  async function trocarBanner(arquivo: File) {
    // Validação no navegador, antes de chamar a API
    if (arquivo.size > TAMANHO_MAXIMO_BANNER_MB * 1024 * 1024) {
      setErroBanner(`A imagem pode ter no máximo ${TAMANHO_MAXIMO_BANNER_MB} MB.`)
      return
    }

    setErroBanner(null)
    setEnviandoBanner(true)
    try {
      const atualizado = await enviarBanner(evento.id, arquivo)
      setBannerUrl(atualizado.bannerUrl)
    } catch (e) {
      setErroBanner(mensagemDeErro(e))
    } finally {
      setEnviandoBanner(false)
    }
  }

  async function tirarBanner() {
    setErroBanner(null)
    setEnviandoBanner(true)
    try {
      await removerBanner(evento.id)
      setBannerUrl(null)
    } catch (e) {
      setErroBanner(mensagemDeErro(e))
    } finally {
      setEnviandoBanner(false)
    }
  }

  /** Os interruptores são salvos na hora, sem esperar o "Salvar alterações". */
  async function alterarOpcao(dados: { listaPresentesAtiva?: boolean; muralAtivo?: boolean }) {
    setErroOpcoes(null)
    setSalvandoOpcao(true)
    try {
      const atualizado = await atualizarEvento(evento.id, dados)
      setListaPresentesAtiva(atualizado.listaPresentesAtiva)
      setMuralAtivo(atualizado.muralAtivo)
    } catch (e) {
      setErroOpcoes(mensagemDeErro(e))
    } finally {
      setSalvandoOpcao(false)
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

        {/* O banner é salvo assim que a imagem é escolhida, sem esperar o "Salvar alterações" */}
        <div className="flex flex-col items-center gap-2 lg:col-span-2 lg:items-start">
          <EnvioImagem
            rotulo="Imagem banner"
            imagem={bannerUrl && urlApi(bannerUrl)}
            carregando={enviandoBanner}
            onEscolher={(arquivo) => void trocarBanner(arquivo)}
            onRemover={() => void tirarBanner()}
          />
          <p className="text-center font-display text-[10px] text-muted lg:text-left lg:text-[11px]">
            Aparece no topo da página do evento e no cartão em "Meus Eventos". JPG, PNG, GIF ou WEBP de até{' '}
            {TAMANHO_MAXIMO_BANNER_MB} MB.
          </p>
          <AvisoErro mensagem={erroBanner} />
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

        {/* Presente em dinheiro (Pix estático) */}
        <div className="flex flex-col gap-1 lg:col-span-2">
          <span className={tonsRotulo.campo}>Presente em dinheiro (Pix)</span>
          <p className="font-display text-[10px] text-muted lg:text-[11px]">
            Com a chave preenchida, a página mostra a opção de Pix: o convidado digita o valor e recebe o QR Code.
            O dinheiro cai direto na sua conta; confira os valores no extrato do banco. Deixe a chave vazia para
            esconder a opção.
          </p>
        </div>
        <CampoChavePix
          className="lg:col-span-2"
          valor={chavePix}
          tipo={tipoChavePix}
          onAlterar={(valor, tipo) => {
            setChavePix(valor)
            setTipoChavePix(tipo)
            setErroChavePix(null)
          }}
          erro={erroChavePix ?? erro?.doCampo('chavePix')}
        />
        <CampoTexto
          rotulo="Nome de quem recebe"
          tomRotulo="campo"
          placeholder="Como aparece no banco"
          maxLength={25}
          value={nomeRecebedorPix}
          onChange={(e) => setNomeRecebedorPix(e.target.value)}
          erro={erro?.doCampo('nomeRecebedorPix')}
        />
        <CampoTexto
          rotulo="Cidade de quem recebe"
          tomRotulo="campo"
          placeholder="Ex: São Paulo"
          maxLength={15}
          value={cidadePix}
          onChange={(e) => setCidadePix(e.target.value)}
          erro={erro?.doCampo('cidadePix')}
        />

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

      <div className="mt-6 mb-6 flex flex-col gap-6 lg:max-w-3xl">
        <AvisoErro mensagem={erroOpcoes} />
        <OpcaoConfiguracao
          titulo="Lista de presentes"
          descricao="Adiciona uma lista de presentes a página, onde convidados podem reservar ou pagar cotas de presentes cadastrados."
          ativo={listaPresentesAtiva}
          desabilitado={salvandoOpcao}
          onAlterar={(ativo) => void alterarOpcao({ listaPresentesAtiva: ativo })}
        />
        <OpcaoConfiguracao
          titulo="Mural de fotos"
          descricao="Ativar opção de mural de fotos onde convidados podem enviar fotos e você libera se elas podem ou não aparecer no mural."
          ativo={muralAtivo}
          desabilitado={salvandoOpcao}
          onAlterar={(ativo) => void alterarOpcao({ muralAtivo: ativo })}
        />
      </div>

      {/* Zona de perigo: só quem criou o evento pode excluí-lo */}
      {evento.organizador && (
      <div className="mb-24 flex flex-col gap-2 lg:mb-0 lg:max-w-xs">
        {confirmandoExclusao ? (
          <>
            <p className="text-[12px] text-danger">
              Isso apaga o evento, os convidados, os presentes e as fotos do mural. Não dá para desfazer.
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
      )}
    </>
  )
}
