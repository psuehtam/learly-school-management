using Learly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learly.Infrastructure.Data.Configurations;

public sealed class PerfilPermissaoConfiguration : IEntityTypeConfiguration<PerfilPermissao>
{
    public void Configure(EntityTypeBuilder<PerfilPermissao> builder)
    {
        builder.ToTable("perfil_permissoes");

        builder.HasKey(pp => new { pp.PerfilId, pp.PermissaoId });

        builder.Property(pp => pp.PerfilId).HasColumnName("perfil_id");
        builder.Property(pp => pp.PermissaoId).HasColumnName("permissao_id");

        builder.HasOne<Perfil>()
            .WithMany()
            .HasForeignKey(pp => pp.PerfilId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Permissao>()
            .WithMany()
            .HasForeignKey(pp => pp.PermissaoId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
