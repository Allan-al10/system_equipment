using TecPrint.Api.Data;
using TecPrint.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace TecPrint.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdensController : ControllerBase
{
    private readonly AppDbContext _db;

    public OrdensController(AppDbContext db) => _db = db;

    // ============================ ORDENS DE SERVIÇO ============================

    [HttpGet]
    public IActionResult ListarOrdens([FromQuery] StatusOS? status, [FromQuery] int? clienteId)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var perfil = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        var query = _db.OrdensServico
            .Include(os => os.Cliente)
            .Include(os => os.Equipamento)
            .Include(os => os.UsuarioAbertura)
            .Include(os => os.UsuarioResponsavel)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(os => os.Status == status.Value);

        if (clienteId.HasValue)
            query = query.Where(os => os.ClienteId == clienteId.Value);

        // Funcionário vê apenas as que abriu ou é responsável; Admin vê todas
        if (perfil != nameof(PerfilUsuario.Admin) && int.TryParse(userId, out var uid))
            query = query.Where(os => os.UsuarioAberturaId == uid || os.UsuarioResponsavelId == uid);

        var ordens = query.OrderByDescending(os => os.DataAbertura)
            .Select(os => new OrdemServicoDto(
                os.Id, os.NumeroOS, os.ClienteId, os.Cliente.Nome,
                os.EquipamentoId, os.Equipamento != null ? $"{os.Equipamento.Marca} {os.Equipamento.Modelo}" : (string?)null,
                os.UsuarioAberturaId, os.UsuarioAbertura.Nome,
                os.UsuarioResponsavelId, os.UsuarioResponsavel == null ? (string?)null : os.UsuarioResponsavel.Nome,
                os.DescricaoProblema, os.Status.ToString(), os.DataAbertura,
                os.DataPrevisao, os.DataConclusao, os.ValorOrcamento, os.ValorFinal, os.Observacoes
            ))
            .ToList();

        return Ok(ordens);
    }

    [HttpGet("{id}")]
    public IActionResult ObterOrdem(int id)
    {
        var ordem = _db.OrdensServico
            .Include(os => os.Cliente)
            .Include(os => os.Equipamento)
            .Include(os => os.UsuarioAbertura)
            .Include(os => os.UsuarioResponsavel)
            .Include(os => os.Defeitos)
            .Include(os => os.Registros).ThenInclude(r => r.Usuario)
            .FirstOrDefault(os => os.Id == id);

        if (ordem == null) return NotFound();

        var dto = new OrdemServicoDto(
            ordem.Id, ordem.NumeroOS, ordem.ClienteId, ordem.Cliente.Nome,
            ordem.EquipamentoId, ordem.Equipamento != null ? $"{ordem.Equipamento.Marca} {ordem.Equipamento.Modelo}" : null,
            ordem.UsuarioAberturaId, ordem.UsuarioAbertura.Nome,
            ordem.UsuarioResponsavelId, ordem.UsuarioResponsavel?.Nome,
            ordem.DescricaoProblema, ordem.Status.ToString(), ordem.DataAbertura,
            ordem.DataPrevisao, ordem.DataConclusao, ordem.ValorOrcamento, ordem.ValorFinal, ordem.Observacoes);

        var defeitos = ordem.Defeitos.Select(d => new DefeitoDto(d.Id, d.OrdemServicoId, d.Descricao, d.Data)).ToList();
        var registros = ordem.Registros.Select(r => new RegistroDto(r.Id, r.OrdemServicoId, r.UsuarioId, r.Usuario.Nome, r.Texto, r.Data)).ToList();

        return Ok(new { Ordem = dto, Defeitos = defeitos, Registros = registros });
    }

    [HttpPost]
    public IActionResult CriarOrdem([FromBody] CriarOrdemServicoDto request)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();
        var usuarioId = int.Parse(userIdClaim);

        var cliente = _db.Clientes.Find(request.ClienteId);
        if (cliente == null) return NotFound(new { mensagem = "Cliente não encontrado." });

        var numeroOS = $"OS-{DateTime.Now:yyyyMMdd}-{_db.OrdensServico.Count() + 1:D4}";

        var ordem = new OrdemServico
        {
            NumeroOS = numeroOS,
            ClienteId = request.ClienteId,
            EquipamentoId = request.EquipamentoId,
            UsuarioAberturaId = usuarioId,
            DescricaoProblema = request.DescricaoProblema,
            Status = StatusOS.Recebido,
            DataAbertura = DateTime.Now
        };

        _db.OrdensServico.Add(ordem);
        _db.SaveChanges();

        return CreatedAtAction(nameof(ObterOrdem), new { id = ordem.Id }, ordem.Id);
    }

    [HttpPut("{id}/status")]
    public IActionResult AtualizarStatus(int id, [FromBody] AtualizarStatusOsDto request)
    {
        var ordem = _db.OrdensServico.Find(id);
        if (ordem == null) return NotFound();

        if (!Enum.TryParse<StatusOS>(request.Status, true, out var novoStatus))
            return BadRequest(new { mensagem = "Status inválido." });

        ordem.Status = novoStatus;
        if (novoStatus == StatusOS.Pronto || novoStatus == StatusOS.Entregue)
            ordem.DataConclusao = DateTime.Now;

        _db.SaveChanges();
        return Ok(new { mensagem = "Status atualizado com sucesso.", novoStatus = ordem.Status.ToString() });
    }

    [HttpPut("{id}")]
    public IActionResult AtualizarOrdem(int id, [FromBody] OrdemServicoDto request)
    {
        var ordem = _db.OrdensServico.Find(id);
        if (ordem == null) return NotFound();

        ordem.DescricaoProblema = request.DescricaoProblema;
        ordem.ValorOrcamento = request.ValorOrcamento;
        ordem.ValorFinal = request.ValorFinal;
        ordem.Observacoes = request.Observacoes;
        ordem.DataPrevisao = request.DataPrevisao;

        _db.SaveChanges();
        return Ok(new { mensagem = "Ordem atualizada com sucesso." });
    }

    // ============================ CLIENTES ============================

    [HttpGet("clientes")]
    public IActionResult ListarClientes()
    {
        var clientes = _db.Clientes
            .Select(c => new ClienteDto(c.Id, c.Nome, c.Telefone, c.Endereco, c.Documento))
            .OrderBy(c => c.Nome)
            .ToList();
        return Ok(clientes);
    }

    [HttpPost("clientes")]
    public IActionResult CriarCliente([FromBody] CriarClienteDto request)
    {
        var cliente = new Cliente
        {
            Nome = request.Nome,
            Telefone = request.Telefone,
            Endereco = request.Endereco,
            Documento = request.Documento
        };
        _db.Clientes.Add(cliente);
        _db.SaveChanges();
        return CreatedAtAction(nameof(ListarClientes), new { }, new ClienteDto(cliente.Id, cliente.Nome, cliente.Telefone, cliente.Endereco, cliente.Documento));
    }

    // ============================ EQUIPAMENTOS ============================

    [HttpGet("equipamentos")]
    public IActionResult ListarEquipamentos([FromQuery] int? clienteId)
    {
        var query = _db.Equipamentos.Include(e => e.Cliente).AsQueryable();
        if (clienteId.HasValue) query = query.Where(e => e.ClienteId == clienteId.Value);

        var equipamentos = query.Select(e => new EquipamentoDto(
            e.Id, e.ClienteId, e.Marca, e.Modelo, e.NumeroSerie, e.Descricao)).ToList();
        return Ok(equipamentos);
    }

    [HttpPost("equipamentos")]
    public IActionResult CriarEquipamento([FromBody] CriarEquipamentoDto request)
    {
        var equipamento = new Equipamento
        {
            ClienteId = request.ClienteId,
            Marca = request.Marca,
            Modelo = request.Modelo,
            NumeroSerie = request.NumeroSerie,
            Descricao = request.Descricao
        };
        _db.Equipamentos.Add(equipamento);
        _db.SaveChanges();
        return CreatedAtAction(nameof(ListarEquipamentos), new { }, equipamento.Id);
    }

    // ============================ DEFEITOS ============================

    [HttpGet("defeitos")]
    public IActionResult ListarDefeitos([FromQuery] int ordemServicoId)
    {
        var defeitos = _db.Defeitos
            .Where(d => d.OrdemServicoId == ordemServicoId)
            .Select(d => new DefeitoDto(d.Id, d.OrdemServicoId, d.Descricao, d.Data))
            .ToList();
        return Ok(defeitos);
    }

    [HttpPost("defeitos")]
    public IActionResult CriarDefeito([FromBody] CriarDefeitoDto request)
    {
        var defeito = new Defeito
        {
            OrdemServicoId = request.OrdemServicoId,
            Descricao = request.Descricao,
            Data = DateTime.Now
        };
        _db.Defeitos.Add(defeito);
        _db.SaveChanges();
        return CreatedAtAction(nameof(ListarDefeitos), new { ordemServicoId = request.OrdemServicoId }, defeito.Id);
    }

    // ============================ REGISTROS / ANOTAÇÕES ============================

    [HttpGet("registros")]
    public IActionResult ListarRegistros([FromQuery] int ordemServicoId)
    {
        var registros = _db.RegistrosAnotacao
            .Include(r => r.Usuario)
            .Where(r => r.OrdemServicoId == ordemServicoId)
            .OrderByDescending(r => r.Data)
            .Select(r => new RegistroDto(r.Id, r.OrdemServicoId, r.UsuarioId, r.Usuario.Nome, r.Texto, r.Data))
            .ToList();
        return Ok(registros);
    }

    [HttpPost("registros")]
    public IActionResult CriarRegistro([FromBody] CriarRegistroDto request)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();
        var usuarioId = int.Parse(userIdClaim);

        var registro = new RegistroAnotacao
        {
            OrdemServicoId = request.OrdemServicoId,
            UsuarioId = usuarioId,
            Texto = request.Texto,
            Data = DateTime.Now
        };
        _db.RegistrosAnotacao.Add(registro);
        _db.SaveChanges();
        return CreatedAtAction(nameof(ListarRegistros), new { ordemServicoId = request.OrdemServicoId }, registro.Id);
    }
}
