using Backend.Modelos;
using static Backend.Modelos.CategoriaChecklist;

namespace Backend.Servicos;

/// <summary>
/// Sugestão da checklist. A <paramref name="Chave"/> identifica a sugestão para saber quais já estão
/// no evento; <paramref name="DiasAntes"/> é o prazo relativo à data do evento (0 = no dia).
/// Nos itens da categoria Itens, <paramref name="ValorSugerido"/> vira o valor estimado do presente.
/// </summary>
public record SugestaoChecklist(
    string Chave,
    string Titulo,
    string? Descricao,
    CategoriaChecklist Categoria,
    int? DiasAntes,
    decimal? ValorSugerido = null);

/// <summary>
/// Sugestões da checklist por tipo de evento (itens, decoração, brincadeiras e preparativos).
/// Ficam no código, e não no banco, para serem revisadas e versionadas junto com o projeto:
/// para mudar uma sugestão basta editar esta lista. Mudanças valem para os eventos que ainda não
/// abriram a checklist; os outros veem as novas em "Sugestões" (pela chave).
/// </summary>
public static class ModelosChecklist
{
    public static IReadOnlyList<SugestaoChecklist> DoTipo(TipoEvento tipo) => tipo switch
    {
        TipoEvento.ChaDePanela => ChaDePanela,
        TipoEvento.Casamento => Casamento,
        TipoEvento.Aniversario => Aniversario,
        TipoEvento.Formatura => Formatura,
        _ => [],
    };

    private static readonly SugestaoChecklist[] ChaDePanela =
    [
        new("cha-data-local", "Definir data e local", "Casa, salão de festas do prédio ou espaço alugado.", Preparativos, 60),
        new("cha-convidados", "Montar a lista de convidados", "Cadastre os convidados para acompanhar as confirmações.", Preparativos, 45),
        new("cha-convites", "Enviar os convites", "Mande o link da página do evento: lá os convidados confirmam presença e escolhem o presente.", Preparativos, 30),
        new("cha-cardapio", "Definir o cardápio", "Salgados, doces, bebidas e quantidade por pessoa.", Preparativos, 20),
        new("cha-bolo", "Encomendar o bolo", null, Preparativos, 10),
        new("cha-descartaveis", "Comprar descartáveis", "Pratos, copos, guardanapos e talheres.", Preparativos, 5),
        new("cha-confirmacoes", "Cobrar quem não confirmou presença", "Veja os convidados pendentes na lista.", Preparativos, 7),

        new("cha-tema", "Escolher o tema e as cores", "Use a cor do tema também na página do evento (Configurações).", Decoracao, 40),
        new("cha-lembrancinhas", "Providenciar as lembrancinhas", "Ex.: potinhos de tempero ou pano de prato bordado.", Decoracao, 15),
        new("cha-mesa-doces", "Montar a mesa de doces", null, Decoracao, 1),
        new("cha-baloes", "Balões e painel para fotos", null, Decoracao, 2),

        new("cha-adivinhar", "Adivinhar o presente", "Os noivos tentam adivinhar o presente pelo pacote; quem errar paga uma prenda.", Brincadeiras, 10),
        new("cha-prendas", "Separar as prendas", "Lista de \"micos\" divertidos para quem errar nas brincadeiras.", Brincadeiras, 5),
        new("cha-quiz", "Quiz sobre o casal", "Perguntas sobre como se conheceram, primeiro encontro, manias...", Brincadeiras, 7),
        new("cha-bingo", "Bingo de cozinha", "Cartelas com utensílios no lugar dos números.", Brincadeiras, 5),

        new("cha-panelas", "Jogo de panelas", null, Itens, 45, 400m),
        new("cha-talheres", "Faqueiro / jogo de talheres", null, Itens, 45, 150m),
        new("cha-pratos", "Jogo de pratos", null, Itens, 45, 250m),
        new("cha-copos", "Jogo de copos", null, Itens, 45, 100m),
        new("cha-potes", "Conjunto de potes herméticos", null, Itens, 45, 120m),
        new("cha-assadeiras", "Assadeiras e formas", null, Itens, 45, 120m),
        new("cha-silicone", "Utensílios de silicone", "Espátulas, conchas e pegadores.", Itens, 45, 90m),
        new("cha-panos", "Panos de prato", null, Itens, 45, 60m),
        new("cha-liquidificador", "Liquidificador", null, Itens, 45, 200m),
        new("cha-airfryer", "Air fryer", "Item de valor alto: bom para dividir em cotas.", Itens, 45, 450m),
    ];

