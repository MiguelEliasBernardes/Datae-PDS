using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Backend.Dados;
using Backend.Modelos;
using Backend.Rotas;
using Backend.Servicos;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Banco de dados (PostgreSQL)
builder.Services.AddDbContext<ContextoBanco>(opcoes =>
    opcoes.UseNpgsql(builder.Configuration.GetConnectionString("Padrao")));

// Autenticação com JWT
var secaoJwt = builder.Configuration.GetSection("Jwt");
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opcoes =>
    {
        opcoes.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = secaoJwt["Emissor"],
            ValidAudience = secaoJwt["Publico"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secaoJwt["Chave"]!)),
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddScoped<IPasswordHasher<Usuario>, PasswordHasher<Usuario>>();
builder.Services.AddScoped<ServicoToken>();
builder.Services.AddScoped<ServicoGoogle>();
builder.Services.AddScoped<ServicoUsuario>();
builder.Services.AddScoped<ServicoEvento>();
builder.Services.AddScoped<ServicoConvidado>();
builder.Services.AddScoped<ServicoPresente>();
builder.Services.AddScoped<ServicoPaginaPublica>();
builder.Services.AddScoped<ServicoMural>();
builder.Services.AddSingleton<ArmazenamentoArquivos>();

// Limite de requisições por IP nas rotas públicas que gravam dados (RSVP, reserva, Pix, fotos),
// para ninguém conseguir encher o banco ou o disco de um evento com um script
builder.Services.AddRateLimiter(opcoes =>
{
    opcoes.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    opcoes.AddPolicy(RotasPublicas.PoliticaLimite, contexto => RateLimitPartition.GetFixedWindowLimiter(
        contexto.Connection.RemoteIpAddress?.ToString() ?? "desconhecido",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 30, Window = TimeSpan.FromMinutes(1) }));
});

// Enums trafegam como texto no JSON ("Confirmado" em vez de 1)
builder.Services.ConfigureHttpJsonOptions(opcoes =>
    opcoes.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// Libera o frontend (Vite) para chamar a API
builder.Services.AddCors(opcoes =>
    opcoes.AddDefaultPolicy(politica => politica
        .WithOrigins(builder.Configuration.GetSection("OrigensPermitidas").Get<string[]>() ?? [])
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

// Aplica as migrations pendentes ao iniciar (cria o banco se ainda não existir)
using (var escopo = app.Services.CreateScope())
{
    escopo.ServiceProvider.GetRequiredService<ContextoBanco>().Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    // Em desenvolvimento o frontend chama a API por http (proxy do Vite);
    // o redirecionamento para https quebraria essas chamadas
    app.UseHttpsRedirection();
}
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapearRotasUsuario();
app.MapearRotasEvento();
app.MapearRotasConvidado();
app.MapearRotasPresente();
app.MapearRotasMural();
app.MapearRotasPublicas();

app.Run();
