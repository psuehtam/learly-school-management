using Learly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learly.Infrastructure.Data.Configurations;

public sealed class AulaConfiguration : IEntityTypeConfiguration<Aula>
{
    public void Configure(EntityTypeBuilder<Aula> builder)
    {
        builder.ToTable("aulas");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(a => a.EscolaId).HasColumnName("escola_id");
        builder.Property(a => a.TurmaId).HasColumnName("turma_id");
        builder.Property(a => a.CapituloId).HasColumnName("capitulo_id");
        builder.Property(a => a.ProfessorId).HasColumnName("professor_id");

        builder.Property(a => a.NumeroAula).HasColumnName("numero_aula");
        builder.Property(a => a.DataAula).HasColumnName("data_aula");
        builder.Property(a => a.HorarioInicio).HasColumnName("horario_inicio");
        builder.Property(a => a.HorarioFim).HasColumnName("horario_fim");

        builder.Property(a => a.ConteudoDado)
            .HasColumnName("conteudo_dado")
            .HasMaxLength(4000);

        builder.Property(a => a.TipoAula)
            .HasColumnName("tipo_aula")
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(a => a.Status)
            .HasColumnName("status")
            .HasMaxLength(32)
            .IsRequired();

        builder.HasOne<Escola>()
            .WithMany()
            .HasForeignKey(a => a.EscolaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Turma>()
            .WithMany()
            .HasForeignKey(a => a.TurmaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(a => a.ProfessorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
