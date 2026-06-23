using Learly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learly.Infrastructure.Data.Configurations;

public sealed class LivroPlanejamentoDiaConfiguration : IEntityTypeConfiguration<LivroPlanejamentoDia>
{
    public void Configure(EntityTypeBuilder<LivroPlanejamentoDia> builder)
    {
        builder.ToTable("livros_planejamento_dias", t => t.ExcludeFromMigrations());

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(d => d.EscolaId).HasColumnName("escola_id").IsRequired();
        builder.Property(d => d.LivroId).HasColumnName("livro_id").IsRequired();
        builder.Property(d => d.Ordem).HasColumnName("ordem").IsRequired();
        builder.Property(d => d.DataCriacao).HasColumnName("data_criacao");
        builder.Property(d => d.DataAtualizacao).HasColumnName("data_atualizacao");

        builder.HasIndex(d => new { d.LivroId, d.Ordem }).IsUnique();
        builder.HasIndex(d => d.EscolaId);

        builder.HasOne(d => d.Livro)
            .WithMany()
            .HasForeignKey(d => d.LivroId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Escola>()
            .WithMany()
            .HasForeignKey(d => d.EscolaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(d => d.Alocacoes)
            .WithOne(a => a.Dia)
            .HasForeignKey(a => a.DiaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
