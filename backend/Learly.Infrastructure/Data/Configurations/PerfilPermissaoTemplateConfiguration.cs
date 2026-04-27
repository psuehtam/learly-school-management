using Learly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learly.Infrastructure.Data.Configurations;

public sealed class PerfilPermissaoTemplateConfiguration : IEntityTypeConfiguration<PerfilPermissaoTemplate>
{
    public void Configure(EntityTypeBuilder<PerfilPermissaoTemplate> builder)
    {
        builder.ToTable("perfil_permissoes_template");

        builder.HasKey(pp => new { pp.PerfilTemplateId, pp.PermissaoId });

        builder.Property(pp => pp.PerfilTemplateId).HasColumnName("perfil_template_id");
        builder.Property(pp => pp.PermissaoId).HasColumnName("permissao_id");

        builder.HasOne<PerfilTemplate>()
            .WithMany()
            .HasForeignKey(pp => pp.PerfilTemplateId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Permissao>()
            .WithMany()
            .HasForeignKey(pp => pp.PermissaoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
