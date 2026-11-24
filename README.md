# TecPrint

Sistema de gestão de ordens de serviço para assistência técnica, reescrito em **C# (.NET 10)**.

O sistema roda localmente no Windows (aplicativo desktop) e pode ser acessado pelo navegador do celular/tablet na mesma rede, permitindo que técnicos atualizem o status dos equipamentos enquanto o dono gerencia pelo computador.

## Objetivo

Substituir WhatsApp, apps simples e bloco de notas por algo mais sólido para entrada de equipamentos e mudança de estado conforme o serviço avança.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Linguagem | C# 12 / .NET 10 (LTS) |
| Back-end | ASP.NET Core Web API |
| Banco de dados | SQL Server LocalDB / Express (local no Windows) |
| Desktop (Windows) | WPF (aplicativo .exe nativo) |
| Web (celular via navegador) | ASP.NET Core MVC + Razor Pages |
| Autenticação | JWT (API) + Cookie (Web) |

## Perfis de usuário

- **Admin (dono do projeto):** login separado, cadastro de funcionários, backup, acesso total.
- **Funcionário:** login separado, cria/edita ordens de serviço, muda status, registra defeitos e anotações.

## Funcionalidades

- Login com perfis separados (Admin vs Funcionário)
- Nova OS (entrada de equipamento)
- Listagem de OS com filtro por status
- Mudança de estado do equipamento (Recebido → Orçamento → Aguardando Aprovação → Reparo → Pronto → Entregue → Cancelado)
- Defeitos
- Registros / Anotações por OS
- Clientes e Equipamentos
- Backup local do banco de dados

## Requisitos

- .NET SDK 10 instalado no Windows
- SQL Server LocalDB ou SQL Server Express (para o banco local)
- Para acesso pelo celular: computador e celular na mesma rede Wi-Fi

## Como rodar

No terminal, na raiz do projeto:

### 1. Back-end (API)
```bash
dotnet run --project TecPrint.Api
```
A API sobe em `https://localhost:5001` (e HTTP na 5000).

### 2. Web (acesso pelo celular/tablet)
```bash
dotnet run --project TecPrint.Web
```
No navegador do celular, acesse o IP da máquina na rede, por exemplo: `http://192.168.x.x:5000`

### 3. Desktop (Windows local)
```bash
dotnet run --project TecPrint.Desktop
```
Gera um aplicativo `.exe` nativo para Windows.

## Credencial padrão (primeiro acesso)

- E-mail: `admin@tecprint.com`
- Senha: `admin123`
- Perfil: Administrador

## Estrutura da solução

```
TecPrint.slnx
├── TecPrint.Api/         # ASP.NET Core Web API (back-end compartilhado)
│   ├── Controllers/      # Auth, Ordens (OS, clientes, equipamentos, defeitos, registros)
│   ├── Data/             # AppDbContext (EF Core + SQL Server)
│   ├── Models/           # Usuario, Cliente, Equipamento, OrdemServico, Defeito, RegistroAnotacao
│   └── appsettings.json  # Connection string e configurações JWT
├── TecPrint.Web/         # ASP.NET Core MVC (navegador do celular)
│   ├── Controllers/      # Account, Ordens
│   ├── Services/         # ApiService, TokenService
│   └── Views/            # Razor views (Login, Cadastro, Ordens Index/Detalhes/Novo)
└── TecPrint.Desktop/     # WPF (Windows local)
    ├── MainWindow.xaml   # Interface desktop
    └── MainWindow.xaml.cs # Lógica do desktop (HttpClient para a API)
```

## Banco de dados antigo (.mdf)

Se você possui um banco de dados antigo no formato do Microsoft SQL Server (arquivo `.mdf`), envie-o para que possamos anexar ao SQL Server LocalDB/Express e migrar os dados existentes sem perder nada.

## Verificações antes de concluir uma alteração

```bash
dotnet build TecPrint.slnx
```

## Pendências (futuras)

- Backup automático do banco de dados
- Relatórios de OS por período
- Sincronização de dados entre desktop e web em tempo real
