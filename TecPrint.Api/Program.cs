using TecPrint.Api.Data;
using TecPrint.Api.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BCrypt.Net;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ============================ CONFIGURAÇÃO ============================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "TecPrint API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Insira o token JWT: Bearer <seu-token>"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Banco de dados local SQL Server (LocalDB/Express)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=(localdb)\\MSSQLLocalDB;Database=TecPrint;Trusted_Connection=True;TrustServerCertificate=True;";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// ============================ AUTENTICAÇÃO JWT ============================
var jwtKey = builder.Configuration["Jwt:Key"] ?? "TecPrint-Chave-Secreta-Dev-Local-2026";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "TecPrint";
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ClockSkew = TimeSpan.FromMinutes(5)
        };
    });

builder.Services.AddAuthorization();

// CORS para permitir acesso pelo navegador do celular na mesma rede
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTudo", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// ============================ SEED DE DADOS INICIAIS ============================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    if (!db.Usuarios.Any())
    {
        var admin = new Usuario
        {
            Nome = "Administrador",
            Email = "admin@tecprint.com",
            SenhaHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            Perfil = PerfilUsuario.Admin,
            Ativo = true
        };
        db.Usuarios.Add(admin);
        db.SaveChanges();
    }
}

// ============================ MIDDLEWARE ============================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("PermitirTudo");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

// ============================ DTOs ============================
public record LoginRequest(string Email, string Senha);
public record LoginResponse(string Token, string Nome, string Perfil);
public record UsuarioDto(int Id, string Nome, string Email, string Perfil);

public record ClienteDto(int Id, string Nome, string Telefone, string Endereco, string? Documento);
public record CriarClienteDto(string Nome, string Telefone, string Endereco, string? Documento);
public record AtualizarClienteDto(string Nome, string Telefone, string Endereco, string? Documento);

public record EquipamentoDto(int Id, int ClienteId, string Marca, string Modelo, string? NumeroSerie, string? Descricao);
public record CriarEquipamentoDto(int ClienteId, string Marca, string Modelo, string? NumeroSerie, string? Descricao);

public record OrdemServicoDto(
    int Id, string NumeroOS, int ClienteId, string ClienteNome,
    int? EquipamentoId, string? EquipamentoDescricao,
    int UsuarioAberturaId, string UsuarioAberturaNome,
    int? UsuarioResponsavelId, string? UsuarioResponsavelNome,
    string DescricaoProblema, string Status, DateTime DataAbertura,
    DateTime? DataPrevisao, DateTime? DataConclusao,
    decimal? ValorOrcamento, decimal? ValorFinal, string? Observacoes);

public record CriarOrdemServicoDto(
    int ClienteId, int? EquipamentoId, string DescricaoProblema);

public record AtualizarStatusOsDto(string Status);

public record DefeitoDto(int Id, int OrdemServicoId, string Descricao, DateTime Data);
public record CriarDefeitoDto(int OrdemServicoId, string Descricao);

public record RegistroDto(int Id, int OrdemServicoId, int UsuarioId, string UsuarioNome, string Texto, DateTime Data);
public record CriarRegistroDto(int OrdemServicoId, string Texto);
