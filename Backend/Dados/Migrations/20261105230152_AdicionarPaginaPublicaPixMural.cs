using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Backend.Dados.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarPaginaPublicaPixMural : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodigoReserva",
                table: "ItensPresente",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChavePix",
                table: "Eventos",
                type: "character varying(77)",
                maxLength: 77,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CidadePix",
                table: "Eventos",
                type: "character varying(15)",
                maxLength: 15,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomeRecebedorPix",
                table: "Eventos",
                type: "character varying(25)",
                maxLength: 25,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "FotosMural",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventoId = table.Column<int>(type: "integer", nullable: false),
                    NomeAutor = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    Arquivo = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    EnviadaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FotosMural", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FotosMural_Eventos_EventoId",
                        column: x => x.EventoId,
                        principalTable: "Eventos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FotosMural_EventoId",
                table: "FotosMural",
                column: "EventoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FotosMural");

            migrationBuilder.DropColumn(
                name: "CodigoReserva",
                table: "ItensPresente");

            migrationBuilder.DropColumn(
                name: "ChavePix",
                table: "Eventos");

            migrationBuilder.DropColumn(
                name: "CidadePix",
                table: "Eventos");

            migrationBuilder.DropColumn(
                name: "NomeRecebedorPix",
                table: "Eventos");
        }
    }
}
