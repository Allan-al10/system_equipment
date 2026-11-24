using TecPrint.Web.Services;
using Microsoft.AspNetCore.Mvc;

namespace TecPrint.Web.Controllers;

public class OrdensController : Controller
{
    private readonly ApiService _api;

    public OrdensController(ApiService api) => _api = api;

    public async Task<IActionResult> Index(string? status, int? clienteId)
    {
        if (!User.Identity!.IsAuthenticated) return RedirectToAction("Login", "Account");

        var ordens = await _api.ListarOrdensAsync(status, clienteId);
        ViewBag.StatusSelecionado = status;
        ViewBag.ClienteIdSelecionado = clienteId;
        return View(ordens ?? new List<dynamic>());
    }

    public async Task<IActionResult> Detalhes(int id)
    {
        if (!User.Identity!.IsAuthenticated) return RedirectToAction("Login", "Account");

        var ordem = await _api.ObterOrdemAsync(id);
        if (ordem == null) return NotFound();

        var defeitos = await _api.ListarDefeitosAsync(id);
        var registros = await _api.ListarRegistrosAsync(id);
        ViewBag.Defeitos = defeitos ?? new List<dynamic>();
        ViewBag.Registros = registros ?? new List<dynamic>();

        return View(ordem);
    }

    public async Task<IActionResult> Novo()
    {
        if (!User.Identity!.IsAuthenticated) return RedirectToAction("Login", "Account");

        var clientes = await _api.ListarClientesAsync();
        ViewBag.Clientes = clientes ?? new List<dynamic>();
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> Novo(int clienteId, int? equipamentoId, string descricaoProblema)
    {
        if (!User.Identity!.IsAuthenticated) return RedirectToAction("Login", "Account");

        var sucesso = await _api.CriarOrdemAsync(clienteId, equipamentoId, descricaoProblema);
        if (sucesso != true)
        {
            ModelState.AddModelError(string.Empty, "Erro ao criar ordem de serviço.");
            var clientes = await _api.ListarClientesAsync();
            ViewBag.Clientes = clientes ?? new List<dynamic>();
            return View();
        }

        TempData["Sucesso"] = "Ordem de serviço criada com sucesso.";
        return RedirectToAction("Index");
    }

    public async Task<IActionResult> AlterarStatus(int id, string novoStatus)
    {
        if (!User.Identity!.IsAuthenticated) return RedirectToAction("Login", "Account");

        var sucesso = await _api.AtualizarStatusAsync(id, novoStatus);
        if (sucesso != true)
        {
            TempData["Erro"] = "Erro ao atualizar status.";
        }
        return RedirectToAction("Detalhes", new { id });
    }

    [HttpPost]
    public async Task<IActionResult> AdicionarRegistro(int ordemServicoId, string texto)
    {
        if (!User.Identity!.IsAuthenticated) return RedirectToAction("Login", "Account");

        await _api.CriarRegistroAsync(ordemServicoId, texto);
        return RedirectToAction("Detalhes", new { id = ordemServicoId });
    }

    [HttpPost]
    public async Task<IActionResult> AdicionarDefeito(int ordemServicoId, string descricao)
    {
        if (!User.Identity!.IsAuthenticated) return RedirectToAction("Login", "Account");

        await _api.CriarDefeitoAsync(ordemServicoId, descricao);
        return RedirectToAction("Detalhes", new { id = ordemServicoId });
    }
}
