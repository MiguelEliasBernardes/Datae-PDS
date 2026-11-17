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
