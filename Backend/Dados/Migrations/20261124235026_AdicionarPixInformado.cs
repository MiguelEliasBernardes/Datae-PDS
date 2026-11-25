using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Backend.Dados.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarPixInformado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PixInformados",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventoId = table.Column<int>(type: "integer", nullable: false),
                    ConvidadoId = table.Column<int>(type: "integer", nullable: true),
                    NomeConvidado = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    CotaPresenteId = table.Column<int>(type: "integer", nullable: true),
                    FormandoId = table.Column<int>(type: "integer", nullable: true),
                    Valor = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    Recado = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Conferido = table.Column<bool>(type: "boolean", nullable: false),
                    ConferidoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    InformadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PixInformados", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PixInformados_Convidados_ConvidadoId",
                        column: x => x.ConvidadoId,
                        principalTable: "Convidados",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PixInformados_CotasPresente_CotaPresenteId",
                        column: x => x.CotaPresenteId,
                        principalTable: "CotasPresente",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PixInformados_Eventos_EventoId",
                        column: x => x.EventoId,
                        principalTable: "Eventos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PixInformados_Formandos_FormandoId",
                        column: x => x.FormandoId,
                        principalTable: "Formandos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PixInformados_ConvidadoId",
                table: "PixInformados",
                column: "ConvidadoId");

            migrationBuilder.CreateIndex(
                name: "IX_PixInformados_CotaPresenteId",
                table: "PixInformados",
                column: "CotaPresenteId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PixInformados_EventoId",
                table: "PixInformados",
                column: "EventoId");

            migrationBuilder.CreateIndex(
                name: "IX_PixInformados_FormandoId",
                table: "PixInformados",
                column: "FormandoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PixInformados");
        }
    }
}
