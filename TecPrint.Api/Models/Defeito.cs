namespace TecPrint.Api.Models;

public class Defeito
{
    public int Id { get; set; }
    public int OrdemServicoId { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public DateTime Data { get; set; } = DateTime.Now;

    public OrdemServico OrdemServico { get; set; } = null!;
}
