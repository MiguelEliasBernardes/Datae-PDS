namespace Backend.Servicos;

public enum TipoErro
{
    Nenhum,
    Validacao,
    Conflito,
    NaoEncontrado,
    NaoAutorizado,
}

/// <summary>
/// Retorno dos serviços: ou traz o valor, ou diz qual erro aconteceu.
/// Assim o serviço não precisa conhecer nada de HTTP.
/// </summary>
public class Resultado<T>
{
    public T? Valor { get; private init; }
    public TipoErro Erro { get; private init; }
    public string? Mensagem { get; private init; }
    public Dictionary<string, string[]> ErrosValidacao { get; private init; } = [];

    public bool Sucesso => Erro == TipoErro.Nenhum;

    public static Resultado<T> Ok(T valor) => new() { Valor = valor };

    public static Resultado<T> Falha(TipoErro erro, string mensagem) => new() { Erro = erro, Mensagem = mensagem };

    public static Resultado<T> Invalido(Dictionary<string, string[]> erros) =>
        new() { Erro = TipoErro.Validacao, ErrosValidacao = erros };
}
