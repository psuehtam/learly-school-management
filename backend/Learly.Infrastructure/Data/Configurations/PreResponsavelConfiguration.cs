using Learly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learly.Infrastructure.Data.Configurations;

public sealed class PreResponsavelConfiguration : IEntityTypeConfiguration<PreResponsavel>
{
    public void Configure(EntityTypeBuilder<PreResponsavel> builder)
    {
        builder.ToTable("pre_responsaveis", t => t.ExcludeFromMigrations());

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(r => r.EscolaId).HasColumnName("escola_id");
        builder.Property(r => r.TipoPessoa).HasColumnName("tipo_pessoa").HasMaxLength(20).IsRequired();
        builder.Property(r => r.CpfCnpj).HasColumnName("cpf_cnpj").HasMaxLength(20).IsRequired();
        builder.Property(r => r.Nome).HasColumnName("nome").HasMaxLength(100).IsRequired();
        builder.Property(r => r.Sobrenome).HasColumnName("sobrenome").HasMaxLength(100).IsRequired();
        builder.Property(r => r.Telefone).HasColumnName("telefone").HasMaxLength(20);
        builder.Property(r => r.GrauParentesco).HasColumnName("grau_parentesco").HasMaxLength(30);
        builder.Property(r => r.Sexo).HasColumnName("sexo").HasMaxLength(20);
        builder.Property(r => r.EstadoCivil).HasColumnName("estado_civil").HasMaxLength(30);
        builder.Property(r => r.DataNascimento).HasColumnName("data_nascimento");
        builder.Property(r => r.CorRaca).HasColumnName("cor_raca").HasMaxLength(30);
        builder.Property(r => r.Nacionalidade).HasColumnName("nacionalidade").HasMaxLength(50);
        builder.Property(r => r.NaturalidadeCidade).HasColumnName("naturalidade_cidade").HasMaxLength(100);
        builder.Property(r => r.NaturalidadeEstado).HasColumnName("naturalidade_estado").HasMaxLength(2);
        builder.Property(r => r.RgNumero).HasColumnName("rg_numero").HasMaxLength(50);
        builder.Property(r => r.RgExpedicao).HasColumnName("rg_expedicao");
        builder.Property(r => r.RgOrgao).HasColumnName("rg_orgao").HasMaxLength(20);
        builder.Property(r => r.Cep).HasColumnName("cep").HasMaxLength(10);
        builder.Property(r => r.TipoLogradouro).HasColumnName("tipo_logradouro").HasMaxLength(20);
        builder.Property(r => r.Logradouro).HasColumnName("logradouro").HasMaxLength(150);
        builder.Property(r => r.Numero).HasColumnName("numero").HasMaxLength(20);
        builder.Property(r => r.Complemento).HasColumnName("complemento").HasMaxLength(100);
        builder.Property(r => r.Bairro).HasColumnName("bairro").HasMaxLength(100);
        builder.Property(r => r.Municipio).HasColumnName("municipio").HasMaxLength(100);
        builder.Property(r => r.ResponsavelConvertidoId).HasColumnName("responsavel_convertido_id");
        builder.Property(r => r.Status)
            .HasColumnName("status")
            .HasColumnType(
                "enum('Em negociacao','Aguardando aprovacao','Aprovado','Recusado','Cancelado','Convertido')")
            .IsRequired();
        builder.Property(r => r.DataCriacao).HasColumnName("data_criacao");
        builder.Property(r => r.DataAtualizacao).HasColumnName("data_atualizacao");

        builder.HasIndex(r => new { r.EscolaId, r.CpfCnpj });
    }
}
