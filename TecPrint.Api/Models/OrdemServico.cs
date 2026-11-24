namespace TecPrint.Api.Models;

public class OrdemServico
{
    public int Id { get; set; }
    public string NumeroOS { get; set; } = string.Empty;
    public int ClienteId { get; set; }
    public int? EquipamentoId { get; set; }
    public int UsuarioAberturaId { get; set; }
    public int? UsuarioResponsavelId { get; set; }
    public string DescricaoProblema { get; set; } = string.Empty;
    public StatusOS Status { get; set; } = StatusOS.Recebido;
    public DateTime DataAbertura { get; set; } = DateTime.Now;
    public DateTime? DataPrevisao { get; set; }
    public DateTime? DataConclusao { get; set; }
    public decimal? ValorOrcamento { get; set; }
    public decimal? ValorFinal { get; set; }
    public string? Observacoes { get; set; }

    public Cliente Cliente { get; set; } = null!;
    public Equipamento? Equipamento { get; set; }
    public Usuario UsuarioAbertura { get; set; } = null!;
    public Usuario? UsuarioResponsavel { get; set; }
    public ICollection<Defeito> Defeitos { get; set; } = new List<Defeito>();
    public ICollection<RegistroAnotacao> Registros { get; set; } = new List<RegistroAnotacao>();
}
