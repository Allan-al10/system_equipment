namespace TecPrint.Web.Services;

public class TokenService
{
    private const string TokenKey = "JwtToken";
    private const string UserKey = "UsuarioLogado";

    private readonly IHttpContextAccessor _httpContextAccessor;

    public TokenService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? GetToken()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context == null) return null;
        return context.Request.Cookies[TokenKey];
    }

    public void SetToken(string token, DateTime? expiracao = null)
    {
        var context = _httpContextAccessor.HttpContext;
        if (context == null) return;

        var options = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = expiracao ?? DateTimeOffset.Now.AddHours(12)
        };
        context.Response.Cookies.Append(TokenKey, token, options);
    }

    public void RemoverToken()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context == null) return;
        context.Response.Cookies.Delete(TokenKey);
    }

    public string? GetUsuarioNome()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context == null) return null;
        return context.User.Identity?.IsAuthenticated == true ? context.User.Identity.Name : null;
    }

    public string? GetUsuarioPerfil()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context == null) return null;
        return context.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
    }
}
