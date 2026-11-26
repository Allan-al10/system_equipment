using TecPrint.Web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;

namespace TecPrint.Web.Controllers;

public class AccountController : Controller
{
    private readonly ApiService _api;
    private readonly TokenService _token;

    public AccountController(ApiService api, TokenService token)
    {
        _api = api;
        _token = token;
    }

    [HttpGet]
    public IActionResult Login(string? returnUrl = null)
    {
        ViewData["ReturnUrl"] = returnUrl;
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> Login(string email, string senha, string? returnUrl = null)
    {
        var (sucesso, token, nome, perfil, erro) = await _api.LoginAsync(email, senha);
        if (!sucesso)
        {
            ModelState.AddModelError(string.Empty, erro ?? "Erro ao fazer login.");
            return View();
        }

        _token.SetToken(token!);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, nome ?? string.Empty),
            new Claim(ClaimTypes.Role, perfil ?? string.Empty)
        };
        var identidade = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identidade);

        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);

        return Redirect(returnUrl ?? "/Ordens");
    }

    public async Task<IActionResult> Logout()
    {
        _token.RemoverToken();
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return RedirectToAction("Login");
    }

    [HttpGet]
    public IActionResult Cadastro()
    {
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> Cadastro(string Nome, string Email, string Senha, string Perfil)
    {
        var (sucesso, _, _, _, erro) = await _api.CriarUsuarioAsync(Nome, Email, Senha, Perfil);
        if (!sucesso)
        {
            ModelState.AddModelError(string.Empty, erro ?? "Erro ao cadastrar usuário.");
            return View();
        }

        TempData["Sucesso"] = "Usuário cadastrado com sucesso. Faça login.";
        return RedirectToAction("Login");
    }
}
