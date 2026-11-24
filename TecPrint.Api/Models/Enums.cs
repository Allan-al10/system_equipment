namespace TecPrint.Api.Models;

public enum PerfilUsuario
{
    Admin = 1,
    Funcionario = 2
}

public enum StatusOS
{
    Recebido = 1,
    Orcamento = 2,
    AguardandoAprovacao = 3,
    Reparo = 4,
    Pronto = 5,
    Entregue = 6,
    Cancelado = 7
}
