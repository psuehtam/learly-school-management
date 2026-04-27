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

        builder.Property(e => e.Status)
            .HasColumnName("status")
            .HasMaxLength(32)
            .IsRequired();

        builder.HasIndex(e => e.CodigoEscola).IsUnique();
    }
}
