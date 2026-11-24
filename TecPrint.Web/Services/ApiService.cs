using System.Text;
using System.Text.Json;

namespace TecPrint.Web.Services;

public class ApiService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly TokenService _tokenService;

    public ApiService(IHttpClientFactory httpClientFactory, TokenService tokenService)
    {
        _httpClientFactory = httpClientFactory;
        _tokenService = tokenService;
    }

    private HttpClient CriarCliente(bool autenticado = true)
    {
        var client = _httpClientFactory.CreateClient("TecPrintApi");
        if (autenticado)
        {
            var token = _tokenService.GetToken();
            if (!string.IsNullOrWhiteSpace(token))
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        }
        return client;
    }

    private static StringContent Json(object dados) =>
        new(JsonSerializer.Serialize(dados), Encoding.UTF8, "application/json");

    private static async Task<T?> LerJson<T>(HttpResponseMessage response)
    {
        var conteudo = await response.Content.ReadAsStringAsync();
        if (string.IsNullOrWhiteSpace(conteudo)) return default;
        return JsonSerializer.Deserialize<T>(conteudo, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    // ========== LOGIN ==========
    public async Task<(bool Sucesso, string? Token, string? Nome, string? Perfil, string? Erro)> LoginAsync(string email, string senha)
    {
        var client = CriarCliente(false);
        var response = await client.PostAsync("api/auth/login", Json(new { Email = email, Senha = senha }));
        if (!response.IsSuccessStatusCode)
            return (false, null, null, null, "E-mail ou senha inválidos.");

        var resultado = await LerJson<dynamic>(response);
        var token = resultado?.Token?.ToString();
        var nome = resultado?.Nome?.ToString();
        var perfil = resultado?.Perfil?.ToString();
        return (true, token, nome, perfil, null);
    }

    // ========== ORDENS ==========
    public async Task<List<dynamic>?> ListarOrdensAsync(string? status = null, int? clienteId = null)
    {
        var client = CriarCliente();
        var url = "api/ordens";
        var parametros = new List<string>();
        if (!string.IsNullOrWhiteSpace(status)) parametros.Add($"status={status}");
        if (clienteId.HasValue) parametros.Add($"clienteId={clienteId.Value}");
        if (parametros.Count > 0) url += "?" + string.Join("&", parametros);

        var response = await client.GetAsync(url);
        if (!response.IsSuccessStatusCode) return null;
        return await LerJson<List<dynamic>>(response);
    }

    public async Task<dynamic?> ObterOrdemAsync(int id)
    {
        var client = CriarCliente();
        var response = await client.GetAsync($"api/ordens/{id}");
        if (!response.IsSuccessStatusCode) return null;
        return await LerJson<dynamic>(response);
    }

    public async Task<bool?> CriarOrdemAsync(int clienteId, int? equipamentoId, string descricaoProblema)
    {
        var client = CriarCliente();
        var response = await client.PostAsync("api/ordens", Json(new
        {
            ClienteId = clienteId,
            EquipamentoId = equipamentoId,
            DescricaoProblema = descricaoProblema
        }));
        return response.IsSuccessStatusCode;
    }

    public async Task<bool?> AtualizarStatusAsync(int id, string novoStatus)
    {
        var client = CriarCliente();
        var response = await client.PutAsync($"api/ordens/{id}/status", Json(new { Status = novoStatus }));
        return response.IsSuccessStatusCode;
    }

    // ========== CLIENTES ==========
    public async Task<List<dynamic>?> ListarClientesAsync()
    {
        var client = CriarCliente();
        var response = await client.GetAsync("api/ordens/clientes");
        if (!response.IsSuccessStatusCode) return null;
        return await LerJson<List<dynamic>>(response);
    }

    public async Task<bool?> CriarClienteAsync(string nome, string telefone, string endereco, string? documento)
    {
        var client = CriarCliente();
        var response = await client.PostAsync("api/ordens/clientes", Json(new
        {
            Nome = nome,
            Telefone = telefone,
            Endereco = endereco,
            Documento = documento
        }));
        return response.IsSuccessStatusCode;
    }

    // ========== EQUIPAMENTOS ==========
    public async Task<List<dynamic>?> ListarEquipamentosAsync(int? clienteId = null)
    {
        var client = CriarCliente();
        var url = "api/ordens/equipamentos";
        if (clienteId.HasValue) url += $"?clienteId={clienteId.Value}";
        var response = await client.GetAsync(url);
        if (!response.IsSuccessStatusCode) return null;
        return await LerJson<List<dynamic>>(response);
    }

    public async Task<bool?> CriarEquipamentoAsync(int clienteId, string marca, string modelo, string? numeroSerie, string? descricao)
    {
        var client = CriarCliente();
        var response = await client.PostAsync("api/ordens/equipamentos", Json(new
        {
            ClienteId = clienteId,
            Marca = marca,
            Modelo = modelo,
            NumeroSerie = numeroSerie,
            Descricao = descricao
        }));
        return response.IsSuccessStatusCode;
    }

    // ========== DEFEITOS ==========
    public async Task<List<dynamic>?> ListarDefeitosAsync(int ordemServicoId)
    {
        var client = CriarCliente();
        var response = await client.GetAsync($"api/ordens/defeitos?ordemServicoId={ordemServicoId}");
        if (!response.IsSuccessStatusCode) return null;
        return await LerJson<List<dynamic>>(response);
    }

    public async Task<bool?> CriarDefeitoAsync(int ordemServicoId, string descricao)
    {
        var client = CriarCliente();
        var response = await client.PostAsync("api/ordens/defeitos", Json(new
        {
            OrdemServicoId = ordemServicoId,
            Descricao = descricao
        }));
        return response.IsSuccessStatusCode;
    }

    // ========== REGISTROS ==========
    public async Task<List<dynamic>?> ListarRegistrosAsync(int ordemServicoId)
    {
        var client = CriarCliente();
        var response = await client.GetAsync($"api/ordens/registros?ordemServicoId={ordemServicoId}");
        if (!response.IsSuccessStatusCode) return null;
        return await LerJson<List<dynamic>>(response);
    }

    public async Task<bool?> CriarRegistroAsync(int ordemServicoId, string texto)
    {
        var client = CriarCliente();
        var response = await client.PostAsync("api/ordens/registros", Json(new
        {
            OrdemServicoId = ordemServicoId,
            Texto = texto
        }));
        return response.IsSuccessStatusCode;
    }
}
