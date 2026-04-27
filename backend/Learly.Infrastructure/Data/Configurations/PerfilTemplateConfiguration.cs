using Learly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learly.Infrastructure.Data.Configurations;

public sealed class PerfilTemplateConfiguration : IEntityTypeConfiguration<PerfilTemplate>
{
    public void Configure(EntityTypeBuilder<PerfilTemplate> builder)
    {
        builder.ToTable("perfis_template");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(p => p.Nome)
            .HasColumnName("nome")
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(p => p.Nome).IsUnique();
    }
}
