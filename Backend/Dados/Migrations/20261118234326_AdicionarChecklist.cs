using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Backend.Dados.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarChecklist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ChecklistCriadaEm",
                table: "Eventos",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ItensChecklist",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventoId = table.Column<int>(type: "integer", nullable: false),
                    Titulo = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Categoria = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DiasAntes = table.Column<int>(type: "integer", nullable: true),
                    Concluido = table.Column<bool>(type: "boolean", nullable: false),
                    ConcluidoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Origem = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ChaveSugestao = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    ResponsavelFormandoId = table.Column<int>(type: "integer", nullable: true),
                    Ordem = table.Column<int>(type: "integer", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItensChecklist", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItensChecklist_Eventos_EventoId",
                        column: x => x.EventoId,
                        principalTable: "Eventos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ItensChecklist_Formandos_ResponsavelFormandoId",
                        column: x => x.ResponsavelFormandoId,
                        principalTable: "Formandos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ItensChecklist_EventoId",
                table: "ItensChecklist",
                column: "EventoId");

            migrationBuilder.CreateIndex(
                name: "IX_ItensChecklist_ResponsavelFormandoId",
                table: "ItensChecklist",
                column: "ResponsavelFormandoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ItensChecklist");

            migrationBuilder.DropColumn(
                name: "ChecklistCriadaEm",
                table: "Eventos");
        }
    }
}
