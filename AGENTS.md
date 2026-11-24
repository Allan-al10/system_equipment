This is a .NET 10 solution written in C#. Prioritize mobile-first patterns (web for celular), performance, and cross-platform compatibility.

## Solution Structure

- `TecPrint.slnx` — solution file (.NET 10)
- `TecPrint.Api/` — ASP.NET Core Web API (back-end compartilhado, SQL Server local)
- `TecPrint.Web/` — ASP.NET Core MVC (acesso pelo navegador do celular/tablet)
- `TecPrint.Desktop/` — WPF (.exe para Windows local)

## Rules

- The app is **no longer Expo/React Native**. Do not write TypeScript, JavaScript, or Expo Router code.
- All back-end logic lives in `TecPrint.Api`. Controllers under `TecPrint.Api/Controllers/`, models under `TecPrint.Api/Models/`, EF Core DbContext under `TecPrint.Api/Data/`.
- The web front-end (acesso pelo celular) lives in `TecPrint.Web/` — Controllers + Razor Views under `Views/`.
- The desktop front-end (Windows local) lives in `TecPrint.Desktop/` — WPF under `MainWindow.xaml` and code-behind.
- Database: SQL Server LocalDB/Express via Entity Framework Code First. Connection string in `TecPrint.Api/appsettings.json`.
- Authentication: JWT (API) + Cookie (Web). Separate profiles: Admin (dono) and Funcionario.
- .NET SDK 10 is used. Build with `dotnet build TecPrint.slnx`. Run with `dotnet run --project <projeto>`.

## Commands

```bash
dotnet build TecPrint.slnx           # build toda a solução
dotnet run --project TecPrint.Api    # roda a API (back-end)
dotnet run --project TecPrint.Web    # roda a web (acesso pelo celular)
dotnet run --project TecPrint.Desktop # roda o desktop Windows (.exe)
```

## Architecture

- Back-end: ASP.NET Core Web API (.NET 10) + EF Core + SQL Server LocalDB
- Web (celular via navegador): ASP.NET Core MVC + Razor Pages
- Desktop (Windows local): WPF
- Auth: JWT tokens (API), Cookie auth (Web). Perfis: Admin e Funcionario.
- Seeded admin user: email `admin@tecprint.com`, senha `admin123`

## Database Legacy

O projeto foi modelado para ser compatível com o banco de dados antigo (arquivo .mdf do SQL Server). Quando o arquivo .mdf estiver disponível, anexe ao SQL Server LocalDB/Express e ajuste o modelo (Database First ou Code First) para preservar os dados existentes.
