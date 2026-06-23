using Learly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learly.Infrastructure.Data.Configurations;

public sealed class CapituloConfiguration : IEntityTypeConfiguration<Capitulo>
{
    public void Configure(EntityTypeBuilder<Capitulo> builder)
    {
        builder.ToTable("capitulos", t => t.ExcludeFromMigrations());

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(c => c.EscolaId).HasColumnName("escola_id");
        builder.Property(c => c.LivroId).HasColumnName("livro_id");
        builder.Property(c => c.Nome).HasColumnName("nome").HasMaxLength(100).IsRequired();
        builder.Property(c => c.DuracaoMinutos).HasColumnName("duracao_minutos").IsRequired();
        builder.Property(c => c.Status)
            .HasColumnName("status")
            .HasColumnType("enum('Ativo', 'Inativo')")
            .HasDefaultValue("Ativo");

        builder.Property(c => c.DataCriacao).HasColumnName("data_criacao");
        builder.Property(c => c.DataAtualizacao).HasColumnName("data_atualizacao");

        builder.HasIndex(c => new { c.EscolaId, c.LivroId });

        builder.HasOne(c => c.Livro)
            .WithMany(l => l.Capitulos)
            .HasForeignKey(c => c.LivroId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Escola>()
            .WithMany()
            .HasForeignKey(c => c.EscolaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
