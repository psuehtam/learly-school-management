using Learly.Application.Contracts.PreAlunos.Requests;
using Learly.Domain.Entities;

namespace Learly.Application.Services.PreAlunos;

internal sealed record PreAlunoCadastroResolvido(
    string Nome,
    string Sobrenome,
    DateOnly DataNascimento,
    int IdadeAnos,
    string? TelAluno,
    int LivroInteresseId,
    decimal ValorMensalidade,
    decimal? ValorMaterial,
    string TipoContrato,
    decimal ValorMatricula,
    string? FormaPagamentoMatricula,
    string OrigemCaptacao,
    string? FormaPagamentoMensal,
    bool UsaTransporteVan,
    string? TransporteCep,
    string? TransporteLogradouro,
    string? TransporteNumero,
    string? TransporteComplemento,
    string? TransporteBairro,
    string? TransporteCidade,
    string? TransporteUf,
    bool EProprioResponsavel,
    string? AlunoCpf,
    string TipoResp,
    string NomeResp,
    string SobrenomeResp,
    string DocResp,
    string TelResp,
    string? ObservacoesUsuario);

internal static class PreAlunoCadastroResolver
{
    public static (bool Ok, string? Erro, PreAlunoCadastroResolvido? Dados) Resolver(
        CriarPreAlunoRequest request,
        DateOnly hojeReferencia)
    {
        if (string.IsNullOrWhiteSpace(request.Nome) || string.IsNullOrWhiteSpace(request.Sobrenome))
            return (false, "Nome e sobrenome do pre-aluno sao obrigatorios.", null);

        if (request.DataNascimento == default)
            return (false, "Data de nascimento do pre-aluno e obrigatoria.", null);

        if (request.DataNascimento > hojeReferencia)
            return (false, "Data de nascimento do pre-aluno invalida.", null);

        var idadeAnos = CalcularIdadeAnos(request.DataNascimento, hojeReferencia);

        if (request.LivroInteresseId <= 0)
            return (false, "Livro de interesse invalido.", null);

        if (request.ValorMensalidade <= 0)
            return (false, "Valor da mensalidade deve ser maior que zero.", null);

        if (request.ValorMaterial is < 0)
            return (false, "Valor do material/livro nao pode ser negativo.", null);

        var tipoContrato = request.TipoContrato.Trim();
        if (string.IsNullOrWhiteSpace(tipoContrato) || tipoContrato.Length > 120)
            return (false, "Tipo de contrato e obrigatorio (ate 120 caracteres).", null);

        if (request.ValorMatricula < 0)
            return (false, "Valor da matricula nao pode ser negativo.", null);

        var formaPgtoMatricula = string.IsNullOrWhiteSpace(request.FormaPagamentoMatricula)
            ? null
            : request.FormaPagamentoMatricula.Trim();
        if (request.ValorMatricula > 0 && string.IsNullOrWhiteSpace(formaPgtoMatricula))
            return (false, "Informe a forma de pagamento da matricula quando o valor for maior que zero.", null);

        var origem = request.OrigemCaptacao.Trim();
        if (string.IsNullOrWhiteSpace(origem) || origem.Length > 80)
            return (false, "Origem de captacao e obrigatoria (ate 80 caracteres).", null);

        if (request.UsaTransporteVan)
        {
            if (string.IsNullOrWhiteSpace(request.TransporteLogradouro) || request.TransporteLogradouro.Trim().Length > 200)
                return (false, "Endereco para van: informe logradouro.", null);
            if (string.IsNullOrWhiteSpace(request.TransporteNumero) || request.TransporteNumero.Trim().Length > 20)
                return (false, "Endereco para van: informe numero.", null);
            if (string.IsNullOrWhiteSpace(request.TransporteBairro) || request.TransporteBairro.Trim().Length > 100)
                return (false, "Endereco para van: informe bairro.", null);
            if (string.IsNullOrWhiteSpace(request.TransporteCidade) || request.TransporteCidade.Trim().Length > 100)
                return (false, "Endereco para van: informe cidade.", null);

            var uf = (request.TransporteUf ?? string.Empty).Trim().ToUpperInvariant();
            if (uf.Length != 2)
                return (false, "Endereco para van: informe UF com 2 letras.", null);

            if (SomenteDigitos(request.TransporteCep).Length != 8)
                return (false, "Endereco para van: informe CEP com 8 digitos.", null);
        }

        var telAluno = SomenteDigitos(request.TelefoneAluno);
        if (telAluno is { Length: > 0 and < 10 })
            return (false, "Telefone do pre-aluno invalido.", null);

        string docResp;
        string tipoResp;
        string nomeResp;
        string sobrenomeResp;
        string telResp;
        string? alunoCpf = null;

        if (idadeAnos < 18)
        {
            if (request.EProprioResponsavel)
                return (false, "Menores de 18 anos precisam de um responsavel financeiro cadastrado (nao pode ser o proprio aluno).", null);

            var tipoMenorResp = NormalizarTipoPessoa(request.ResponsavelTipoPessoa);
            if (tipoMenorResp is null)
                return (false, "Tipo de pessoa do responsavel invalido.", null);

            docResp = SomenteDigitos(request.ResponsavelCpfCnpj);
            if (tipoMenorResp == "Fisica" && docResp.Length != 11)
                return (false, "CPF do responsavel deve ter 11 digitos.", null);
            if (tipoMenorResp == "Juridica" && docResp.Length != 14)
                return (false, "CNPJ do responsavel deve ter 14 digitos.", null);

            telResp = SomenteDigitos(request.ResponsavelTelefone);
            if (telResp.Length < 10)
                return (false, "Telefone do responsavel e obrigatorio (minimo 10 digitos).", null);

            if (string.IsNullOrWhiteSpace(request.ResponsavelNome) || string.IsNullOrWhiteSpace(request.ResponsavelSobrenome))
                return (false, "Nome e sobrenome do responsavel sao obrigatorios.", null);

            tipoResp = tipoMenorResp;
            nomeResp = request.ResponsavelNome.Trim();
            sobrenomeResp = request.ResponsavelSobrenome.Trim();
        }
        else if (request.EProprioResponsavel)
        {
            docResp = SomenteDigitos(request.AlunoCpf);
            if (docResp.Length != 11)
                return (false, "Informe o CPF do pre-aluno (11 digitos) quando ele for o proprio responsavel financeiro.", null);

            telResp = telAluno;
            if (telResp.Length < 10)
                return (false, "Telefone celular do pre-aluno e obrigatorio quando ele e o proprio responsavel financeiro.", null);

            tipoResp = "Fisica";
            nomeResp = request.Nome.Trim();
            sobrenomeResp = request.Sobrenome.Trim();
            alunoCpf = docResp;
        }
        else
        {
            var tipoMaiorResp = NormalizarTipoPessoa(request.ResponsavelTipoPessoa);
            if (tipoMaiorResp is null)
                return (false, "Tipo de pessoa do responsavel invalido.", null);

            docResp = SomenteDigitos(request.ResponsavelCpfCnpj);
            if (tipoMaiorResp == "Fisica" && docResp.Length != 11)
                return (false, "CPF do responsavel deve ter 11 digitos.", null);
            if (tipoMaiorResp == "Juridica" && docResp.Length != 14)
                return (false, "CNPJ do responsavel deve ter 14 digitos.", null);

            telResp = SomenteDigitos(request.ResponsavelTelefone);
            if (telResp.Length < 10)
                return (false, "Telefone do responsavel e obrigatorio (minimo 10 digitos).", null);

            if (string.IsNullOrWhiteSpace(request.ResponsavelNome) || string.IsNullOrWhiteSpace(request.ResponsavelSobrenome))
                return (false, "Nome e sobrenome do responsavel sao obrigatorios.", null);

            tipoResp = tipoMaiorResp;
            nomeResp = request.ResponsavelNome.Trim();
            sobrenomeResp = request.ResponsavelSobrenome.Trim();
        }

        string? transporteCep = null;
        string? transporteLog = null;
        string? transporteNumero = null;
        string? transporteComp = null;
        string? transporteBairro = null;
        string? transporteCidade = null;
        string? transporteUf = null;

        if (request.UsaTransporteVan)
        {
            transporteCep = SomenteDigitos(request.TransporteCep);
            transporteLog = request.TransporteLogradouro!.Trim();
            transporteNumero = request.TransporteNumero!.Trim();
            transporteComp = string.IsNullOrWhiteSpace(request.TransporteComplemento)
                ? null
                : request.TransporteComplemento.Trim();
            transporteBairro = request.TransporteBairro!.Trim();
            transporteCidade = request.TransporteCidade!.Trim();
            transporteUf = (request.TransporteUf ?? string.Empty).Trim().ToUpperInvariant();
        }

        var obsUsuario = string.IsNullOrWhiteSpace(request.ObservacoesComerciais)
            ? null
            : request.ObservacoesComerciais.Trim();

        return (true, null, new PreAlunoCadastroResolvido(
            request.Nome.Trim(),
            request.Sobrenome.Trim(),
            request.DataNascimento,
            idadeAnos,
            telAluno.Length >= 10 ? telAluno : null,
            request.LivroInteresseId,
            request.ValorMensalidade,
            request.ValorMaterial,
            tipoContrato,
            request.ValorMatricula,
            formaPgtoMatricula,
            origem,
            string.IsNullOrWhiteSpace(request.FormaPagamento) ? null : request.FormaPagamento.Trim(),
            request.UsaTransporteVan,
            transporteCep,
            transporteLog,
            transporteNumero,
            transporteComp,
            transporteBairro,
            transporteCidade,
            transporteUf,
            request.EProprioResponsavel,
            alunoCpf,
            tipoResp,
            nomeResp,
            sobrenomeResp,
            docResp,
            telResp,
            obsUsuario));
    }

