import { useState } from 'react'
import { mensagemDeErro } from '../api/cliente'
import { desativarCodigoTurma, gerarCodigoTurma } from '../api/formatura'
import type { Evento } from '../api/tipos'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { CartaoConvite } from './CartaoConvite'

/**
 * Código geral de convite da turma: quem entra por ele vira um formando novo (papel Membro).
 * Prático para turmas grandes; o organizador liga, troca ou desliga quando quiser.
 */
export function CodigoTurma({ evento, onAlterado }: { evento: Evento; onAlterado: (evento: Evento) => void }) {
  const [executando, setExecutando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function executar(acao: () => Promise<Evento>) {
    setErro(null)
    setExecutando(true)
    try {
      onAlterado(await acao())
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setExecutando(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-[12px] border-[1.5px] border-field-border p-4 lg:max-w-xl">
      <span className="font-display text-[14px] font-semibold text-primary-strong">Código da turma</span>
      <p className="font-display text-[11px] text-muted">
        {evento.codigoTurma
          ? 'Qualquer pessoa com este link entra como formando novo (papel Membro). Troque ou desligue o código se ele for parar em quem não deve.'
          : 'Ligue para ter um único link para a turma toda: quem entrar por ele vira um formando novo. Os convites individuais continuam valendo.'}
      </p>
      <AvisoErro mensagem={erro} />
      {evento.codigoTurma && <CartaoConvite codigo={evento.codigoTurma} />}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Botao
          type="button"
          variante="secundario"
          tamanho="pequeno"
          carregando={executando}
          onClick={() => void executar(() => gerarCodigoTurma(evento.id))}
        >
          {evento.codigoTurma ? 'Gerar outro código' : 'Ligar código da turma'}
        </Botao>
        {evento.codigoTurma && (
          <Botao
            type="button"
            variante="perigo"
            tamanho="pequeno"
            disabled={executando}
            onClick={() => void executar(() => desativarCodigoTurma(evento.id))}
          >
            Desligar
          </Botao>
        )}
      </div>
    </div>
  )
}
