using Learly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learly.Infrastructure.Data.Configurations;

public sealed class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("usuarios");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(u => u.EscolaId).HasColumnName("escola_id");
        builder.Property(u => u.PerfilId).HasColumnName("perfil_id");

        builder.Property(u => u.NomeCompleto)
            .HasColumnName("nome_completo")
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(u => u.Email)
            .HasColumnName("email")
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(u => u.Senha)
            .HasColumnName("senha")
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(u => u.Status)
            .HasColumnName("status")
            .HasMaxLength(32)
            .IsRequired();

        builder.HasIndex(u => u.Email);

        builder.HasOne<Escola>()
            .WithMany()
            .HasForeignKey(u => u.EscolaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Perfil>()
            .WithMany()
            .HasForeignKey(u => u.PerfilId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
