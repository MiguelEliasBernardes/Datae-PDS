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
const publico = await carregar('/src/api/publico.ts')
const formatura = await carregar('/src/api/formatura.ts')
const convites = await carregar('/src/api/convites.ts')
const checklist = await carregar('/src/api/checklist.ts')
const posEvento = await carregar('/src/api/posEvento.ts')
const assistente = await carregar('/src/api/assistente.ts')
const usuarios = await carregar('/src/api/usuarios.ts')
const relatorioPix = await carregar('/src/api/pix.ts')
const organizacao = await carregar('/src/api/organizacao.ts')

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
const emailC = `teste-falhas-c-${sufixo}@datae.dev`
const senha = 'senha-de-teste-123'
const daquiUmMes = new Date(Date.now() + 30 * 86_400_000).toISOString()

let tokenA = null
let tokenB = null
let tokenC = null
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

  console.log('\nCotas de presente')
  let presenteCotas = null
  await testar('dividir em cotas sem valor → 400 no campo valorEstimado', async () => {
    const erro = await esperarErro(presentes.criarPresente(evento.id, { nome: 'Geladeira', quantidadeCotas: 4 }), 400)
    verificar(erro.doCampo('valorEstimado'), JSON.stringify(erro.errosCampos))
  })
  await testar('quantidade de cotas fora de 2 a 100 → 400 no campo quantidadeCotas', async () => {
    const erro = await esperarErro(
      presentes.criarPresente(evento.id, { nome: 'Geladeira', valorEstimado: 200, quantidadeCotas: 1 }),
      400,
    )
    verificar(erro.doCampo('quantidadeCotas'), JSON.stringify(erro.errosCampos))
  })
  await testar('criar presente com 4 cotas calcula o valor de cada cota', async () => {
    presenteCotas = await presentes.criarPresente(evento.id, { nome: 'Geladeira', valorEstimado: 200, quantidadeCotas: 4 })
    verificar(presenteCotas.valorCota === 50 && presenteCotas.cotasVendidas === 0, JSON.stringify(presenteCotas))
  })
  await testar('presente com cotas não pode ser reservado inteiro → 409', async () => {
    await esperarErro(publico.reservarPresente(evento.slugPublico, presenteCotas.id, 'Bia', false), 409)
  })
  await testar('comprar mais cotas do que restam → 400 no campo quantidade', async () => {
    const erro = await esperarErro(publico.comprarCotas(evento.slugPublico, presenteCotas.id, 'Bia', 5), 400)
    verificar(erro.doCampo('quantidade'), JSON.stringify(erro.errosCampos))
  })
  await testar('comprar 3 cotas sem Pix configurado → registra, sem QR Code', async () => {
    const compra = await publico.comprarCotas(evento.slugPublico, presenteCotas.id, 'Bia Souza', 3)
    verificar(compra.valor === 150 && compra.pix === null, JSON.stringify(compra))
    verificar(compra.presente.cotasVendidas === 3 && compra.presente.status === 'Disponivel', JSON.stringify(compra.presente))
  })
  await testar('reduzir o total abaixo das cotas vendidas → 400', async () => {
    const erro = await esperarErro(presentes.atualizarPresente(evento.id, presenteCotas.id, { quantidadeCotas: 2 }), 400)
    verificar(erro.doCampo('quantidadeCotas'), JSON.stringify(erro.errosCampos))
  })
  await testar('com Pix configurado, a última cota vem com QR Code e o presente vira Comprado', async () => {
    await eventos.atualizarEvento(evento.id, { chavePix: 'pix@datae.dev', nomeRecebedorPix: 'Teste', cidadePix: 'Sao Paulo' })
    const compra = await publico.comprarCotas(evento.slugPublico, presenteCotas.id, 'Carlos', 1)
    verificar(compra.pix?.copiaECola && compra.pix.valor === 50, JSON.stringify(compra.pix))
    verificar(compra.presente.status === 'Comprado', `status: ${compra.presente.status}`)
  })
  await testar('cotas esgotadas → 409', async () => {
    await esperarErro(publico.comprarCotas(evento.slugPublico, presenteCotas.id, 'Davi', 1), 409)
  })
  await testar('organizador desfaz uma compra e as cotas voltam a ficar disponíveis', async () => {
    const cotas = await presentes.listarCotas(evento.id, presenteCotas.id)
    verificar(cotas.length === 2, `compras: ${cotas.length}`)
    const daBia = cotas.find((c) => c.nomeConvidado === 'Bia Souza')
    const depois = await presentes.excluirCota(evento.id, presenteCotas.id, daBia.id)
    verificar(depois.cotasVendidas === 1 && depois.status === 'Disponivel', JSON.stringify(depois))
  })
  await testar('tirar as cotas com compras registradas → 400', async () => {
    await esperarErro(presentes.atualizarPresente(evento.id, presenteCotas.id, { quantidadeCotas: 0 }), 400)
  })

  console.log('\nInterruptores da página')
  await testar('lista de presentes desativada some da página e recusa reservas (404)', async () => {
    const atualizado = await eventos.atualizarEvento(evento.id, { listaPresentesAtiva: false })
    verificar(atualizado.listaPresentesAtiva === false && atualizado.muralAtivo === true, JSON.stringify(atualizado))
    const pagina = await publico.obterEventoPublico(evento.slugPublico)
    verificar(pagina.listaPresentesAtiva === false, 'página pública não sabe que a lista está desativada')
    verificar((await publico.listarPresentesPublicos(evento.slugPublico)).length === 0, 'ainda lista presentes')
    await esperarErro(publico.reservarPresente(evento.slugPublico, presente.id, 'Bia', false), 404)
    await esperarErro(publico.comprarCotas(evento.slugPublico, presenteCotas.id, 'Bia', 1), 404)
    await eventos.atualizarEvento(evento.id, { listaPresentesAtiva: true })
  })
  await testar('mural desativado recusa fotos (404)', async () => {
    await eventos.atualizarEvento(evento.id, { muralAtivo: false })
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])], 'foto.png', { type: 'image/png' })
    const erro = await esperarErro(publico.enviarFotoMural(evento.slugPublico, png, 'Bia'), 404)
    verificar(erro.message.includes('mural'), `mensagem: "${erro.message}"`)
    await eventos.atualizarEvento(evento.id, { muralAtivo: true })
  })

  console.log('\nFormatura')
  let formaturaEvento = null
  let ana = null
  let joao = null
  await testar('formandos em evento que não é formatura → 409', async () => {
    await esperarErro(formatura.listarFormandos(evento.id), 409)
    await esperarErro(formatura.obterRateio(evento.id), 409)
  })
  await testar('formando sem nome e com e-mail inválido → 400 por campo', async () => {
    formaturaEvento = await eventos.criarEvento({ tipo: 'Formatura', dataEvento: daquiUmMes, nomeEvento: `Formatura ${sufixo}` })
    const erro = await esperarErro(formatura.criarFormando(formaturaEvento.id, { nome: ' ', email: 'x' }), 400)
    verificar(erro.doCampo('nome') && erro.doCampo('email'), JSON.stringify(erro.errosCampos))
  })
  await testar('criar formandos (papel padrão Membro)', async () => {
    ana = await formatura.criarFormando(formaturaEvento.id, { nome: '  Ana   Lima ' })
    joao = await formatura.criarFormando(formaturaEvento.id, { nome: 'João', papel: 'Administrador' })
    verificar(ana.nome === 'Ana Lima' && ana.papel === 'Membro' && joao.papel === 'Administrador', JSON.stringify([ana, joao]))
  })
  await testar('despesa com valor zero → 400 no campo valor', async () => {
    const erro = await esperarErro(formatura.criarDespesa(formaturaEvento.id, { descricao: 'Buffet', valor: 0 }), 400)
    verificar(erro.doCampo('valor'), JSON.stringify(erro.errosCampos))
  })
  await testar('rateio divide o total das despesas entre os formandos', async () => {
    await formatura.criarDespesa(formaturaEvento.id, { descricao: 'Buffet', valor: 300 })
    await formatura.criarDespesa(formaturaEvento.id, { descricao: 'Fotógrafo', valor: 100.05 })
    const rateio = await formatura.obterRateio(formaturaEvento.id)
    verificar(rateio.totalDespesas === 400.05 && rateio.valorPorFormando === 200.03, JSON.stringify(rateio))
    verificar(rateio.formandos.every((f) => !f.quitado && f.percentual === 0), JSON.stringify(rateio.formandos))
  })
  await testar('pagamento com valor negativo → 400 no campo valor', async () => {
    const erro = await esperarErro(formatura.registrarPagamento(formaturaEvento.id, ana.id, { valor: -10 }), 400)
    verificar(erro.doCampo('valor'), JSON.stringify(erro.errosCampos))
  })
  await testar('pagamento completo deixa o formando quitado', async () => {
    await formatura.registrarPagamento(formaturaEvento.id, ana.id, { valor: 200.03, observacao: 'Pix' })
    await formatura.registrarPagamento(formaturaEvento.id, joao.id, { valor: 50 })
    const rateio = await formatura.obterRateio(formaturaEvento.id)
    const daAna = rateio.formandos.find((f) => f.formandoId === ana.id)
    const doJoao = rateio.formandos.find((f) => f.formandoId === joao.id)
    verificar(daAna.quitado && daAna.percentual === 100, JSON.stringify(daAna))
    verificar(!doJoao.quitado && doJoao.percentual === 24, JSON.stringify(doJoao))
    verificar(rateio.totalPago === 250.03 && rateio.percentualPago === 62, JSON.stringify(rateio))
  })
  await testar('outro usuário não enxerga formandos nem rateio (404)', async () => {
    usarSessao(tokenB)
    await esperarErro(formatura.listarFormandos(formaturaEvento.id), 404)
    await esperarErro(formatura.obterRateio(formaturaEvento.id), 404)
    await esperarErro(formatura.registrarPagamento(formaturaEvento.id, ana.id, { valor: 10 }), 404)
    usarSessao(tokenA)
  })
  await testar('excluir formando apaga os pagamentos e refaz a divisão', async () => {
    await formatura.excluirFormando(formaturaEvento.id, ana.id)
    const rateio = await formatura.obterRateio(formaturaEvento.id)
    verificar(rateio.quantidadeFormandos === 1 && rateio.valorPorFormando === 400.05 && rateio.totalPago === 50, JSON.stringify(rateio))
  })

  console.log('\nConvites e papéis da comissão')
  let bia = null
  await testar('formando novo já vem com convite e endereço próprio', async () => {
    bia = await formatura.criarFormando(formaturaEvento.id, { nome: 'Bia Costa' })
    verificar(bia.codigoConvite && bia.slug === 'bia-costa' && !bia.vinculado, JSON.stringify(bia))
  })
  await testar('ver o convite não exige login (e aceita o código em minúsculas)', async () => {
    localStorage.removeItem('datae.token')
    const convite = await convites.obterConvite(bia.codigoConvite.toLowerCase())
    verificar(convite.tipo === 'Formando' && convite.nomeFormando === 'Bia Costa', JSON.stringify(convite))
  })
  await testar('aceitar o convite liga a conta ao formando, com papel Membro', async () => {
    usarSessao(tokenB)
    const aceito = await convites.aceitarConvite(bia.codigoConvite)
    verificar(aceito.id === formaturaEvento.id && aceito.meuPapel === 'Membro' && !aceito.organizador, JSON.stringify(aceito))
    verificar(aceito.permissoes.join() === 'VerEvento', `permissões: ${aceito.permissoes.join()}`)
    verificar((await eventos.listarEventos()).some((e) => e.id === formaturaEvento.id), 'a formatura não aparece em Meus Eventos')
  })
  await testar('o convite individual só vale uma vez (404)', async () => {
    await esperarErro(convites.aceitarConvite(bia.codigoConvite), 404)
  })
  await testar('membro vê as despesas, mas não lança nem gerencia (403)', async () => {
    verificar((await formatura.listarDespesas(formaturaEvento.id)).length === 2, 'membro não viu as despesas')
    await esperarErro(formatura.criarDespesa(formaturaEvento.id, { descricao: 'X', valor: 10 }), 403)
    await esperarErro(formatura.listarFormandos(formaturaEvento.id), 403)
    await esperarErro(eventos.atualizarEvento(formaturaEvento.id, { nomeEvento: 'Invadido' }), 403)
    await esperarErro(eventos.excluirEvento(formaturaEvento.id), 403)
  })
  await testar('membro vê os totais da turma e só a própria parte no rateio', async () => {
    const rateio = await formatura.obterRateio(formaturaEvento.id)
    verificar(rateio.quantidadeFormandos === 2 && rateio.totalDespesas === 400.05, JSON.stringify(rateio))
    verificar(rateio.formandos.length === 1 && rateio.formandos[0].formandoId === bia.id, JSON.stringify(rateio.formandos))
    await esperarErro(formatura.listarPagamentos(formaturaEvento.id, joao.id), 403)
    verificar((await formatura.listarPagamentos(formaturaEvento.id, bia.id)).length === 0, 'esperava ver os próprios pagamentos')
  })
  await testar('papel Financeiro libera despesas e os pagamentos de todos', async () => {
    usarSessao(tokenA)
    await formatura.atualizarFormando(formaturaEvento.id, bia.id, { papel: 'Financeiro' })
    usarSessao(tokenB)
    const visto = await eventos.obterEvento(formaturaEvento.id)
    verificar(visto.permissoes.includes('Financeiro') && !visto.permissoes.includes('GerenciarEvento'), visto.permissoes.join())
    await formatura.registrarPagamento(formaturaEvento.id, joao.id, { valor: 10 })
    verificar((await formatura.obterRateio(formaturaEvento.id)).formandos.length === 2, 'financeiro deveria ver todos')
    await esperarErro(formatura.criarFormando(formaturaEvento.id, { nome: 'X' }), 403)
  })
  await testar('a lista pessoal do formando aparece só na sub-página dele', async () => {
    const meu = await formatura.obterMeuFormando(formaturaEvento.id)
    await formatura.atualizarMeuFormando(formaturaEvento.id, { mensagem: 'Obrigada!' })
    const anel = await presentes.criarPresente(formaturaEvento.id, { nome: 'Anel de formatura', valorEstimado: 300 }, true)
    const daTurma = await publico.listarPresentesPublicos(formaturaEvento.slugPublico)
    verificar(!daTurma.some((p) => p.id === anel.id), 'presente pessoal apareceu na lista da turma')
    const pagina = await publico.obterPaginaFormando(formaturaEvento.slugPublico, meu.slug)
    verificar(pagina.formando.nome === 'Bia Costa' && pagina.formando.mensagem === 'Obrigada!', JSON.stringify(pagina.formando))
    const daBia = await publico.listarPresentesFormando(formaturaEvento.slugPublico, meu.slug)
    verificar(daBia.length === 1 && daBia[0].id === anel.id, JSON.stringify(daBia))
    const reserva = await publico.reservarPresente(formaturaEvento.slugPublico, anel.id, 'Tia Rosa', false)
    verificar(reserva.presente.status === 'Reservado', JSON.stringify(reserva.presente))
    verificar((await publico.listarFormandosPublicos(formaturaEvento.slugPublico)).length === 2, 'formandos públicos')
    await esperarErro(publico.obterPaginaFormando(formaturaEvento.slugPublico, 'nao-existe'), 404)
  })
  await testar('organizador que não é formando não tem lista pessoal (409)', async () => {
    usarSessao(tokenA)
    await esperarErro(presentes.listarPresentes(formaturaEvento.id, true), 409)
  })
  await testar('código da turma: quem entra vira formando novo; desligado, deixa de valer', async () => {
    const comCodigo = await formatura.gerarCodigoTurma(formaturaEvento.id)
    verificar(comCodigo.codigoTurma, 'código da turma não veio')
    await autenticacao.cadastrar('Teste Falhas C', emailC, senha)
    tokenC = sessao.obterToken()
    verificar((await convites.obterConvite(comCodigo.codigoTurma)).tipo === 'Turma', 'tipo do convite')
    const aceito = await convites.aceitarConvite(comCodigo.codigoTurma)
    verificar(aceito.meuPapel === 'Membro' && aceito.codigoTurma === null, JSON.stringify(aceito))
    await esperarErro(convites.aceitarConvite(comCodigo.codigoTurma), 409)
    usarSessao(tokenA)
    const lista = await formatura.listarFormandos(formaturaEvento.id)
    verificar(lista.some((f) => f.nome === 'Teste Falhas C' && f.vinculado && f.codigoConvite === null), JSON.stringify(lista))
    const desligado = await formatura.desativarCodigoTurma(formaturaEvento.id)
    verificar(desligado.codigoTurma === null, 'código continuou ligado')
    await esperarErro(convites.obterConvite(comCodigo.codigoTurma), 404)
  })
  await testar('código da turma em evento que não é formatura → 409', async () => {
    await esperarErro(formatura.gerarCodigoTurma(evento.id), 409)
  })
  await testar('desvincular tira o acesso da conta (404) e gera um convite novo', async () => {
    const atualizado = await formatura.desvincularFormando(formaturaEvento.id, bia.id)
    verificar(!atualizado.vinculado && atualizado.codigoConvite && atualizado.codigoConvite !== bia.codigoConvite, JSON.stringify(atualizado))
    usarSessao(tokenB)
    await esperarErro(eventos.obterEvento(formaturaEvento.id), 404)
    usarSessao(tokenA)
  })

  console.log('\nChecklist')
  let lista = null
  await testar('a checklist começa vazia (sem tarefas padrão), com as dicas', async () => {
    lista = await checklist.obterChecklist(evento.id)
    verificar(lista.podeGerenciar && lista.itens.length === 0, `itens: ${lista.itens.length}`)
    verificar(lista.dicas.length > 0, 'as dicas deveriam continuar')
  })
  await testar('dicas refletem o estado do evento', async () => {
    const dica = (chave) => lista.dicas.find((d) => d.chave === chave)
    verificar(dica('banner') && !dica('banner').concluida, 'dica do banner deveria estar pendente')
    verificar(dica('pix')?.concluida, 'o Pix foi configurado nos testes de cotas')
    verificar(dica('presentes')?.concluida, 'o evento já tem presentes')
  })
  let alugarMesas = null
  await testar('item sem título → 400; item manual entra com prazo calculado pela data do evento', async () => {
    const erro = await esperarErro(checklist.criarItemChecklist(evento.id, { titulo: ' ' }), 400)
    verificar(erro.doCampo('titulo'), JSON.stringify(erro.errosCampos))
    const nova = await checklist.criarItemChecklist(evento.id, { titulo: 'Alugar mesas', categoria: 'Preparativos', diasAntes: 30 })
    alugarMesas = nova.itens.find((i) => i.titulo === 'Alugar mesas')
    const esperado = new Date(new Date(evento.dataEvento).getTime() - 30 * 86_400_000).toISOString().slice(0, 10)
    verificar(alugarMesas?.origem === 'Manual' && alugarMesas.prazo?.slice(0, 10) === esperado, JSON.stringify(alugarMesas))
  })
  await testar('responsável por item só existe na formatura → 400', async () => {
    const erro = await esperarErro(checklist.criarItemChecklist(evento.id, { titulo: 'X', responsavelFormandoId: 1 }), 400)
    verificar(erro.doCampo('responsavelFormandoId'), JSON.stringify(erro.errosCampos))
  })
  await testar('marcar e desmarcar como feito', async () => {
    const marcada = await checklist.atualizarItemChecklist(evento.id, alugarMesas.id, { concluido: true })
    verificar(marcada.itens.find((i) => i.id === alugarMesas.id)?.concluido, 'não marcou')
    const desmarcada = await checklist.atualizarItemChecklist(evento.id, alugarMesas.id, { concluido: false })
    verificar(!desmarcada.itens.find((i) => i.id === alugarMesas.id)?.concluido, 'não desmarcou')
  })
  await testar('item de "Itens" vira presente (sem valor) e não duplica', async () => {
    await checklist.criarItemChecklist(evento.id, { titulo: 'Jogo de panelas', categoria: 'Itens' })
    const comItens = await checklist.criarItemChecklist(evento.id, { titulo: 'Faqueiro 24 peças', categoria: 'Itens' })
    const panelas = comItens.itens.find((i) => i.titulo === 'Jogo de panelas')
    // Já existe "Jogo de Panelas" na lista (criado nos testes de presentes): nome igual, sem diferenciar maiúsculas
    await esperarErro(checklist.adicionarItemComoPresente(evento.id, panelas.id), 409)
    const talheres = comItens.itens.find((i) => i.titulo === 'Faqueiro 24 peças')
    const depois = await checklist.adicionarItemComoPresente(evento.id, talheres.id)
    const item = depois.itens.find((i) => i.id === talheres.id)
    verificar(item.concluido && !item.podeVirarPresente, JSON.stringify(item))
    const presente = (await presentes.listarPresentes(evento.id)).find((p) => p.nome === talheres.titulo)
    verificar(presente && presente.valorEstimado === null, JSON.stringify(presente))
  })
  await testar('na formatura, o responsável marca o próprio item, mas não edita nem marca os outros (403)', async () => {
    const formandosDaTurma = await formatura.listarFormandos(formaturaEvento.id)
    const doC = formandosDaTurma.find((f) => f.nome === 'Teste Falhas C')
    const vazia = await checklist.obterChecklist(formaturaEvento.id)
    verificar(vazia.itens.length === 0, `a formatura não deveria vir com tarefas: ${vazia.itens.length}`)
    await checklist.criarItemChecklist(formaturaEvento.id, { titulo: 'Reservar o salão', categoria: 'Cerimonia' })
    const daFormatura = await checklist.criarItemChecklist(formaturaEvento.id, { titulo: 'Contratar fotógrafo', categoria: 'Preparativos' })
    const doTesteC = daFormatura.itens.find((i) => i.titulo === 'Reservar o salão')
    const outro = daFormatura.itens.find((i) => i.titulo === 'Contratar fotógrafo')
    await checklist.atualizarItemChecklist(formaturaEvento.id, doTesteC.id, { responsavelFormandoId: doC.id })

    usarSessao(tokenC)
    const vistaPorC = await checklist.obterChecklist(formaturaEvento.id)
    verificar(!vistaPorC.podeGerenciar, 'membro não deveria gerenciar')
    const meuItem = vistaPorC.itens.find((i) => i.id === doTesteC.id)
    verificar(meuItem.podeConcluir && meuItem.responsavelNome === 'Teste Falhas C', JSON.stringify(meuItem))
    verificar(vistaPorC.dicas.some((d) => d.chave === 'minha-lista') && !vistaPorC.dicas.some((d) => d.chave === 'banner'), 'dicas do membro')
    const feito = await checklist.atualizarItemChecklist(formaturaEvento.id, doTesteC.id, { concluido: true })
    verificar(feito.itens.find((i) => i.id === doTesteC.id)?.concluido, 'responsável não conseguiu marcar')
    await esperarErro(checklist.atualizarItemChecklist(formaturaEvento.id, doTesteC.id, { titulo: 'Mudei' }), 403)
    await esperarErro(checklist.atualizarItemChecklist(formaturaEvento.id, outro.id, { concluido: true }), 403)
    await esperarErro(checklist.criarItemChecklist(formaturaEvento.id, { titulo: 'X' }), 403)

    usarSessao(tokenB)
    await esperarErro(checklist.obterChecklist(formaturaEvento.id), 404)
    usarSessao(tokenA)
  })

  console.log('\nPós-evento')
  const ontem = new Date(Date.now() - 86_400_000).toISOString()
  let festa = null
  await testar('telefone e e-mail inválidos na presença → 400 nos campos certos', async () => {
    festa = await eventos.criarEvento({ tipo: 'Aniversario', dataEvento: ontem, nomeEvento: `Festa passada ${sufixo}` })
    const erro = await esperarErro(
      publico.confirmarPresenca(festa.slugPublico, { nome: 'Ana Lima', vaiComparecer: true, telefone: '123', email: 'sem-arroba' }),
      400,
    )
    verificar(erro.doCampo('telefone') && erro.doCampo('email'), JSON.stringify(erro.errosCampos))
  })
  await testar('contatos da presença, da reserva e das cotas chegam ao convidado (telefone com DDI)', async () => {
    await publico.confirmarPresenca(festa.slugPublico, {
      nome: 'Ana Lima', vaiComparecer: true, quantidadeAcompanhantes: 1, telefone: '(11) 98888-7777', email: 'Ana@Exemplo.com',
    })
    const bolo = await presentes.criarPresente(festa.id, { nome: 'Forma de bolo', valorEstimado: 200 })
    const viagem = await presentes.criarPresente(festa.id, { nome: 'Viagem', valorEstimado: 300, quantidadeCotas: 3 })
    await publico.reservarPresente(festa.slugPublico, bolo.id, 'Bruno Reis', true, { telefone: '', email: 'bruno@exemplo.com' })
    // Sem contato desta vez: o telefone e o e-mail que a Ana deixou antes continuam
    await publico.comprarCotas(festa.slugPublico, viagem.id, 'ana lima', 2)
    const lista = await convidados.listarConvidados(festa.id)
    const ana = lista.find((c) => c.nome === 'Ana Lima')
    verificar(lista.length === 2, `convidados: ${lista.length}`)
    verificar(ana.telefone === '5511988887777' && ana.email === 'ana@exemplo.com', JSON.stringify(ana))
  })
  await testar('resumo soma presentes e cotas e monta os agradecimentos', async () => {
    const resumo = await posEvento.obterResumoPosEvento(festa.id)
    verificar(resumo.eventoRealizado && resumo.totalArrecadado === 400, `total: ${resumo.totalArrecadado}`)
    verificar(resumo.presentesComprados === 1 && resumo.cotasVendidas === 2 && resumo.presenteadores === 2, JSON.stringify(resumo))
    verificar(resumo.presentes[0].nomeConvidado === 'Bruno Reis', JSON.stringify(resumo.presentes))
    verificar(resumo.presentesComCotas[0].compras[0].valor === 200, JSON.stringify(resumo.presentesComCotas))
    const ana = resumo.agradecimentos.find((a) => a.nome === 'Ana Lima')
    verificar(ana.linkWhatsApp?.startsWith('https://wa.me/5511988887777?text='), ana.linkWhatsApp)
    verificar(ana.mensagem.startsWith('Olá, Ana!') && ana.mensagem.includes('Viagem') && ana.mensagem.includes('/recapitulacao'), ana.mensagem)
    const bruno = resumo.agradecimentos.find((a) => a.nome === 'Bruno Reis')
    verificar(bruno && bruno.linkWhatsApp === null && bruno.email === 'bruno@exemplo.com', JSON.stringify(bruno))
  })
  await testar('a mensagem do organizador entra no agradecimento', async () => {
    await eventos.atualizarEvento(festa.id, { mensagemAgradecimento: 'Valeu demais pela festa!' })
    const resumo = await posEvento.obterResumoPosEvento(festa.id)
    verificar(resumo.agradecimentos.every((a) => a.mensagem.includes('Valeu demais pela festa!')), 'mensagem não aplicada')
  })
  await testar('WhatsApp aberto fica registrado; sem telefone → 404', async () => {
    const resumo = await posEvento.obterResumoPosEvento(festa.id)
    const ana = resumo.agradecimentos.find((a) => a.nome === 'Ana Lima')
    const bruno = resumo.agradecimentos.find((a) => a.nome === 'Bruno Reis')
    await posEvento.registrarWhatsApp(festa.id, ana.convidadoId)
    await esperarErro(posEvento.registrarWhatsApp(festa.id, bruno.convidadoId), 404)
    const depois = await posEvento.obterResumoPosEvento(festa.id)
    verificar(depois.agradecimentos.find((a) => a.nome === 'Ana Lima').whatsAppAbertoEm, 'não registrou')
  })
  await testar('e-mail de agradecimento vai uma vez para cada um (ou 503 sem e-mail configurado)', async () => {
    const resumo = await posEvento.obterResumoPosEvento(festa.id)
    if (!resumo.emailDisponivel) {
      await esperarErro(posEvento.enviarAgradecimentosEmail(festa.id), 503)
      await esperarErro(posEvento.enviarResumoPorEmail(festa.id), 503)
      return
    }
    const envio = await posEvento.enviarAgradecimentosEmail(festa.id)
    verificar(envio.enviados === 2 && envio.falhas === 0, JSON.stringify({ enviados: envio.enviados, falhas: envio.falhas }))
    verificar(envio.resumo.agradecimentos.every((a) => a.emailEnviadoEm), 'não marcou como enviado')
    const denovo = await posEvento.enviarAgradecimentosEmail(festa.id)
    verificar(denovo.enviados === 0, `reenviou ${denovo.enviados}`)
    const { email } = await posEvento.enviarResumoPorEmail(festa.id)
    verificar(email === emailA, email)
  })
  await testar('recapitulação pública: números gerais depois do evento; antes da data → 404', async () => {
    const recap = await publico.obterRecapitulacao(festa.slugPublico)
    verificar(recap.pessoasPresentes === 2 && recap.presentesRecebidos === 2 && recap.presenteadores === 2, JSON.stringify(recap))
    verificar(recap.mensagemAgradecimento === 'Valeu demais pela festa!', recap.mensagemAgradecimento)
    verificar(!JSON.stringify(recap).includes('Bruno') && !JSON.stringify(recap).includes('@'), 'a recapitulação expôs dados de convidado')
    await esperarErro(publico.obterRecapitulacao(evento.slugPublico), 404)
    const previa = await posEvento.obterRecapitulacaoPrevia(evento.id)
    verificar(previa.evento.slugPublico === evento.slugPublico, 'a pré-visualização deveria abrir antes da data')
  })
  await testar('quem não gerencia não vê o pós-evento (404 de fora, 403 para membro)', async () => {
    usarSessao(tokenB)
    await esperarErro(posEvento.obterResumoPosEvento(festa.id), 404)
    usarSessao(tokenC)
    await esperarErro(posEvento.obterResumoPosEvento(formaturaEvento.id), 403)
    usarSessao(tokenA)
  })
  await testar('formando chamado "Recapitulação" não ocupa o endereço da recapitulação', async () => {
    const formando = await formatura.criarFormando(formaturaEvento.id, { nome: 'Recapitulação' })
    verificar(formando.slug !== 'recapitulacao', formando.slug)
    await formatura.excluirFormando(formaturaEvento.id, formando.id)
  })

  console.log('\nAssistente de IA')
  // Nada aqui chama a IA de verdade (cada chamada custa dinheiro): só o status, as validações,
  // as permissões e o 503 quando a chave não está configurada
  let statusIa = null
  await testar('status do assistente mostra o limite de gerações', async () => {
    statusIa = await assistente.obterStatusAssistente(evento.id)
    verificar(statusIa.limiteGeracoes === 3 && statusIa.geracoesRestantes === 3, JSON.stringify(statusIa))
  })
  await testar('pedido de presentes inválido → 400 nos campos certos', async () => {
    const erro = await esperarErro(
      assistente.sugerirPresentes(evento.id, { valorMinimo: 500, valorMaximo: 100, quantidade: 50 }),
      400,
    )
    verificar(erro.doCampo('valorMaximo') && erro.doCampo('quantidade'), JSON.stringify(erro.errosCampos))
  })
  await testar('pedido de roteiro com horário e duração inválidos → 400', async () => {
    const erro = await esperarErro(
      assistente.sugerirRoteiro(evento.id, { horarioInicio: '25:99', duracaoHoras: 30, publico: 'Adultos' }),
      400,
    )
    verificar(erro.doCampo('horarioInicio') && erro.doCampo('duracaoHoras'), JSON.stringify(erro.errosCampos))
  })
  await testar('sem a chave da IA no servidor → 503 (e a geração não é contada)', async () => {
    if (statusIa?.disponivel) return // com a chave configurada, o teste não gasta uma chamada de verdade
    await esperarErro(assistente.sugerirPresentes(evento.id, { quantidade: 5 }), 503)
    await esperarErro(
      assistente.sugerirRoteiro(evento.id, { horarioInicio: '19:00', duracaoHoras: 4, publico: 'Familia' }),
      503,
    )
    const depois = await assistente.obterStatusAssistente(evento.id)
    verificar(depois.geracoesRestantes === 3, `restantes: ${depois.geracoesRestantes}`)
  })
  await testar('lista pessoal só para formandos (409 fora da formatura)', async () => {
    await esperarErro(assistente.obterStatusAssistente(evento.id, true), 409)
  })
  await testar('quem não gerencia não usa o assistente (404 de fora, 403 para membro)', async () => {
    usarSessao(tokenB)
    await esperarErro(assistente.obterStatusAssistente(evento.id), 404)
    usarSessao(tokenC)
    await esperarErro(
      assistente.sugerirRoteiro(formaturaEvento.id, { horarioInicio: '19:00', duracaoHoras: 4, publico: 'Jovens' }),
      403,
    )
    // O membro tem a própria lista pessoal, com as gerações dele
    const minhaLista = await assistente.obterStatusAssistente(formaturaEvento.id, true)
    verificar(minhaLista.geracoesRestantes === 3, JSON.stringify(minhaLista))
    usarSessao(tokenA)
  })

  console.log('\nPix avisado pelos convidados')
  usarSessao(tokenA)
  let festaPix = null
  let viagemId = null
  await testar('evento sem Pix configurado recusa o aviso (404)', async () => {
    festaPix = await eventos.criarEvento({
      tipo: 'Aniversario',
      dataEvento: new Date(Date.now() - 86_400_000).toISOString(),
      nomeEvento: `Festa com Pix ${sufixo}`,
    })
    await esperarErro(publico.informarPix(festaPix.slugPublico, { nome: 'Ana', valor: 50 }), 404)
    const relatorio = await relatorioPix.obterRelatorioPix(festaPix.id)
    verificar(relatorio.pixConfigurado === false && relatorio.itens.length === 0, JSON.stringify(relatorio))
  })
  await testar('Pix livre sem valor ou sem nome → 400 nos campos certos', async () => {
    await eventos.atualizarEvento(festaPix.id, { chavePix: 'pix@datae.dev', nomeRecebedorPix: 'Teste', cidadePix: 'Sao Paulo' })
    const erro = await esperarErro(publico.informarPix(festaPix.slugPublico, { nome: ' ', valor: 0 }), 400)
    verificar(erro.doCampo('nome') && erro.doCampo('valor'), JSON.stringify(erro.errosCampos))
  })
  await testar('Pix livre e Pix das cotas chegam ao relatório aguardando conferência', async () => {
    await publico.informarPix(festaPix.slugPublico, {
      nome: 'Ana Lima', valor: 120.5, recado: 'Felicidades!', telefone: '(11) 98888-7777',
    })
    const viagem = await presentes.criarPresente(festaPix.id, { nome: 'Viagem', valorEstimado: 300, quantidadeCotas: 3 })
    viagemId = viagem.id
    const compra = await publico.comprarCotas(festaPix.slugPublico, viagem.id, 'Bruno Reis', 2)
    // Nome diferente do usado na compra não confirma a compra de outra pessoa
    await esperarErro(publico.informarPix(festaPix.slugPublico, { nome: 'Outra Pessoa', cotaId: compra.cotaId }), 404)
    await publico.informarPix(festaPix.slugPublico, { nome: 'bruno reis', cotaId: compra.cotaId })
    await esperarErro(publico.informarPix(festaPix.slugPublico, { nome: 'Bruno Reis', cotaId: compra.cotaId }), 409)
    const relatorio = await relatorioPix.obterRelatorioPix(festaPix.id)
    verificar(relatorio.itens.length === 2 && relatorio.totalInformado === 320.5, JSON.stringify(relatorio))
    verificar(relatorio.aguardandoConferencia === 2 && relatorio.totalConferido === 0, JSON.stringify(relatorio))
    const cotas = relatorio.itens.find((p) => p.origem === 'Cotas')
    verificar(cotas.valor === 200 && cotas.detalhe === '2 cotas de Viagem', JSON.stringify(cotas))
    const livre = relatorio.itens.find((p) => p.origem === 'Livre')
    verificar(livre.recado === 'Felicidades!' && livre.nomeConvidado === 'Ana Lima', JSON.stringify(livre))
  })
  await testar('conferir e excluir atualizam os totais', async () => {
    const antes = await relatorioPix.obterRelatorioPix(festaPix.id)
    const livre = antes.itens.find((p) => p.origem === 'Livre')
    const conferido = await relatorioPix.marcarPixConferido(festaPix.id, livre.id, true)
    verificar(conferido.totalConferido === 120.5 && conferido.aguardandoConferencia === 1, JSON.stringify(conferido))
    const cotas = antes.itens.find((p) => p.origem === 'Cotas')
    const depois = await relatorioPix.excluirPixInformado(festaPix.id, cotas.id)
    verificar(depois.itens.length === 1 && depois.totalInformado === 120.5, JSON.stringify(depois))
    // A compra das cotas continua: excluir o aviso não desfaz as cotas
    verificar((await presentes.listarCotas(festaPix.id, viagemId)).length === 1, 'a compra das cotas foi apagada junto')
  })
  await testar('Pix livre entra no total do pós-evento e nos agradecimentos', async () => {
    const resumo = await posEvento.obterResumoPosEvento(festaPix.id)
    verificar(resumo.valorPix === 120.5 && resumo.pix.length === 1 && resumo.pix[0].conferido, JSON.stringify(resumo.pix))
    verificar(resumo.totalArrecadado === 320.5, `total: ${resumo.totalArrecadado}`)
    const ana = resumo.agradecimentos.find((a) => a.nome === 'Ana Lima')
    verificar(ana && ana.motivos.some((m) => m.startsWith('Pix de R$')) && ana.telefone === '5511988887777', JSON.stringify(ana))
  })
  await testar('relatório de Pix: 404 de fora e 403 para membro da formatura', async () => {
    usarSessao(tokenB)
    await esperarErro(relatorioPix.obterRelatorioPix(festaPix.id), 404)
    usarSessao(tokenC)
    await esperarErro(relatorioPix.obterRelatorioPix(formaturaEvento.id), 403)
    usarSessao(tokenA)
  })

  console.log('\nOrganização (co-organizadores)')
  usarSessao(tokenA)
  // As rotas de convite têm limite de 30 requisições por minuto por IP, e os testes anteriores já usaram boa
  // parte dele: se vier 429, espera a janela do limite passar e tenta de novo (uma vez)
  async function semLimite(chamada) {
    try {
      return await chamada()
    } catch (e) {
      if (e?.status !== 429) throw e
      console.log('    (limite de requisições por IP atingido; esperando 1 minuto)')
      await new Promise((resolver) => setTimeout(resolver, 61_000))
      return chamada()
    }
  }
  let codigoOrganizacao = null
  await testar('dono liga o código; convite aparece como Organizacao', async () => {
    const inicial = await organizacao.obterOrganizacao(evento.id)
    verificar(inicial.podeGerenciar && inicial.codigoConvite === null && inicial.coOrganizadores.length === 0, JSON.stringify(inicial))
    const ligada = await organizacao.gerarCodigoOrganizacao(evento.id)
    codigoOrganizacao = ligada.codigoConvite
    verificar(codigoOrganizacao && ligada.limiteCoOrganizadores === 5, JSON.stringify(ligada))
    verificar((await semLimite(() => convites.obterConvite(codigoOrganizacao))).tipo === 'Organizacao', 'tipo do convite')
    // O próprio dono não entra de novo
    await esperarErro(semLimite(() => convites.aceitarConvite(codigoOrganizacao)), 409)
  })
  await testar('quem aceita vira co-organizador e gerencia o evento', async () => {
    usarSessao(tokenB)
    const aceito = await semLimite(() => convites.aceitarConvite(codigoOrganizacao))
    verificar(aceito.coOrganizador && !aceito.organizador && aceito.permissoes.includes('GerenciarEvento'), JSON.stringify(aceito))
    await esperarErro(semLimite(() => convites.aceitarConvite(codigoOrganizacao)), 409)
    const lista = await eventos.listarEventos()
    verificar(lista.some((e) => e.id === evento.id && e.coOrganizador), 'o evento não apareceu em Meus Eventos')
    const novo = await convidados.criarConvidado(evento.id, { nome: 'Convidado do co-organizador' })
    await convidados.excluirConvidado(evento.id, novo.id)
    const vista = await organizacao.obterOrganizacao(evento.id)
    verificar(!vista.podeGerenciar && vista.codigoConvite === null && vista.coOrganizadores.length === 1, JSON.stringify(vista))
  })
  await testar('co-organizador não exclui o evento nem mexe na organização (403)', async () => {
    usarSessao(tokenB)
    await esperarErro(eventos.excluirEvento(evento.id), 403)
    await esperarErro(organizacao.gerarCodigoOrganizacao(evento.id), 403)
    const vista = await organizacao.obterOrganizacao(evento.id)
    await esperarErro(organizacao.removerCoOrganizador(evento.id, vista.coOrganizadores[0].id), 403)
    usarSessao(tokenA)
  })
  await testar('evento com co-organizadores não vira formatura; formatura não tem organização (409)', async () => {
    const erro = await esperarErro(eventos.atualizarEvento(evento.id, { tipo: 'Formatura' }), 400)
    verificar(erro.doCampo('tipo'), JSON.stringify(erro.errosCampos))
    await esperarErro(organizacao.obterOrganizacao(formaturaEvento.id), 409)
  })
  await testar('dono remove; co-organizador pode sair; código desligado deixa de valer', async () => {
    const vista = await organizacao.obterOrganizacao(evento.id)
    const depois = await organizacao.removerCoOrganizador(evento.id, vista.coOrganizadores[0].id)
    verificar(depois.coOrganizadores.length === 0, JSON.stringify(depois))
    usarSessao(tokenB)
    await esperarErro(eventos.obterEvento(evento.id), 404)
    await semLimite(() => convites.aceitarConvite(codigoOrganizacao))
    await organizacao.sairDaOrganizacao(evento.id)
    await esperarErro(eventos.obterEvento(evento.id), 404)
    usarSessao(tokenA)
    await esperarErro(organizacao.sairDaOrganizacao(evento.id), 409)
    await organizacao.desativarCodigoOrganizacao(evento.id)
    await esperarErro(semLimite(() => convites.obterConvite(codigoOrganizacao)), 404)
  })

  console.log('\nMinha conta')
  usarSessao(tokenA)
  await testar('trocar e-mail ou senha sem a senha atual (ou com a errada) → 400 no campo senhaAtual', async () => {
    const conta = await usuarios.obterMinhaConta()
    verificar(conta.temSenha === true && conta.email === emailA, JSON.stringify(conta))
    const semSenha = await esperarErro(usuarios.atualizarMinhaConta({ email: `outro.${emailA}` }), 400)
    verificar(semSenha.doCampo('senhaAtual'), JSON.stringify(semSenha.errosCampos))
    const errada = await esperarErro(usuarios.atualizarMinhaConta({ novaSenha: 'nova-senha-1', senhaAtual: 'errada' }), 400)
    verificar(errada.doCampo('senhaAtual'), JSON.stringify(errada.errosCampos))
  })
  await testar('nome muda sem senha; e-mail e senha mudam com a senha atual (e o login usa os novos)', async () => {
    const renomeado = await usuarios.atualizarMinhaConta({ nome: 'Teste Falhas A2' })
    verificar(renomeado.nome === 'Teste Falhas A2', renomeado.nome)
    const novoEmail = `novo.${emailA}`
    const trocado = await usuarios.atualizarMinhaConta({ email: novoEmail, novaSenha: 'nova-senha-1', senhaAtual: senha })
    verificar(trocado.email === novoEmail, trocado.email)
    await esperarErro(autenticacao.entrar(emailA, senha), 401)
    await autenticacao.entrar(novoEmail, 'nova-senha-1')
    tokenA = sessao.obterToken()
    // Volta como estava, para os testes seguintes
    await usuarios.atualizarMinhaConta({ email: emailA, novaSenha: senha, senhaAtual: 'nova-senha-1' })
  })
  await testar('e-mail de outra conta → 409', async () => {
    await esperarErro(usuarios.atualizarMinhaConta({ email: emailB, senhaAtual: senha }), 409)
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
  for (const token of [tokenA, tokenB, tokenC]) {
    if (!token) continue
    usarSessao(token)
    await cliente.requisicao('/api/usuarios/eu', 'DELETE').catch(() => {})
  }
  await vite.close()
}

console.log(`\n${aprovados} aprovados, ${falhas.length} com falha`)
if (falhas.length > 0) process.exitCode = 1
