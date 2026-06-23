using Learly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learly.Infrastructure.Data.Configurations;

public sealed class LivroPlanejamentoAlocacaoConfiguration : IEntityTypeConfiguration<LivroPlanejamentoAlocacao>
{
    public void Configure(EntityTypeBuilder<LivroPlanejamentoAlocacao> builder)
    {
        builder.ToTable("livros_planejamento_alocacoes", t => t.ExcludeFromMigrations());

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(a => a.EscolaId).HasColumnName("escola_id").IsRequired();
        builder.Property(a => a.DiaId).HasColumnName("dia_id").IsRequired();
        builder.Property(a => a.CapituloId).HasColumnName("capitulo_id").IsRequired();
        builder.Property(a => a.MinutosAlocados).HasColumnName("minutos_alocados").IsRequired();
        builder.Property(a => a.Ordem).HasColumnName("ordem").IsRequired();
        builder.Property(a => a.DataCriacao).HasColumnName("data_criacao");
        builder.Property(a => a.DataAtualizacao).HasColumnName("data_atualizacao");

        builder.HasIndex(a => a.EscolaId);
        builder.HasIndex(a => a.DiaId);
        builder.HasIndex(a => a.CapituloId);

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
