using Learly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learly.Infrastructure.Data.Configurations;

public sealed class AulaCapituloAlocacaoConfiguration : IEntityTypeConfiguration<AulaCapituloAlocacao>
{
    public void Configure(EntityTypeBuilder<AulaCapituloAlocacao> builder)
    {
        builder.ToTable("aulas_capitulos_alocacao", t => t.ExcludeFromMigrations());

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(a => a.EscolaId).HasColumnName("escola_id").IsRequired();
        builder.Property(a => a.AulaId).HasColumnName("aula_id").IsRequired();
        builder.Property(a => a.CapituloId).HasColumnName("capitulo_id").IsRequired();
        builder.Property(a => a.MinutosAlocados).HasColumnName("minutos_alocados").IsRequired();
        builder.Property(a => a.Ordem).HasColumnName("ordem").IsRequired();
        builder.Property(a => a.DataCriacao).HasColumnName("data_criacao");

        builder.HasIndex(a => a.EscolaId);
        builder.HasIndex(a => a.AulaId);
        builder.HasIndex(a => a.CapituloId);

        builder.HasOne(a => a.Aula)
            .WithMany()
            .HasForeignKey(a => a.AulaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Capitulo)
            .WithMany()
            .HasForeignKey(a => a.CapituloId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Escola>()
            .WithMany()
            .HasForeignKey(a => a.EscolaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
