/**
 * O que fazer com a foto do presente ao salvar o formulário:
 * um arquivo novo para enviar, 'remover' para tirar a foto atual, ou null para não mexer.
 */
export type AlteracaoFoto = File | 'remover' | null
