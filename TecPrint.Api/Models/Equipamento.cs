namespace TecPrint.Api.Models;

public class Equipamento
{
    public int Id { get; set; }
    public int ClienteId { get; set; }
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public string? NumeroSerie { get; set; }
    public string? Descricao { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.Now;

    public Cliente Cliente { get; set; } = null!;
    public ICollection<OrdemServico> OrdensServico { get; set; } = new List<OrdemServico>();
}
