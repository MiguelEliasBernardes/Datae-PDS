import { useState } from 'react'
import { mensagemDeErro } from '../api/cliente'
import { desvincularFormando, gerarNovoConvite } from '../api/formatura'
import type { Formando } from '../api/tipos'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { CartaoConvite } from './CartaoConvite'

/**
 * Convite individual do formando (aparece na janela de edição). Enquanto ninguém aceitou,
 * mostra o código e o link; depois, permite tirar o acesso de quem entrou.
 * `onAlterado` recebe o formando atualizado para a tela refletir o novo código.
 */
export function ConviteFormando({
  eventoId,
  formando,
  onAlterado,
}: {
  eventoId: number
  formando: Formando
  onAlterado: (formando: Formando) => void
}) {
  const [executando, setExecutando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmandoDesvinculo, setConfirmandoDesvinculo] = useState(false)

  async function executar(acao: () => Promise<Formando>) {
    setErro(null)
    setExecutando(true)
    try {
      onAlterado(await acao())
      setConfirmandoDesvinculo(false)
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setExecutando(false)
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-2 border-t border-field-border pt-4">
      <span className="text-[13px] font-medium text-heading">Convite</span>
      <AvisoErro mensagem={erro} />

      {formando.vinculado ? (
        <>
          <p className="text-[12px] text-muted">
            {formando.nome} já entrou na turma e acessa o evento com o papel escolhido acima.
          </p>
          {confirmandoDesvinculo ? (
            <>
              <p className="text-[12px] text-danger">
                A conta perde o acesso ao evento. O formando continua na turma, com os pagamentos e a lista de
                presentes, e ganha um convite novo.
              </p>
              <div className="flex gap-2">
                <Botao type="button" variante="secundario" onClick={() => setConfirmandoDesvinculo(false)}>
                  Cancelar
                </Botao>
                <Botao
                  type="button"
                  variante="perigo"
                  carregando={executando}
                  onClick={() => void executar(() => desvincularFormando(eventoId, formando.id))}
                >
                  Tirar acesso
                </Botao>
              </div>
            </>
          ) : (
            <Botao type="button" variante="secundario" onClick={() => setConfirmandoDesvinculo(true)}>
              Tirar acesso da conta
            </Botao>
          )}
        </>
      ) : (
        <>
          <p className="text-[12px] text-muted">
            Envie o link (ou o código) para {formando.nome}. Ao abrir, a pessoa entra ou cria uma conta e passa a
            participar da formatura. O convite só pode ser usado uma vez.
          </p>
          {formando.codigoConvite && <CartaoConvite codigo={formando.codigoConvite} />}
          <Botao
            type="button"
            variante="secundario"
            carregando={executando}
            onClick={() => void executar(() => gerarNovoConvite(eventoId, formando.id))}
          >
            Gerar outro convite
          </Botao>
        </>
      )}
    </div>
  )
}
