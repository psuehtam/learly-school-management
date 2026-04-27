using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Learly.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PerfisPermissoesTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "perfis_template",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    nome = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_perfis_template", x => x.id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "perfil_permissoes_template",
                columns: table => new
                {
                    perfil_template_id = table.Column<int>(type: "int", nullable: false),
                    permissao_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_perfil_permissoes_template", x => new { x.perfil_template_id, x.permissao_id });
                    table.ForeignKey(
                        name: "FK_perfil_permissoes_template_perfis_template_perfil_template_id",
                        column: x => x.perfil_template_id,
                        principalTable: "perfis_template",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_perfil_permissoes_template_permissoes_permissao_id",
                        column: x => x.permissao_id,
                        principalTable: "permissoes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_perfil_permissoes_template_permissao_id",
                table: "perfil_permissoes_template",
                column: "permissao_id");

            migrationBuilder.CreateIndex(
                name: "IX_perfis_template_nome",
                table: "perfis_template",
                column: "nome",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "perfil_permissoes_template");

            migrationBuilder.DropTable(
                name: "perfis_template");
        }
    }
}