    private static int CalcularIdadeAnos(DateOnly dataNascimento, DateOnly hoje)
    {
        var idade = hoje.Year - dataNascimento.Year;
        if (hoje.Month < dataNascimento.Month
            || (hoje.Month == dataNascimento.Month && hoje.Day < dataNascimento.Day))
            idade--;
        return idade;
    }

    private static string? NormalizarTipoPessoa(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        var v = value.Trim();
        if (v.Equals("Fisica", StringComparison.OrdinalIgnoreCase)
            || v.Equals("Pessoa Fisica", StringComparison.OrdinalIgnoreCase))
            return "Fisica";
        if (v.Equals("Juridica", StringComparison.OrdinalIgnoreCase)
            || v.Equals("Pessoa Juridica", StringComparison.OrdinalIgnoreCase))
            return "Juridica";
        return null;
    }

    private static string SomenteDigitos(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;
        return new string(value.Where(char.IsDigit).ToArray());
    }

    public static string? MesclarObservacoesPreservandoRecusa(string? atual, string? novoUsuario)
    {
        var recusa = new List<string>();
        if (!string.IsNullOrWhiteSpace(atual))
        {
            foreach (var line in atual.Split('\n', StringSplitOptions.RemoveEmptyEntries))
            {
                var t = line.Trim();
                if (t.StartsWith("[Recusado pela secretaria em", StringComparison.OrdinalIgnoreCase))
                    recusa.Add(t);
            }
        }

        var user = novoUsuario?.Trim();
        var partes = new List<string>(recusa);
        if (!string.IsNullOrWhiteSpace(user))
            partes.Add(user);

        return partes.Count == 0 ? null : string.Join("\n\n", partes);
    }
}
