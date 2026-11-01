using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend.Servicos;

namespace Backend.Rotas;

/// <summary>Funções usadas por todos os arquivos de rotas.</summary>
public static class AuxiliaresRotas
{
    /// <summary>Converte o Resultado do serviço no status HTTP correspondente.</summary>
    public static IResult ParaHttp<T>(Resultado<T> resultado, Func<T, IResult> aoSucesso) => resultado.Erro switch
    {
        TipoErro.Nenhum => aoSucesso(resultado.Valor!),
        TipoErro.Validacao => Results.ValidationProblem(resultado.ErrosValidacao),
        TipoErro.Conflito => Results.Conflict(new { mensagem = resultado.Mensagem }),
        TipoErro.NaoEncontrado => Results.NotFound(new { mensagem = resultado.Mensagem }),
        TipoErro.NaoAutorizado => Results.Json(new { mensagem = resultado.Mensagem }, statusCode: StatusCodes.Status401Unauthorized),
        _ => Results.Problem(),
    };

    /// <summary>Lê o id do usuário a partir do token JWT.</summary>
    public static int? ObterIdUsuarioLogado(ClaimsPrincipal principal)
    {
        var idTexto = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return int.TryParse(idTexto, out var id) ? id : null;
    }
}
