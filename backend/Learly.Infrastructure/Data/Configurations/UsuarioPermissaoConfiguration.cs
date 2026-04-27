using Learly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learly.Infrastructure.Data.Configurations;

public sealed class UsuarioPermissaoConfiguration : IEntityTypeConfiguration<UsuarioPermissao>
{
    public void Configure(EntityTypeBuilder<UsuarioPermissao> builder)
    {
        builder.ToTable("usuario_permissoes");

        builder.HasKey(up => new { up.UsuarioId, up.PermissaoId });

        builder.Property(up => up.UsuarioId).HasColumnName("usuario_id");
        builder.Property(up => up.PermissaoId).HasColumnName("permissao_id");
        builder.Property(up => up.ConcedidoPorUsuarioId).HasColumnName("concedido_por_usuario_id");

        builder.Property(up => up.DataConcessao)
            .HasColumnName("data_concessao")
            .IsRequired();

        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(up => up.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Permissao>()
            .WithMany()
            .HasForeignKey(up => up.PermissaoId)
            .OnDelete(DeleteBehavior.Cascade);

        // concedido_por_usuario_id: coluna mapeada sem segundo relacionamento explícito com Usuario
        // (evita ambiguidade no modelo sem propriedades de navegação).
    }
}
