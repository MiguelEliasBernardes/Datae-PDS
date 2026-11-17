import { useCallback, useState } from 'react'
import presenteBotao from '../assets/gift-btn.svg'
import type { PresentePublico, StatusPresente } from '../api/tipos'
import { formatarMoeda, rotulosStatusPresente } from '../dados/formatacao'
import { codigoReserva } from '../dados/reservas'
import { Botao } from './Botao'
import { CartaoPresentePublico } from './CartaoPresentePublico'
import { FormularioCotas } from './FormularioCotas'
import { FormularioReserva } from './FormularioReserva'
import { JanelaModal } from './JanelaModal'
import { MensagemLista } from './MensagemLista'
import type { TomSelo } from './SeloStatus'

const PRESENTES_INICIAIS = 3

const tomStatusPresente: Record<StatusPresente, TomSelo> = {
  Disponivel: 'sucesso',
  Reservado: 'neutro',
  Comprado: 'destaque',
}

/**
 * Grade de presentes da página pública, com a janela de reserva (ou de cotas) de cada um.
 * Serve à lista do evento e à lista pessoal de cada formando; `onAlterado` recarrega a lista.
 */
export function ListaPresentesPublica({
  slug,
  presentes: presentesDaApi,
  somenteLeitura = false,
  onAlterado,
}: {
  slug: string
  presentes: PresentePublico[]
  somenteLeitura?: boolean
  onAlterado: () => void
}) {
  const [presenteAberto, setPresenteAberto] = useState<PresentePublico | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [todos, setTodos] = useState(false)
  const fechar = useCallback(() => setPresenteAberto(null), [])

  // As reservas feitas neste aparelho vêm primeiro, para o convidado achar "Minha reserva" sem procurar.
  // O resto mantém a ordem da API (disponíveis antes dos reservados).
  const presentes = [...presentesDaApi].sort(
    (a, b) => Number(codigoReserva(b.id) !== null) - Number(codigoReserva(a.id) !== null),
  )
  const visiveis = todos ? presentes : presentes.slice(0, PRESENTES_INICIAIS)

  function acaoDoPresente(p: PresentePublico) {
    if (p.quantidadeCotas !== null) return p.status === 'Disponivel' ? 'Dar cotas' : undefined
    if (p.status === 'Disponivel') return 'Reservar'
    if (codigoReserva(p.id)) return 'Minha reserva'
    return undefined
  }

  function precoDoPresente(p: PresentePublico) {
    if (p.quantidadeCotas === null) return formatarMoeda(p.valorEstimado)
    return `${formatarMoeda(p.valorCota)} a cota · ${p.cotasVendidas}/${p.quantidadeCotas}`
  }

  return (
    <>
      {aviso && (
        <p role="status" className="mt-4 rounded-[10px] bg-stat-mint px-4 py-3 text-[13px] text-success lg:text-center">
          {aviso}
        </p>
      )}
      <div className="mt-5 flex flex-col gap-4 lg:mt-8 lg:grid lg:grid-cols-3 lg:gap-6">
        {presentes.length === 0 && <MensagemLista>Nenhum presente cadastrado ainda.</MensagemLista>}
        {visiveis.map((p) => (
          <CartaoPresentePublico
            key={p.id}
            nome={p.nome}
            preco={precoDoPresente(p)}
            imagem={p.foto ?? undefined}
            link={p.linkAfiliado ?? undefined}
            status={{ rotulo: rotulosStatusPresente[p.status], tom: tomStatusPresente[p.status] }}
            acao={acaoDoPresente(p)}
            onAcao={() => setPresenteAberto(p)}
          />
        ))}
      </div>
      {presentes.length > PRESENTES_INICIAIS && (
        <Botao
          className="mt-5 lg:mx-auto lg:mt-8 lg:max-w-xs"
          onClick={() => setTodos((atual) => !atual)}
          icone={<img src={presenteBotao} alt="" width={24} height={24} />}
        >
          {todos ? 'Mostrar menos' : `Todos presentes (${presentes.length})`}
        </Botao>
      )}

      <JanelaModal titulo={presenteAberto?.nome ?? ''} aberta={presenteAberto !== null} onFechar={fechar}>
        {presenteAberto?.quantidadeCotas != null && (
          <FormularioCotas
            // key recria o formulário ao trocar de presente
            key={presenteAberto.id}
            slug={slug}
            presente={presenteAberto}
            somenteLeitura={somenteLeitura}
            onComprado={onAlterado}
          />
        )}
        {presenteAberto && presenteAberto.quantidadeCotas === null && (
          <FormularioReserva
            key={presenteAberto.id}
            slug={slug}
            presente={presenteAberto}
            codigo={codigoReserva(presenteAberto.id)}
            somenteLeitura={somenteLeitura}
            onConcluido={(mensagem) => {
              setPresenteAberto(null)
              setAviso(mensagem)
              onAlterado()
            }}
          />
        )}
      </JanelaModal>
    </>
  )
}
