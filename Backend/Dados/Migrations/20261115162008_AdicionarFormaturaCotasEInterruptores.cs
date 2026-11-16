using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Backend.Dados.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarFormaturaCotasEInterruptores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CotasVendidas",
                table: "ItensPresente",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "QuantidadeCotas",
                table: "ItensPresente",
                type: "integer",
                nullable: true);

            // Eventos que já existiam continuam com a lista de presentes e o mural ativos
            migrationBuilder.AddColumn<bool>(
                name: "ListaPresentesAtiva",
                table: "Eventos",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "MuralAtivo",
                table: "Eventos",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.CreateTable(
                name: "CotasPresente",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ItemPresenteId = table.Column<int>(type: "integer", nullable: false),
                    ConvidadoId = table.Column<int>(type: "integer", nullable: true),
                    NomeConvidado = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Quantidade = table.Column<int>(type: "integer", nullable: false),
                    Valor = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CotasPresente", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CotasPresente_Convidados_ConvidadoId",
                        column: x => x.ConvidadoId,
                        principalTable: "Convidados",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CotasPresente_ItensPresente_ItemPresenteId",
                        column: x => x.ItemPresenteId,
                        principalTable: "ItensPresente",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Despesas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventoId = table.Column<int>(type: "integer", nullable: false),
                    Descricao = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Valor = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    Data = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Despesas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Despesas_Eventos_EventoId",
                        column: x => x.EventoId,
                        principalTable: "Eventos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Formandos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventoId = table.Column<int>(type: "integer", nullable: false),
                    Nome = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Papel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Formandos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Formandos_Eventos_EventoId",
                        column: x => x.EventoId,
                        principalTable: "Eventos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PagamentosFormando",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FormandoId = table.Column<int>(type: "integer", nullable: false),
                    Valor = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    PagoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Observacao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PagamentosFormando", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PagamentosFormando_Formandos_FormandoId",
                        column: x => x.FormandoId,
                        principalTable: "Formandos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CotasPresente_ConvidadoId",
                table: "CotasPresente",
                column: "ConvidadoId");

            migrationBuilder.CreateIndex(
                name: "IX_CotasPresente_ItemPresenteId",
                table: "CotasPresente",
                column: "ItemPresenteId");

            migrationBuilder.CreateIndex(
                name: "IX_Despesas_EventoId",
                table: "Despesas",
                column: "EventoId");

            migrationBuilder.CreateIndex(
                name: "IX_Formandos_EventoId",
                table: "Formandos",
                column: "EventoId");

            migrationBuilder.CreateIndex(
                name: "IX_PagamentosFormando_FormandoId",
                table: "PagamentosFormando",
                column: "FormandoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CotasPresente");

            migrationBuilder.DropTable(
                name: "Despesas");

            migrationBuilder.DropTable(
                name: "PagamentosFormando");

            migrationBuilder.DropTable(
                name: "Formandos");

            migrationBuilder.DropColumn(
                name: "CotasVendidas",
                table: "ItensPresente");

            migrationBuilder.DropColumn(
                name: "QuantidadeCotas",
                table: "ItensPresente");

            migrationBuilder.DropColumn(
                name: "ListaPresentesAtiva",
                table: "Eventos");

            migrationBuilder.DropColumn(
                name: "MuralAtivo",
                table: "Eventos");
        }
    }
}
