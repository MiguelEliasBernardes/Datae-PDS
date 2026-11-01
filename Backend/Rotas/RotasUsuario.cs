using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend.Dtos;
using Backend.Modelos;
using Backend.Servicos;

namespace Backend.Rotas;

/// <summary>
/// Rotas de usuário: só recebem a requisição, chamam o ServicoUsuario e traduzem o resultado para HTTP.
/// </summary>
public static class RotasUsuario
{
    public static void MapearRotasUsuario(this WebApplication app)
    {
        var autenticacao = app.MapGroup("/api/autenticacao").WithTags("Autenticação");
        autenticacao.MapPost("/cadastro", Cadastrar);
        autenticacao.MapPost("/login", Entrar);

        var usuario = app.MapGroup("/api/usuarios/eu").WithTags("Usuário").RequireAuthorization();
        usuario.MapGet("/", ObterUsuarioLogado);
        usuario.MapPut("/", AtualizarUsuarioLogado);
        usuario.MapDelete("/", ExcluirUsuarioLogado);
    }

    private static async Task<IResult> Cadastrar(
        CadastroRequisicao requisicao, ServicoUsuario servicoUsuario, ServicoToken servicoToken)
    {
        var resultado = await servicoUsuario.CadastrarAsync(requisicao);
        return ParaHttp(resultado, usuario =>
            Results.Created("/api/usuarios/eu", CriarLoginResposta(usuario, servicoToken)));
    }

    private static async Task<IResult> Entrar(
        LoginRequisicao requisicao, ServicoUsuario servicoUsuario, ServicoToken servicoToken)
    {
        var resultado = await servicoUsuario.AutenticarAsync(requisicao);
        return ParaHttp(resultado, usuario => Results.Ok(CriarLoginResposta(usuario, servicoToken)));
    }

    private static async Task<IResult> ObterUsuarioLogado(ClaimsPrincipal principal, ServicoUsuario servicoUsuario)
    {
        if (ObterIdUsuarioLogado(principal) is not int id)
            return Results.Unauthorized();

        var resultado = await servicoUsuario.ObterPorIdAsync(id);
        return ParaHttp(resultado, usuario => Results.Ok(ParaResposta(usuario)));
    }

    private static async Task<IResult> AtualizarUsuarioLogado(
        AtualizarUsuarioRequisicao requisicao, ClaimsPrincipal principal, ServicoUsuario servicoUsuario)
    {
        if (ObterIdUsuarioLogado(principal) is not int id)
            return Results.Unauthorized();

        var resultado = await servicoUsuario.AtualizarAsync(id, requisicao);
        return ParaHttp(resultado, usuario => Results.Ok(ParaResposta(usuario)));
    }

    private static async Task<IResult> ExcluirUsuarioLogado(ClaimsPrincipal principal, ServicoUsuario servicoUsuario)
    {
        if (ObterIdUsuarioLogado(principal) is not int id)
            return Results.Unauthorized();

        var resultado = await servicoUsuario.ExcluirAsync(id);
        return ParaHttp(resultado, _ => Results.NoContent());
    }

    /// <summary>Converte o Resultado do serviço no status HTTP correspondente.</summary>
    private static IResult ParaHttp<T>(Resultado<T> resultado, Func<T, IResult> aoSucesso) => resultado.Erro switch
    {
        TipoErro.Nenhum => aoSucesso(resultado.Valor!),
        TipoErro.Validacao => Results.ValidationProblem(resultado.ErrosValidacao),
        TipoErro.Conflito => Results.Conflict(new { mensagem = resultado.Mensagem }),
        TipoErro.NaoEncontrado => Results.NotFound(new { mensagem = resultado.Mensagem }),
        TipoErro.NaoAutorizado => Results.Json(new { mensagem = resultado.Mensagem }, statusCode: StatusCodes.Status401Unauthorized),
        _ => Results.Problem(),
    };

    private static int? ObterIdUsuarioLogado(ClaimsPrincipal principal)
    {
        var idTexto = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return int.TryParse(idTexto, out var id) ? id : null;
    }

    private static UsuarioResposta ParaResposta(Usuario usuario) =>
        new(usuario.Id, usuario.Nome, usuario.Email, usuario.CriadoEm);

    private static LoginResposta CriarLoginResposta(Usuario usuario, ServicoToken servicoToken)
    {
        var (token, expiraEm) = servicoToken.GerarToken(usuario);
        return new LoginResposta(token, expiraEm, ParaResposta(usuario));
    }
}
