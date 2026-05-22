using Learly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learly.Infrastructure.Data.Configurations;

public sealed class PreAlunoDocumentoConfiguration : IEntityTypeConfiguration<PreAlunoDocumento>
{
    public void Configure(EntityTypeBuilder<PreAlunoDocumento> builder)
    {
        builder.ToTable("pre_aluno_documentos");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(d => d.EscolaId).HasColumnName("escola_id");
        builder.Property(d => d.PreAlunoId).HasColumnName("pre_aluno_id");
        builder.Property(d => d.TipoCodigo).HasColumnName("tipo_codigo").HasMaxLength(50).IsRequired();
        builder.Property(d => d.NomeExibicao).HasColumnName("nome_exibicao").HasMaxLength(120).IsRequired();
        builder.Property(d => d.NomeArquivoOriginal).HasColumnName("nome_arquivo_original").HasMaxLength(255).IsRequired();
        builder.Property(d => d.CaminhoRelativo).HasColumnName("caminho_relativo").HasMaxLength(500).IsRequired();
        builder.Property(d => d.ContentType).HasColumnName("content_type").HasMaxLength(100);
        builder.Property(d => d.TamanhoBytes).HasColumnName("tamanho_bytes");
        builder.Property(d => d.EnviadoPorUsuarioId).HasColumnName("enviado_por_usuario_id");
        builder.Property(d => d.DataUpload).HasColumnName("data_upload");

        builder.HasIndex(d => new { d.PreAlunoId, d.TipoCodigo }).IsUnique();
        builder.HasIndex(d => new { d.EscolaId, d.PreAlunoId });
    }
}