    private static readonly SugestaoChecklist[] Casamento =
    [
        new("cas-orcamento", "Definir o orçamento", "Quanto vai para cerimônia, festa, roupas e lua de mel.", Preparativos, 365),
        new("cas-cerimonial", "Contratar cerimonialista / assessoria", null, Preparativos, 300),
        new("cas-recepcao", "Reservar o local da recepção", null, Preparativos, 300),
        new("cas-buffet", "Contratar o buffet", null, Preparativos, 240),
        new("cas-foto", "Contratar fotografia e filmagem", null, Preparativos, 240),
        new("cas-padrinhos", "Convidar os padrinhos", null, Preparativos, 200),
        new("cas-musica", "Contratar banda ou DJ", null, Preparativos, 150),
        new("cas-lista", "Cadastrar a lista de presentes", "Itens de valor alto podem ser divididos em cotas.", Preparativos, 120),
        new("cas-convites", "Enviar os convites", "Mande também o link da página do evento para a confirmação de presença.", Preparativos, 90),
        new("cas-aliancas", "Comprar as alianças", null, Preparativos, 60),
        new("cas-confirmacoes", "Fechar o número de convidados com o buffet", "Cobre quem ainda não confirmou presença.", Preparativos, 20),

        new("cas-data-cerimonia", "Reservar data e local da cerimônia", "Igreja, templo ou cerimônia no próprio espaço.", Cerimonia, 330),
        new("cas-cartorio", "Dar entrada na habilitação do casamento civil", "Feita no cartório com antecedência; leve os documentos dos noivos.", Cerimonia, 90),
        new("cas-traje", "Escolher vestido e traje do noivo", null, Cerimonia, 180),
        new("cas-ensaio", "Ensaio da entrada", "Ordem dos padrinhos, daminhas e pajens.", Cerimonia, 2),

        new("cas-decoracao", "Fechar a decoração da cerimônia e da festa", null, Decoracao, 120),
        new("cas-flores", "Flores e buquê", null, Decoracao, 90),
        new("cas-mesa-bolo", "Bolo e mesa de doces", null, Decoracao, 30),
        new("cas-lembrancinhas", "Lembrancinhas", null, Decoracao, 30),

        new("cas-video", "Vídeo com a história do casal", "Exibido na festa, antes da entrada na pista.", Brincadeiras, 30),
        new("cas-playlist", "Playlist da pista", "Inclua as músicas que não podem faltar e as proibidas.", Brincadeiras, 20),
        new("cas-buque", "Jogar o buquê", null, Brincadeiras, 0),
        new("cas-gravata", "Leilão da gravata", "Tradição em que os convidados compram pedaços da gravata do noivo.", Brincadeiras, 0),

        new("cas-cama", "Jogo de cama", null, Itens, 120, 300m),
        new("cas-toalhas", "Jogo de toalhas", null, Itens, 120, 200m),
        new("cas-jantar", "Aparelho de jantar", null, Itens, 120, 500m),
        new("cas-cafeteira", "Cafeteira", null, Itens, 120, 300m),
        new("cas-aspirador", "Aspirador de pó", null, Itens, 120, 600m),
        new("cas-lua-de-mel", "Lua de mel", "Ótimo para dividir em cotas entre os convidados.", Itens, 120, 5000m),
    ];

