using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Windows;

namespace TecPrint.Desktop;

public partial class CadastroClienteWindow : Window
{
    private readonly HttpClient _http = new() { BaseAddress = new Uri("http://localhost:5000") };

    public CadastroClienteWindow()
    {
        InitializeComponent();
    }

    private async void BtnCadastrar_Click(object sender, RoutedEventArgs e)
    {
        var nome = TxtNome.Text.Trim();
        var telefone = TxtTelefone.Text.Trim();
        var endereco = TxtEndereco.Text.Trim();
        var documento = TxtDocumento.Text.Trim();

        if (string.IsNullOrEmpty(nome) || string.IsNullOrEmpty(telefone) || string.IsNullOrEmpty(endereco))
        {
            TxtErro.Text = "Preencha nome, telefone e endereço.";
            TxtSucesso.Text = string.Empty;
            return;
        }

        try
        {
            var dto = new { Nome = nome, Telefone = telefone, Endereco = endereco, Documento = documento };
            var json = JsonSerializer.Serialize(dto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.PostAsync("api/ordens/clientes", content);
            if (response.IsSuccessStatusCode)
            {
                TxtSucesso.Text = "Cliente cadastrado com sucesso!";
                TxtErro.Text = string.Empty;
                TxtNome.Text = string.Empty;
                TxtTelefone.Text = string.Empty;
                TxtEndereco.Text = string.Empty;
                TxtDocumento.Text = string.Empty;
            }
            else
            {
                TxtErro.Text = "Erro ao cadastrar cliente.";
                TxtSucesso.Text = string.Empty;
            }
        }
        catch (Exception ex)
        {
            TxtErro.Text = $"Erro: {ex.Message}";
            TxtSucesso.Text = string.Empty;
        }
    }

    private void BtnCancelar_Click(object sender, RoutedEventArgs e)
    {
        Close();
    }
}
