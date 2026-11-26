import { useCallback, useEffect } from 'react'
import { urlApi } from '../api/cliente'
import { listarPresentesFormando, obterPaginaFormando } from '../api/publico'
import { AvisoErro } from '../componentes/AvisoErro'
import { CartaoPix } from '../componentes/CartaoPix'
import { FundoCorEvento } from '../componentes/FundoCorEvento'
import { ListaPresentesPublica } from '../componentes/ListaPresentesPublica'
import { MensagemLista } from '../componentes/MensagemLista'
import { RotuloSecao } from '../componentes/RotuloSecao'
import { formatarDataPorExtenso } from '../dados/formatacao'
import { linkPublicoEvento } from '../dados/rotas'
import { estiloTemaEvento } from '../dados/coresTema'
import { useCarregamento } from '../hooks/useCarregamento'

const titulo = 'font-heading text-[19px] font-bold text-heading lg:text-[28px]'
/** Container centralizado de cada seção. */
const envoltorio = 'mx-auto w-full max-w-5xl px-6 lg:px-10'

/**
 * Sub-página pública de um formando, aberta em /e/{slug}/{formando} (sem login).
 * Mostra o recado e a lista de presentes pessoal dele; reserva, cotas e Pix funcionam
 * como na página da formatura.
 */
export function PaginaFormando({ slug, slugFormando }: { slug: string; slugFormando: string }) {
  const carregar = useCallback(
    () => Promise.all([obterPaginaFormando(slug, slugFormando), listarPresentesFormando(slug, slugFormando)]),
    [slug, slugFormando],
  )
  const { dados, erro, carregando, recarregar } = useCarregamento(carregar)

  const nomeFormando = dados?.[0].formando.nome
  useEffect(() => {
    if (nomeFormando) document.title = `${nomeFormando} · Dataê`
  }, [nomeFormando])

  if (!dados) {
    return (
      <main className="flex min-h-screen w-full flex-col bg-page px-6 pt-10 pb-6">
        <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />
        {carregando && <MensagemLista>Carregando página...</MensagemLista>}
      </main>
    )
  }

  const [{ evento, formando }, presentes] = dados
  const dataPorExtenso = formatarDataPorExtenso(evento.dataEvento)

  // A cor escolhida nas configurações da formatura substitui o roxo padrão
  const estiloTema = estiloTemaEvento(evento.corPrincipal)

  return (
    <main className="min-h-screen w-full bg-page pb-6" style={estiloTema}>
      {/* Capa: o banner da formatura (ou a cor do evento), com o nome do formando */}
      <section className="pt-8 lg:pt-14">
        <div className={envoltorio}>
          <a href={linkPublicoEvento(slug)} className="text-[13px] font-medium text-primary underline">
            ← {evento.nomeEvento}
          </a>
          <div className="relative mt-4 h-56 overflow-hidden rounded-[10px] lg:h-72 lg:rounded-[24px]">
            {evento.bannerUrl ? (
              <img src={urlApi(evento.bannerUrl)} alt="" className="size-full object-cover" />
            ) : (
              <FundoCorEvento className="size-full" />
            )}
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-x-5 bottom-5 lg:inset-x-8 lg:bottom-8">
              <p className="text-[11px] font-bold tracking-[1.8px] text-white uppercase lg:text-[12px]">
                Formatura · {dataPorExtenso}
              </p>
              <h1 className="mt-1 font-heading text-[30px] leading-tight font-bold text-white lg:text-[44px]">
                {formando.nome}
              </h1>
            </div>
          </div>

          {formando.mensagem && (
            <p className="mt-6 rounded-[12px] bg-badge p-4 text-[14px] whitespace-pre-line text-heading lg:p-6 lg:text-[16px]">
              {formando.mensagem}
            </p>
          )}
        </div>
      </section>

      {/* Lista de presentes pessoal */}
      <section className="mt-10 bg-badge py-10 lg:mt-16 lg:py-16">
        <div className={envoltorio}>
          <RotuloSecao className="text-center">PRESENTES</RotuloSecao>
          <h2 className={`mt-4 ${titulo} lg:text-center`}>Lista de presentes de {formando.nome}</h2>
          {evento.listaPresentesAtiva ? (
            <>
              <p className="mt-1 text-[12px] text-muted lg:text-center lg:text-[14px]">
                Reserve um item para ninguém dar o mesmo presente.
              </p>
              <ListaPresentesPublica slug={slug} presentes={presentes} onAlterado={recarregar} />
            </>
          ) : (
            <MensagemLista>A lista de presentes desta formatura não está disponível.</MensagemLista>
          )}
        </div>
      </section>

      {/* Presente em dinheiro: Pix da formatura */}
      {evento.pixDisponivel && (
        <section className="pt-10 lg:pt-16">
          <div className={`${envoltorio} lg:grid lg:grid-cols-2 lg:items-center lg:gap-10`}>
            <div>
              <RotuloSecao className="text-center lg:text-left">PRESENTE EM DINHEIRO</RotuloSecao>
              <h2 className={`mt-4 ${titulo}`}>Prefere ajudar com Pix?</h2>
              <p className="mt-2 hidden text-[14px] text-muted lg:block">
                O valor vai para a conta da formatura, cadastrada pela comissão.
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <CartaoPix slug={slug} slugFormando={slugFormando} nomeRecebedor={evento.nomeRecebedorPix} />
            </div>
          </div>
        </section>
      )}

      {/* Rodapé */}
      <footer className="mt-10 bg-primary-strong py-9 text-center lg:mt-16 lg:py-14">
        <p className="text-[14px] font-bold text-white lg:text-[18px]">{evento.nomeEvento}</p>
        <p className="mt-1 text-[12px] text-primary-soft lg:text-[14px]">{dataPorExtenso}</p>
        <p className="mt-4 text-[11px] text-primary-soft">Página criada com Dataê</p>
      </footer>
    </main>
  )
}
