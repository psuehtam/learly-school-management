using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Learly.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PreAlunoDocumentosModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "e_proprio_responsavel",
                table: "pre_alunos",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "aluno_cpf",
                table: "pre_alunos",
                type: "varchar(14)",
                maxLength: 14,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "pre_aluno_documentos",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    escola_id = table.Column<int>(type: "int", nullable: false),
                    pre_aluno_id = table.Column<int>(type: "int", nullable: false),
                    tipo_codigo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nome_exibicao = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nome_arquivo_original = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    caminho_relativo = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    content_type = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    tamanho_bytes = table.Column<long>(type: "bigint", nullable: false),
                    enviado_por_usuario_id = table.Column<int>(type: "int", nullable: false),
                    data_upload = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pre_aluno_documentos", x => x.id);
                    table.ForeignKey(
                        name: "FK_pre_aluno_documentos_escolas_escola_id",
                        column: x => x.escola_id,
                        principalTable: "escolas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_pre_aluno_documentos_pre_alunos_pre_aluno_id",
                        column: x => x.pre_aluno_id,
                        principalTable: "pre_alunos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_pre_aluno_documentos_usuarios_enviado_por_usuario_id",
                        column: x => x.enviado_por_usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_pre_aluno_documentos_escola_id_pre_aluno_id",
                table: "pre_aluno_documentos",
                columns: new[] { "escola_id", "pre_aluno_id" });

            migrationBuilder.CreateIndex(
                name: "IX_pre_aluno_documentos_pre_aluno_id_tipo_codigo",
                table: "pre_aluno_documentos",
                columns: new[] { "pre_aluno_id", "tipo_codigo" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "pre_aluno_documentos");

            migrationBuilder.DropColumn(name: "aluno_cpf", table: "pre_alunos");
            migrationBuilder.DropColumn(name: "e_proprio_responsavel", table: "pre_alunos");
        }
    }
}
