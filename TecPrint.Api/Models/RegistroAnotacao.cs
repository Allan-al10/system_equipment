namespace TecPrint.Api.Models;

public class RegistroAnotacao
{
    public int Id { get; set; }
    public int OrdemServicoId { get; set; }
    public int UsuarioId { get; set; }
    public string Texto { get; set; } = string.Empty;
    public DateTime Data { get; set; } = DateTime.Now;

    public OrdemServico OrdemServico { get; set; } = null!;
    public Usuario Usuario { get; set; } = null!;
}
