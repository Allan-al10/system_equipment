namespace TecPrint.Api.Models;

public class Cliente
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string Endereco { get; set; } = string.Empty;
    public string? Documento { get; set; } // CPF/CNPJ
    public DateTime CriadoEm { get; set; } = DateTime.Now;

    public ICollection<OrdemServico> OrdensServico { get; set; } = new List<OrdemServico>();
    public ICollection<Equipamento> Equipamentos { get; set; } = new List<Equipamento>();
}
