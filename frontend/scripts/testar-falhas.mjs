/**
 * Testes de falhas: roda a camada src/api do frontend contra o backend de verdade
 * e confere se cada erro chega ao frontend com o status e a mensagem certos.
 *
 * Como rodar (com o backend no ar, perfil "http"):
 *   npm run testar:falhas
 *
 * Os dados criados ficam em usuários de teste que são excluídos no final.
 */
import { createServer } from 'vite'

const URL_BACKEND = process.env.VITE_BACKEND_URL ?? 'http://localhost:5009'
// O cliente da API lê VITE_API_URL; no Node não existe o proxy do Vite, então aponta direto
process.env.VITE_API_URL = URL_BACKEND

// O Node não tem localStorage; esta versão em memória basta para os testes
const armazenamento = new Map()
globalThis.localStorage = {
  getItem: (chave) => (armazenamento.has(chave) ? armazenamento.get(chave) : null),
  setItem: (chave, valor) => armazenamento.set(chave, String(valor)),
  removeItem: (chave) => armazenamento.delete(chave),
  clear: () => armazenamento.clear(),
}

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const carregar = (caminho) => vite.ssrLoadModule(caminho)

const cliente = await carregar('/src/api/cliente.ts')
const sessao = await carregar('/src/api/sessao.ts')
const autenticacao = await carregar('/src/api/autenticacao.ts')
const eventos = await carregar('/src/api/eventos.ts')
const convidados = await carregar('/src/api/convidados.ts')
const presentes = await carregar('/src/api/presentes.ts')

let aprovados = 0
const falhas = []

async function testar(nome, funcao) {
  try {
    await funcao()
    aprovados++
    console.log(`  ✓ ${nome}`)
  } catch (e) {
    falhas.push(nome)
    console.log(`  ✗ ${nome}\n      ${e.message}`)
  }
}

function verificar(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem)
}

/** Garante que a chamada falha com ErroApi no status esperado e devolve o erro. */
async function esperarErro(promessa, status) {
  try {
    await promessa
  } catch (e) {
    verificar(e instanceof cliente.ErroApi, `esperava ErroApi, veio ${e?.constructor?.name}: ${e?.message}`)
    verificar(e.status === status, `esperava status ${status}, veio ${e.status} ("${e.message}")`)
    return e
  }
  throw new Error(`esperava erro ${status}, mas a chamada deu certo`)
}

const sufixo = Date.now()
const emailA = `teste-falhas-a-${sufixo}@datae.dev`
const emailB = `teste-falhas-b-${sufixo}@datae.dev`
const senha = 'senha-de-teste-123'
const daquiUmMes = new Date(Date.now() + 30 * 86_400_000).toISOString()

let tokenA = null
let tokenB = null
const usarSessao = (token) => localStorage.setItem('datae.token', token)

