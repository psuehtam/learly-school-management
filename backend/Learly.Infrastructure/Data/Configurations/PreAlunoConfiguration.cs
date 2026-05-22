using Learly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learly.Infrastructure.Data.Configurations;

public sealed class PreAlunoConfiguration : IEntityTypeConfiguration<PreAluno>
{
    public void Configure(EntityTypeBuilder<PreAluno> builder)
    {
        builder.ToTable("pre_alunos", t => t.ExcludeFromMigrations());

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(p => p.EscolaId).HasColumnName("escola_id");
        builder.Property(p => p.PreResponsavelId).HasColumnName("pre_responsavel_id");
        builder.Property(p => p.ResponsavelId).HasColumnName("responsavel_id");

        builder.Property(p => p.Nome).HasColumnName("nome").HasMaxLength(100).IsRequired();
        builder.Property(p => p.Sobrenome).HasColumnName("sobrenome").HasMaxLength(100).IsRequired();
        builder.Property(p => p.DataNascimento).HasColumnName("data_nascimento");
        builder.Property(p => p.Telefone).HasColumnName("telefone").HasMaxLength(20);
        builder.Property(p => p.LivroInteresseId).HasColumnName("livro_interesse_id");

        builder.Property(p => p.TipoContrato).HasColumnName("tipo_contrato").HasMaxLength(120).IsRequired();
        builder.Property(p => p.ValorMensalidade).HasColumnName("valor_mensalidade").HasPrecision(10, 2);
        builder.Property(p => p.FormaPagamento).HasColumnName("forma_pagamento").HasMaxLength(50);
        builder.Property(p => p.ValorMatricula).HasColumnName("valor_matricula").HasPrecision(10, 2);
        builder.Property(p => p.FormaPagamentoMatricula).HasColumnName("forma_pagamento_matricula").HasMaxLength(50);

        builder.Property(p => p.ValorMaterial).HasColumnName("valor_material").HasPrecision(10, 2);

        builder.Property(p => p.OrigemCaptacao).HasColumnName("origem_captacao").HasMaxLength(80).IsRequired();

        builder.Property(p => p.UsaTransporteVan).HasColumnName("usa_transporte_van");
        builder.Property(p => p.TransporteCep).HasColumnName("transporte_cep").HasMaxLength(9);
        builder.Property(p => p.TransporteLogradouro).HasColumnName("transporte_logradouro").HasMaxLength(200);
        builder.Property(p => p.TransporteNumero).HasColumnName("transporte_numero").HasMaxLength(20);
        builder.Property(p => p.TransporteComplemento).HasColumnName("transporte_complemento").HasMaxLength(120);
        builder.Property(p => p.TransporteBairro).HasColumnName("transporte_bairro").HasMaxLength(100);
        builder.Property(p => p.TransporteCidade).HasColumnName("transporte_cidade").HasMaxLength(100);
        builder.Property(p => p.TransporteUf).HasColumnName("transporte_uf").HasMaxLength(2);

        builder.Property(p => p.ObservacoesComerciais).HasColumnName("observacoes_comerciais").HasColumnType("text");
        builder.Property(p => p.EProprioResponsavel).HasColumnName("e_proprio_responsavel");
        builder.Property(p => p.AlunoCpf).HasColumnName("aluno_cpf").HasMaxLength(14);

        builder.Property(p => p.Status)
            .HasColumnName("status")
            .HasColumnType("enum('Em negociacao', 'Aguardando aprovacao', 'Aprovado', 'Matriculado', 'Cancelado')")
            .IsRequired();

        builder.Property(p => p.AlunoId).HasColumnName("aluno_id");
        builder.Property(p => p.CriadoPorUsuarioId).HasColumnName("criado_por_usuario_id");
        builder.Property(p => p.DataCriacao).HasColumnName("data_criacao");
        builder.Property(p => p.DataAtualizacao).HasColumnName("data_atualizacao");

        builder.HasIndex(p => new { p.EscolaId, p.Status });
    }
}
