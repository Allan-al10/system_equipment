using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;

namespace TecPrint.Desktop;

public partial class MainWindow : Window
{
    private readonly HttpClient _http = new() { BaseAddress = new Uri("http://localhost:5000") };
    private string? _token;
    private int _ordemSelecionadaId;

    public MainWindow() => InitializeComponent();

    // ============================ LOGIN ============================
    private async void BtnLogin_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            var loginDto = new { Email = TxtEmail.Text, Senha = TxtSenha.Password };
            var json = JsonSerializer.Serialize(loginDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.PostAsync("api/auth/login", content);
            if (!response.IsSuccessStatusCode)
            {
                TxtErroLogin.Text = "E-mail ou senha inválidos.";
                return;
            }

            var body = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(body);
            _token = doc.RootElement.GetProperty("token").GetString();
            var nome = doc.RootElement.GetProperty("nome").GetString();
            var perfil = doc.RootElement.GetProperty("perfil").GetString();

            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _token);

            TxtUsuarioLogado.Text = $"{nome} ({perfil})";
            PainelLogin.Visibility = Visibility.Collapsed;
            PainelPrincipal.Visibility = Visibility.Visible;

            await CarregarOrdens();
        }
        catch (Exception ex)
        {
            TxtErroLogin.Text = $"Erro: {ex.Message}";
        }
    }

    private void BtnSair_Click(object sender, RoutedEventArgs e)
    {
        _token = null;
        _http.DefaultRequestHeaders.Authorization = null;
        TxtEmail.Text = string.Empty;
        TxtSenha.Password = string.Empty;
        TxtErroLogin.Text = string.Empty;
        PainelLogin.Visibility = Visibility.Visible;
        PainelPrincipal.Visibility = Visibility.Collapsed;
    }

    // ============================ ORDENS ============================
    private async void BtnAtualizar_Click(object sender, RoutedEventArgs e) => await CarregarOrdens();

    private async Task CarregarOrdens()
    {
        try
        {
            var response = await _http.GetAsync("api/ordens");
            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadAsStringAsync();

            var ordens = JsonSerializer.Deserialize<List<OrdemDto>>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
            GridOrdens.ItemsSource = ordens;
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Erro ao carregar ordens: {ex.Message}", "Erro", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private void GridOrdens_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
    {
        if (GridOrdens.SelectedItem is not OrdemDto os) return;
        _ordemSelecionadaId = os.Id;

        TxtDetalheNumero.Text = os.NumeroOS;
        TxtDetalheCliente.Text = $"Cliente: {os.ClienteNome}";
        TxtDetalheEquipamento.Text = $"Equipamento: {os.EquipamentoDescricao ?? "Não informado"}";
        TxtDetalheDescricao.Text = os.DescricaoProblema;
        TxtDetalheStatus.Text = $"Status: {os.Status}";
        TxtDetalheValor.Text = os.ValorFinal.HasValue ? $"Valor final: R$ {os.ValorFinal:F2}" : string.Empty;
        TxtMensagem.Text = string.Empty;
    }

    private async void BtnNovaOs_Click(object sender, RoutedEventArgs e)
    {
        MessageBox.Show("Funcionalidade de nova OS disponível na versão web (TecPrint.Web).", "Info", MessageBoxButton.OK, MessageBoxImage.Information);
    }

    private async void BtnAtualizarStatus_Click(object sender, RoutedEventArgs e)
    {
        if (CmbNovoStatus.SelectedItem is not ComboBoxItem item) return;
        var novoStatus = item.Content.ToString();

        try
        {
            var dto = new { Status = novoStatus };
            var json = JsonSerializer.Serialize(dto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.PutAsync($"api/ordens/{_ordemSelecionadaId}/status", content);
            if (response.IsSuccessStatusCode)
            {
                TxtMensagem.Text = "Status atualizado com sucesso!";
                await CarregarOrdens();
            }
            else
            {
                MessageBox.Show("Erro ao atualizar status.", "Erro", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Erro: {ex.Message}", "Erro", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private async void BtnAdicionarRegistro_Click(object sender, RoutedEventArgs e)
    {
        if (_ordemSelecionadaId == 0) return;
        var texto = TxtNovoRegistro.Text.Trim();
        if (string.IsNullOrEmpty(texto)) return;

        try
        {
            var dto = new { OrdemServicoId = _ordemSelecionadaId, Texto = texto };
            var json = JsonSerializer.Serialize(dto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.PostAsync("api/ordens/registros", content);
            if (response.IsSuccessStatusCode)
            {
                TxtNovoRegistro.Text = string.Empty;
                TxtMensagem.Text = "Registro adicionado.";
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Erro: {ex.Message}", "Erro", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }
}

public record OrdemDto(
    int Id, string NumeroOS, string ClienteNome, string? EquipamentoDescricao,
    string DescricaoProblema, string Status, DateTime DataAbertura, decimal? ValorFinal);
