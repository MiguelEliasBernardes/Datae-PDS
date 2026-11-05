import { useRef, useState } from 'react'
import setaDireita from '../assets/arrow-big-right.svg'
import { mensagemDeErro } from '../api/cliente'
import { enviarFotoMural } from '../api/publico'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { CampoTexto } from './CampoTexto'

const TAMANHO_MAXIMO_MB = 10
const MAXIMO_POR_VEZ = 10

/**
 * Botão "Enviar fotos" do mural na página pública. Envia as fotos uma a uma;
 * elas ficam pendentes até o organizador aprovar.
 */
export function EnvioFotosMural({ slug, somenteLeitura = false }: { slug: string; somenteLeitura?: boolean }) {
  const entrada = useRef<HTMLInputElement>(null)
  const [nome, setNome] = useState('')
  const [progresso, setProgresso] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [erros, setErros] = useState<string[]>([])

  async function enviar(arquivos: File[]) {
    setSucesso(null)
    setErros([])

    if (arquivos.length > MAXIMO_POR_VEZ) {
      setErros([`Envie no máximo ${MAXIMO_POR_VEZ} fotos por vez.`])
      return
    }

    let enviadas = 0
    const falhas: string[] = []
    for (const [indice, arquivo] of arquivos.entries()) {
      setProgresso(`Enviando ${indice + 1} de ${arquivos.length}...`)

      // Validação no navegador, antes de chamar a API
      if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
        falhas.push(`${arquivo.name}: a foto pode ter no máximo ${TAMANHO_MAXIMO_MB} MB.`)
        continue
      }
      try {
        await enviarFotoMural(slug, arquivo, nome)
        enviadas++
      } catch (e) {
        falhas.push(`${arquivo.name}: ${mensagemDeErro(e)}`)
      }
    }

    setProgresso(null)
    setErros(falhas)
    if (enviadas > 0) {
      setSucesso(
        `${enviadas === 1 ? 'Foto enviada' : `${enviadas} fotos enviadas`}! Elas aparecem no mural depois que o organizador aprovar.`,
      )
    }
  }

  return (
    <div className="mt-5 flex flex-col gap-3 lg:mx-auto lg:mt-8 lg:max-w-xs">
      <CampoTexto
        name="mural-nome"
        placeholder="Seu nome (opcional)"
        autoComplete="name"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        hidden
        onChange={(e) => {
          const arquivos = Array.from(e.target.files ?? [])
          e.target.value = '' // permite escolher a mesma foto de novo
          if (arquivos.length > 0) void enviar(arquivos)
        }}
      />
      <Botao
        disabled={somenteLeitura}
        carregando={progresso !== null}
        onClick={() => entrada.current?.click()}
        icone={<img src={setaDireita} alt="" width={24} height={24} />}
      >
        Enviar fotos
      </Botao>
      {progresso && <p className="text-center text-[12px] text-muted">{progresso}</p>}
      {sucesso && (
        <p role="status" className="text-center text-[12px] text-success">
          {sucesso}
        </p>
      )}
      <AvisoErro mensagem={erros.length > 0 ? erros.join(' ') : null} />
    </div>
  )
}
