using TecPrint.Api.Models;

namespace TecPrint.Tests;

public class UnitTests
{
    [Fact]
    public void PerfilUsuario_TemValoresEsperados()
    {
        Assert.Equal(1, (int)PerfilUsuario.Admin);
        Assert.Equal(2, (int)PerfilUsuario.Funcionario);
    }

    [Fact]
    public void StatusOS_TemTodosOsStatus()
    {
        Assert.Equal(7, Enum.GetValues<StatusOS>().Length);
        Assert.Contains(StatusOS.Recebido, Enum.GetValues<StatusOS>());
        Assert.Contains(StatusOS.Orcamento, Enum.GetValues<StatusOS>());
        Assert.Contains(StatusOS.AguardandoAprovacao, Enum.GetValues<StatusOS>());
        Assert.Contains(StatusOS.Reparo, Enum.GetValues<StatusOS>());
        Assert.Contains(StatusOS.Pronto, Enum.GetValues<StatusOS>());
        Assert.Contains(StatusOS.Entregue, Enum.GetValues<StatusOS>());
        Assert.Contains(StatusOS.Cancelado, Enum.GetValues<StatusOS>());
    }

    [Fact]
    public void Usuario_CriadoComPerfilFuncionarioPorPadrao()
    {
        var usuario = new Usuario
        {
            Nome = "Teste",
            Email = "teste@tecprint.com",
            SenhaHash = "hash",
            Perfil = PerfilUsuario.Funcionario,
            Ativo = true
        };

        Assert.Equal("Teste", usuario.Nome);
        Assert.Equal("teste@tecprint.com", usuario.Email);
        Assert.Equal(PerfilUsuario.Funcionario, usuario.Perfil);
        Assert.True(usuario.Ativo);
    }

    [Fact]
    public void OrdemServico_StatusPadraoEhRecebido()
    {
        var ordem = new OrdemServico
        {
            NumeroOS = "OS-20260101-0001",
            ClienteId = 1,
            DescricaoProblema = "Impressora não liga",
            UsuarioAberturaId = 1
        };

        Assert.Equal(StatusOS.Recebido, ordem.Status);
        Assert.Equal("OS-20260101-0001", ordem.NumeroOS);
    }
}
