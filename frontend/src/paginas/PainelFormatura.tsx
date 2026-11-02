import { useCallback } from 'react'
import notaDinheiro from '../assets/banknote-arrow-down.svg'
import livroImagem from '../assets/book-image.svg'
import olho from '../assets/eye.svg'
import casa from '../assets/house.svg'
import engrenagem from '../assets/settings.svg'
import dividir from '../assets/split.svg'
import pessoas from '../assets/users.svg'
import { obterEvento } from '../api/eventos'
import { AvisoErro } from '../componentes/AvisoErro'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CampoTexto } from '../componentes/CampoTexto'
import { GradeAcessos } from '../componentes/GradeAcessos'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { useCarregamento } from '../hooks/useCarregamento'

/** Tela F1 - Painel do Organizador (Formatura). */
export function PainelFormatura({
  eventoId,
  onVoltar,
  onAbrirFormandos,
  onAbrirRateio,
  onAbrirConfiguracoes,
  onAbrirVisualizacao,
}: {
  eventoId: number
  onVoltar: () => void
  onAbrirFormandos: () => void
  onAbrirRateio: () => void
  onAbrirConfiguracoes: () => void
  onAbrirVisualizacao: () => void
}) {
  const carregar = useCallback(() => obterEvento(eventoId), [eventoId])
  const { dados: evento, erro, recarregar } = useCarregamento(carregar)

  const navegacao = [
    { icone: casa, rotulo: 'Inicio', ativo: true },
    { icone: olho, rotulo: 'Visualizar', onClick: onAbrirVisualizacao },
    { icone: engrenagem, rotulo: 'Configurações', onClick: onAbrirConfiguracoes },
  ]

  return (
    <LayoutPainel itens={navegacao}>
      <BotaoVoltar rotulo="Eventos" onVoltar={onVoltar} />

      <TituloDestaque>{evento?.nomeEvento ?? 'Carregando...'}</TituloDestaque>

      <AvisoErro className="mt-4" mensagem={erro} onTentarNovamente={recarregar} />

      {/* Link para convidados */}
      <CampoTexto
        className="mt-5 lg:max-w-xl"
        rotulo="Link para convidados"
        tomRotulo="campo"
        name="link-publico"
        readOnly
        value={evento ? `${window.location.origin}/${evento.slugPublico}` : ''}
      />

      {/* Acessos rápidos */}
      <div className="mt-6">
        <GradeAcessos
          itens={[
            { icone: pessoas, titulo: 'Formandos', onClick: onAbrirFormandos },
            { icone: notaDinheiro, titulo: 'Despesas' },
            { icone: livroImagem, titulo: 'Mural de fotos' },
            { icone: dividir, titulo: 'Rateio Pagamentos', onClick: onAbrirRateio },
          ]}
        />
      </div>
    </LayoutPainel>
  )
}
