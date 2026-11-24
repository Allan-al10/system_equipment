using TecPrint.Api.Data;
using TecPrint.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;

namespace TecPrint.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Senha))
            return BadRequest(new { mensagem = "E-mail e senha são obrigatórios." });

        var usuario = _db.Usuarios.FirstOrDefault(u => u.Email == request.Email && u.Ativo);
        if (usuario == null || !BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash))
            return Unauthorized(new { mensagem = "E-mail ou senha inválidos." });

        var token = GerarToken(usuario);
        return Ok(new LoginResponse(token, usuario.Nome, usuario.Perfil.ToString()));
    }

    [HttpPost("cadastro")]
    public IActionResult Cadastro([FromBody] CadastroRequest request)
    {
        if (_db.Usuarios.Any(u => u.Email == request.Email))
            return Conflict(new { mensagem = "E-mail já cadastrado." });

        var usuario = new Usuario
        {
            Nome = request.Nome,
            Email = request.Email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.Senha),
            Perfil = request.Perfil,
            Ativo = true
        };
        _db.Usuarios.Add(usuario);
        _db.SaveChanges();

        return Ok(new UsuarioDto(usuario.Id, usuario.Nome, usuario.Email, usuario.Perfil.ToString()));
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var usuario = _db.Usuarios.FirstOrDefault(u => u.Id == int.Parse(userId));
        if (usuario == null) return NotFound();

        return Ok(new UsuarioDto(usuario.Id, usuario.Nome, usuario.Email, usuario.Perfil.ToString()));
    }

    private string GerarToken(Usuario usuario)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _config["Jwt:Key"] ?? "TecPrint-Chave-Secreta-Dev-Local-2026"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.Nome),
            new Claim(ClaimTypes.Email, usuario.Email),
            new Claim(ClaimTypes.Role, usuario.Perfil.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "TecPrint",
            audience: null,
            claims: claims,
            expires: DateTime.Now.AddHours(12),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public record CadastroRequest(string Nome, string Email, string Senha, PerfilUsuario Perfil);