try {
  console.log(`\nBackend: ${URL_BACKEND}\n`)

  console.log('Conexão')
  await testar('servidor fora do ar vira mensagem amigável (status 0)', async () => {
    const fetchOriginal = globalThis.fetch
    globalThis.fetch = () => Promise.reject(new TypeError('fetch failed'))
    try {
      const erro = await esperarErro(eventos.listarEventos(), 0)
      verificar(erro.message.includes('Não foi possível conectar'), `mensagem: "${erro.message}"`)
    } finally {
      globalThis.fetch = fetchOriginal
    }
  })

  console.log('\nLogin e cadastro')
  await testar('login com campos vazios → 400', async () => {
    const erro = await esperarErro(autenticacao.entrar('', ''), 400)
    verificar(erro.doCampo('login'), 'esperava erro no campo "login"')
  })
  await testar('cadastro com e-mail inválido e senha curta → 400 por campo', async () => {
    const erro = await esperarErro(autenticacao.cadastrar('Teste', 'email-sem-arroba', '123'), 400)
    verificar(erro.doCampo('email'), 'esperava erro no campo "email"')
    verificar(erro.doCampo('senha'), 'esperava erro no campo "senha"')
  })
  await testar('cadastro válido salva o token', async () => {
    const usuario = await autenticacao.cadastrar('Teste Falhas A', emailA, senha)
    tokenA = sessao.obterToken()
    verificar(usuario.email === emailA && tokenA, 'token não foi salvo')
  })
  await testar('cadastro com e-mail repetido → 409', async () => {
    const erro = await esperarErro(autenticacao.cadastrar('Outro', emailA.toUpperCase(), senha), 409)
    verificar(erro.message.includes('Já existe'), `mensagem: "${erro.message}"`)
    usarSessao(tokenA)
  })
  await testar('senha errada → 401 sem derrubar a tela (não é sessão expirada)', async () => {
    sessao.limparSessao()
    let expirou = false
    cliente.definirAoExpirarSessao(() => (expirou = true))
    const erro = await esperarErro(autenticacao.entrar(emailA, 'senha-errada'), 401)
    verificar(erro.message === 'E-mail ou senha inválidos.', `mensagem: "${erro.message}"`)
    verificar(!expirou, 'não deveria disparar "sessão expirada" no login')
    cliente.definirAoExpirarSessao(null)
  })
  await testar('Google com credencial falsa → recusado (401, ou 503 se o servidor não tiver Client ID)', async () => {
    sessao.limparSessao()
    let erro
    try {
      await autenticacao.entrarComGoogle('credencial-falsa')
    } catch (e) {
      erro = e
    }
    verificar(erro instanceof cliente.ErroApi, 'a credencial falsa foi aceita!')
    verificar([401, 503].includes(erro.status), `status ${erro.status}: "${erro.message}"`)
    verificar(sessao.obterToken() === null, 'não deveria ter salvo sessão')
  })
  await testar('Google sem credencial → recusado', async () => {
    let erro
    try {
      await autenticacao.entrarComGoogle('')
    } catch (e) {
      erro = e
    }
    verificar(erro instanceof cliente.ErroApi && [401, 503].includes(erro.status), `resultado: ${erro?.status}`)
  })
  await testar('login válido', async () => {
    await autenticacao.entrar(emailA, senha)
    tokenA = sessao.obterToken()
    verificar(tokenA, 'sem token')
  })

  console.log('\nEventos')
  let evento = null
  await testar('criar evento sem nome → 400 no campo nomeEvento', async () => {
    const erro = await esperarErro(eventos.criarEvento({ tipo: 'Casamento', dataEvento: daquiUmMes, nomeEvento: ' ' }), 400)
    verificar(erro.doCampo('nomeEvento'), 'esperava erro em nomeEvento')
  })
  await testar('criar evento com cor fora do formato → 400 no campo corPrincipal', async () => {
    const erro = await esperarErro(
      eventos.criarEvento({ tipo: 'Casamento', dataEvento: daquiUmMes, nomeEvento: 'X', corPrincipal: 'roxo' }),
      400,
    )
    verificar(erro.doCampo('corPrincipal'), 'esperava erro em corPrincipal')
  })
  await testar('tipo de evento inexistente → 400 com mensagem genérica', async () => {
    const erro = await esperarErro(eventos.criarEvento({ tipo: 'Festa', dataEvento: daquiUmMes, nomeEvento: 'X' }), 400)
    verificar(erro.message.length > 0, 'mensagem vazia')
  })
  await testar('criar evento válido gera slug a partir do nome', async () => {
    evento = await eventos.criarEvento({
      tipo: 'ChaDePanela',
      dataEvento: daquiUmMes,
      nomeEvento: `Chá de Panela Teste ${sufixo}`,
      corPrincipal: '#534ab7',
    })
    verificar(evento.slugPublico === `cha-de-panela-teste-${sufixo}`, `slug: ${evento.slugPublico}`)
  })
  await testar('evento inexistente → 404', async () => {
    const erro = await esperarErro(eventos.obterEvento(999_999_999), 404)
    verificar(erro.message === 'Evento não encontrado.', `mensagem: "${erro.message}"`)
  })

  console.log('\nIsolamento entre usuários')
  let eventoB = null
  await testar('outro usuário não enxerga o evento (404, não 403)', async () => {
    await autenticacao.cadastrar('Teste Falhas B', emailB, senha)
    tokenB = sessao.obterToken()
    eventoB = await eventos.criarEvento({ tipo: 'Aniversario', dataEvento: daquiUmMes, nomeEvento: `Aniversário B ${sufixo}` })
    await esperarErro(eventos.obterEvento(evento.id), 404)
    await esperarErro(convidados.listarConvidados(evento.id), 404)
    await esperarErro(presentes.criarPresente(evento.id, { nome: 'Invasor' }), 404)
  })
  await testar('slug já usado por outro evento → 409', async () => {
    const erro = await esperarErro(eventos.atualizarEvento(eventoB.id, { slugPublico: evento.slugPublico }), 409)
    verificar(erro.message.includes('em uso'), `mensagem: "${erro.message}"`)
  })
  await testar('slug com acento/espaço → 400', async () => {
    const erro = await esperarErro(eventos.atualizarEvento(eventoB.id, { slugPublico: 'Meu Aniversário' }), 400)
    verificar(erro.doCampo('slugPublico'), 'esperava erro em slugPublico')
  })

  console.log('\nConvidados')
  usarSessao(tokenA)
  let convidado = null
  await testar('convidado sem nome, e-mail inválido e acompanhantes negativos → 400 por campo', async () => {
    const erro = await esperarErro(
      convidados.criarConvidado(evento.id, { nome: '', email: 'invalido', quantidadeAcompanhantes: -1 }),
      400,
    )
    verificar(erro.doCampo('nome') && erro.doCampo('email') && erro.doCampo('quantidadeAcompanhantes'), JSON.stringify(erro.errosCampos))
  })
  await testar('criar e atualizar convidado', async () => {
    convidado = await convidados.criarConvidado(evento.id, { nome: 'Ana Silva', email: 'ANA@Exemplo.com ' })
    verificar(convidado.email === 'ana@exemplo.com' && convidado.statusPresenca === 'Pendente', JSON.stringify(convidado))
    const atualizado = await convidados.atualizarConvidado(evento.id, convidado.id, { statusPresenca: 'Confirmado', quantidadeAcompanhantes: 2 })
    verificar(atualizado.statusPresenca === 'Confirmado' && atualizado.quantidadeAcompanhantes === 2, JSON.stringify(atualizado))
  })
  await testar('convidado inexistente → 404', async () => {
    await esperarErro(convidados.atualizarConvidado(evento.id, 999_999_999, { nome: 'X' }), 404)
  })

  console.log('\nPresentes')
  let presente = null
  await testar('presente com valor negativo → 400 no campo valorEstimado', async () => {
    const erro = await esperarErro(presentes.criarPresente(evento.id, { nome: 'Panela', valorEstimado: -5 }), 400)
    verificar(erro.doCampo('valorEstimado'), 'esperava erro em valorEstimado')
  })
  await testar('criar presente e reservar para um convidado', async () => {
    presente = await presentes.criarPresente(evento.id, { nome: 'Jogo de Panelas', valorEstimado: 199.9 })
    const reservado = await cliente.requisicao(`/api/eventos/${evento.id}/presentes/${presente.id}`, 'PUT', { convidadoId: convidado.id })
    verificar(reservado.status === 'Reservado' && reservado.convidadoId === convidado.id, JSON.stringify(reservado))
  })
  await testar('reservar para convidado de outro evento → 400', async () => {
    const erro = await esperarErro(
      cliente.requisicao(`/api/eventos/${evento.id}/presentes/${presente.id}`, 'PUT', { convidadoId: 999_999_999 }),
      400,
    )
    verificar(erro.doCampo('convidadoId'), 'esperava erro em convidadoId')
  })
  await testar('excluir o convidado libera o presente (convidadoId vira null)', async () => {
    await convidados.excluirConvidado(evento.id, convidado.id)
    const lista = await presentes.listarPresentes(evento.id)
    const depois = lista.find((p) => p.id === presente.id)
    verificar(depois && depois.convidadoId === null, JSON.stringify(depois))
  })

  console.log('\nSessão')
  await testar('token inválido → 401, limpa a sessão e avisa o App', async () => {
    usarSessao('token-invalido')
    let expirou = false
    cliente.definirAoExpirarSessao(() => (expirou = true))
    const erro = await esperarErro(eventos.listarEventos(), 401)
    verificar(erro.message.includes('sessão expirou'), `mensagem: "${erro.message}"`)
    verificar(expirou, 'o App não foi avisado')
    verificar(sessao.obterToken() === null, 'o token não foi apagado')
    cliente.definirAoExpirarSessao(null)
  })
  await testar('token com data de expiração passada é descartado antes de chamar a API', async () => {
    usarSessao(tokenA)
    localStorage.setItem('datae.expiraEm', new Date(Date.now() - 1000).toISOString())
    verificar(sessao.obterToken() === null, 'deveria considerar a sessão expirada')
    verificar(sessao.obterUsuario() === null, 'não deveria haver usuário')
  })

  console.log('\nExclusão')
  usarSessao(tokenA)
  await testar('excluir evento apaga convidados e presentes junto', async () => {
    await eventos.excluirEvento(evento.id)
    await esperarErro(eventos.obterEvento(evento.id), 404)
    await esperarErro(presentes.listarPresentes(evento.id), 404)
  })
} finally {
  // Limpeza: excluir os usuários de teste apaga tudo o que eles criaram
  for (const token of [tokenA, tokenB]) {
    if (!token) continue
    usarSessao(token)
    await cliente.requisicao('/api/usuarios/eu', 'DELETE').catch(() => {})
  }
  await vite.close()
}

console.log(`\n${aprovados} aprovados, ${falhas.length} com falha`)
if (falhas.length > 0) process.exitCode = 1