    private static readonly SugestaoChecklist[] Aniversario =
    [
        new("ani-data-local", "Definir data e local", null, Preparativos, 45),
        new("ani-convidados", "Montar a lista de convidados", null, Preparativos, 30),
        new("ani-convites", "Enviar os convites", "Mande o link da página do evento para a confirmação de presença.", Preparativos, 20),
        new("ani-comida", "Encomendar salgados e doces", null, Preparativos, 15),
        new("ani-bolo", "Encomendar o bolo", null, Preparativos, 7),
        new("ani-bebidas", "Comprar as bebidas", null, Preparativos, 5),

        new("ani-tema", "Escolher o tema", null, Decoracao, 30),
        new("ani-lembrancinhas", "Lembrancinhas", null, Decoracao, 10),
        new("ani-baloes", "Balões e painel para fotos", null, Decoracao, 3),
        new("ani-mesa", "Montar a mesa do bolo", null, Decoracao, 1),

        new("ani-video", "Vídeo de mensagens dos amigos", "Junte recados em vídeo e exiba na hora do parabéns.", Brincadeiras, 10),
        new("ani-quiz", "Quiz sobre o aniversariante", null, Brincadeiras, 5),
        new("ani-playlist", "Playlist / karaokê", null, Brincadeiras, 3),

        new("ani-vale", "Vale-presente", "Deixa o aniversariante escolher.", Itens, 20, 100m),
        new("ani-experiencia", "Experiência (jantar, passeio, show)", "Bom para dividir em cotas.", Itens, 20, 300m),
    ];

    // Na formatura os presentes ficam na lista pessoal de cada formando, por isso não há categoria Itens
    private static readonly SugestaoChecklist[] Formatura =
    [
        new("for-comissao", "Montar a comissão", "Cadastre os formandos e envie os convites; defina quem cuida do financeiro e das fotos.", Preparativos, 365),
        new("for-empresa", "Contratar a empresa de formatura / cerimonial", null, Preparativos, 330),
        new("for-orcamento", "Lançar as despesas para calcular o rateio", "Cada formando vê quanto deve e quanto já pagou.", Preparativos, 300),
        new("for-baile-local", "Reservar o local do baile", null, Preparativos, 300),
        new("for-buffet", "Contratar o buffet do baile", null, Preparativos, 240),
        new("for-foto", "Contratar fotografia e filmagem", null, Preparativos, 240),
        new("for-musica", "Contratar banda ou DJ", null, Preparativos, 180),
        new("for-album", "Definir o álbum de formatura", null, Preparativos, 90),
        new("for-convites", "Distribuir os convites", "Mande também o link da página da formatura: cada formando tem a sua lista de presentes.", Preparativos, 60),

        new("for-colacao", "Confirmar a data da colação de grau", "Com a coordenação do curso / instituição.", Cerimonia, 180),
        new("for-homenageados", "Escolher patrono, paraninfo e homenageados", null, Cerimonia, 90),
        new("for-orador", "Escolher o orador da turma", null, Cerimonia, 45),
        new("for-culto", "Organizar culto ecumênico ou missa", null, Cerimonia, 60),
        new("for-beca", "Reservar becas e capelos", null, Cerimonia, 60),
        new("for-juramento", "Revisar o juramento", null, Cerimonia, 30),
        new("for-ensaio", "Ensaio da colação", null, Cerimonia, 2),

        new("for-decoracao", "Fechar a decoração do baile", null, Decoracao, 60),
        new("for-painel", "Painel de fotos com o nome da turma", null, Decoracao, 15),

        new("for-video", "Vídeo de memórias da turma", "Fotos e vídeos dos anos de curso, exibidos no baile.", Brincadeiras, 30),
        new("for-mural", "Divulgar o mural de fotos", "Peça aos convidados para enviarem as fotos da noite pela página.", Brincadeiras, 1),
        new("for-capelo", "Momento de jogar o capelo", null, Brincadeiras, 0),
    ];
}
