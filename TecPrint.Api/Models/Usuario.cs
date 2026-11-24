namespace TecPrint.Api.Models;

public class Usuario
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public PerfilUsuario Perfil { get; set; } = PerfilUsuario.Funcionario;
    public bool Ativo { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.Now;

    public ICollection<OrdemServico> OrdensAbertas { get; set; } = new List<OrdemServico>();
    public ICollection<OrdemServico> OrdensResponsavel { get; set; } = new List<OrdemServico>();
    public ICollection<RegistroAnotacao> Registros { get; set; } = new List<RegistroAnotacao>();
}
