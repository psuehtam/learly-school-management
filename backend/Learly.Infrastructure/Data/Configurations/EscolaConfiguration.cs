using Learly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learly.Infrastructure.Data.Configurations;

public sealed class EscolaConfiguration : IEntityTypeConfiguration<Escola>
{
    public void Configure(EntityTypeBuilder<Escola> builder)
    {
        builder.ToTable("escolas");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(e => e.CodigoEscola)
            .HasColumnName("codigo_escola")
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(e => e.NomeFantasia)
            .HasColumnName("nome_fantasia")
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(e => e.RazaoSocial)
            .HasColumnName("razao_social")
            .HasMaxLength(256);

        builder.Property(e => e.Cnpj)
            .HasColumnName("cnpj")
            .HasMaxLength(14);

        builder.Property(e => e.MinAlunosTurma)
            .HasColumnName("min_alunos_turma")
            .HasDefaultValue(3)
            .IsRequired();

        builder.Property(e => e.MaxAlunosTurma)
            .HasColumnName("max_alunos_turma");

        builder.Property(e => e.MetricaAula)
            .HasColumnName("metrica_aula")
            .HasColumnType("enum('POR_DIA','POR_HORA')")
            .HasDefaultValue("POR_DIA")
            .IsRequired();

        builder.Property(e => e.DuracaoAulaMinutos)
            .HasColumnName("duracao_aula_minutos")
            .HasDefaultValue(120)
            .IsRequired();

        builder.Property(e => e.Cep)
            .HasColumnName("cep")
            .HasMaxLength(8);

        builder.Property(e => e.Logradouro)
            .HasColumnName("logradouro")
            .HasMaxLength(200);

        builder.Property(e => e.Numero)
            .HasColumnName("numero")
            .HasMaxLength(20);

        builder.Property(e => e.Complemento)
            .HasColumnName("complemento")
            .HasMaxLength(100);

        builder.Property(e => e.Bairro)
            .HasColumnName("bairro")
            .HasMaxLength(100);

        builder.Property(e => e.Cidade)
            .HasColumnName("cidade")
            .HasMaxLength(100);

        builder.Property(e => e.Uf)
            .HasColumnName("uf")
            .HasMaxLength(2);

        builder.Property(e => e.LogoCaminho)
            .HasColumnName("logo_caminho")
            .HasMaxLength(500);

        builder.Property(e => e.Status)
            .HasColumnName("status")
            .HasMaxLength(32)
            .IsRequired();

        builder.HasIndex(e => e.CodigoEscola).IsUnique();
    }
}
