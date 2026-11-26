using Microsoft.EntityFrameworkCore;
using TecPrint.Api.Models;

namespace TecPrint.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Equipamento> Equipamentos => Set<Equipamento>();
    public DbSet<OrdemServico> OrdensServico => Set<OrdemServico>();
    public DbSet<Defeito> Defeitos => Set<Defeito>();
    public DbSet<RegistroAnotacao> RegistrosAnotacao => Set<RegistroAnotacao>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Usuario>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.SenhaHash).IsRequired();
        });

        modelBuilder.Entity<Cliente>(e =>
        {
            e.Property(c => c.Nome).IsRequired();
            e.Property(c => c.Telefone).IsRequired();
        });

        modelBuilder.Entity<Equipamento>(e =>
        {
            e.Property(eq => eq.Marca).IsRequired();
            e.Property(eq => eq.Modelo).IsRequired();
            e.HasOne(eq => eq.Cliente)
             .WithMany(c => c.Equipamentos)
             .HasForeignKey(eq => eq.ClienteId);
        });

        modelBuilder.Entity<OrdemServico>(e =>
        {
            e.Property(os => os.NumeroOS).IsRequired().HasMaxLength(20);
            e.Property(os => os.DescricaoProblema).IsRequired();
            e.HasIndex(os => os.NumeroOS).IsUnique();
            e.HasOne(os => os.Cliente).WithMany(c => c.OrdensServico).HasForeignKey(os => os.ClienteId);
            e.HasOne(os => os.Equipamento).WithMany(eq => eq.OrdensServico).HasForeignKey(os => os.EquipamentoId);
            e.HasOne(os => os.UsuarioAbertura).WithMany(u => u.OrdensAbertas).HasForeignKey(os => os.UsuarioAberturaId);
            e.HasOne(os => os.UsuarioResponsavel).WithMany(u => u.OrdensResponsavel).HasForeignKey(os => os.UsuarioResponsavelId);
        });

        modelBuilder.Entity<Defeito>(e =>
        {
            e.Property(d => d.Descricao).IsRequired();
            e.HasOne(d => d.OrdemServico).WithMany(os => os.Defeitos).HasForeignKey(d => d.OrdemServicoId);
        });

        modelBuilder.Entity<RegistroAnotacao>(e =>
        {
            e.Property(r => r.Texto).IsRequired();
            e.HasOne(r => r.OrdemServico).WithMany(os => os.Registros).HasForeignKey(r => r.OrdemServicoId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.Usuario).WithMany(u => u.Registros).HasForeignKey(r => r.UsuarioId).OnDelete(DeleteBehavior.NoAction);
        });
    }
}
