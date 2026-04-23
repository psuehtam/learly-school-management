using Learly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learly.Infrastructure.Data.Configurations;

public sealed class TurmaConfiguration : IEntityTypeConfiguration<Turma>
{
    public void Configure(EntityTypeBuilder<Turma> builder)
    {
        builder.ToTable("turmas");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(t => t.EscolaId).HasColumnName("escola_id");
        builder.Property(t => t.ProfessorId).HasColumnName("professor_id");
        builder.Property(t => t.LivroId).HasColumnName("livro_id");

        builder.Property(t => t.Nome)
            .HasColumnName("nome")
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(t => t.Sala)
            .HasColumnName("sala")
            .HasMaxLength(64);

        builder.Property(t => t.Horario).HasColumnName("horario");
        builder.Property(t => t.DataInicio).HasColumnName("data_inicio");
        builder.Property(t => t.DataTerminoPrevista).HasColumnName("data_termino_prevista");

        builder.Property(t => t.Observacoes)
            .HasColumnName("observacoes")
            .HasMaxLength(2000);

        builder.Property(t => t.Status)
            .HasColumnName("status")
            .HasMaxLength(64)
            .IsRequired();

        builder.HasOne<Escola>()
            .WithMany()
            .HasForeignKey(t => t.EscolaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(t => t.ProfessorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
