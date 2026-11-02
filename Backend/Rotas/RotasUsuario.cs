using System.Security.Claims;
using Backend.Dtos;
using Backend.Modelos;
using Backend.Servicos;
using static Backend.Rotas.AuxiliaresRotas;

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
        autenticacao.MapPost("/google", EntrarComGoogle);

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

    private static async Task<IResult> EntrarComGoogle(
        LoginGoogleRequisicao requisicao, ServicoUsuario servicoUsuario, ServicoToken servicoToken)
    {
        var resultado = await servicoUsuario.AutenticarComGoogleAsync(requisicao);
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

    private static UsuarioResposta ParaResposta(Usuario usuario) =>
        new(usuario.Id, usuario.Nome, usuario.Email, usuario.CriadoEm);

    private static LoginResposta CriarLoginResposta(Usuario usuario, ServicoToken servicoToken)
    {
        var (token, expiraEm) = servicoToken.GerarToken(usuario);
        return new LoginResposta(token, expiraEm, ParaResposta(usuario));
    }
}
