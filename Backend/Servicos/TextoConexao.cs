using Npgsql;

namespace Backend.Servicos;

/// <summary>
/// A Render (e outros serviços de PostgreSQL) entrega o endereço do banco como URL
/// ("postgresql://usuario:senha@host:porta/banco"), formato que o Npgsql não aceita.
/// Aqui ele vira o formato do Npgsql ("Host=...;Database=..."); os outros textos passam sem mudança.
/// </summary>
public static class TextoConexao
{
    public static string? ParaNpgsql(string? texto)
    {
        if (string.IsNullOrWhiteSpace(texto)
            || !(texto.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
                || texto.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)))
            return texto;

        var url = new Uri(texto);
        var usuarioSenha = url.UserInfo.Split(':', 2);

        return new NpgsqlConnectionStringBuilder
        {
            Host = url.Host,
            Port = url.IsDefaultPort || url.Port <= 0 ? 5432 : url.Port,
            Database = Uri.UnescapeDataString(url.AbsolutePath.TrimStart('/')),
            Username = Uri.UnescapeDataString(usuarioSenha[0]),
            Password = usuarioSenha.Length > 1 ? Uri.UnescapeDataString(usuarioSenha[1]) : null,
            // Pela rede interna da Render a conexão é sem SSL; pela externa, com. "Prefer" serve para as duas
            SslMode = SslMode.Prefer,
        }.ConnectionString;
    }
}
