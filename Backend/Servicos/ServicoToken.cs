using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Backend.Modelos;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Servicos;

public class ServicoToken(IConfiguration configuracao)
{
    public (string Token, DateTime ExpiraEm) GerarToken(Usuario usuario)
    {
        var secaoJwt = configuracao.GetSection("Jwt");
        var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secaoJwt["Chave"]!));
        var expiraEm = DateTime.UtcNow.AddHours(secaoJwt.GetValue("HorasExpiracao", 8));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
            new Claim(JwtRegisteredClaimNames.Name, usuario.Nome),
        };

        var token = new JwtSecurityToken(
            issuer: secaoJwt["Emissor"],
            audience: secaoJwt["Publico"],
            claims: claims,
            expires: expiraEm,
            signingCredentials: new SigningCredentials(chave, SecurityAlgorithms.HmacSha256));

        return (new JwtSecurityTokenHandler().WriteToken(token), expiraEm);
    }
}
