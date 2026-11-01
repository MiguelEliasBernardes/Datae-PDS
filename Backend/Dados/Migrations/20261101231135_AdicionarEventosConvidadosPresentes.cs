using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Backend.Dados.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarEventosConvidadosPresentes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Eventos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    PlanoAtualId = table.Column<int>(type: "integer", nullable: true),
                    Tipo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DataEvento = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    NomeEvento = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Local = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    SlugPublico = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CorPrincipal = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    CorSecundaria = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Eventos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Eventos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Convidados",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventoId = table.Column<int>(type: "integer", nullable: false),
                    Nome = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    StatusPresenca = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    QuantidadeAcompanhantes = table.Column<int>(type: "integer", nullable: false),
                    Observacao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Convidados", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Convidados_Eventos_EventoId",
                        column: x => x.EventoId,
                        principalTable: "Eventos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ItensPresente",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventoId = table.Column<int>(type: "integer", nullable: false),
                    ConvidadoId = table.Column<int>(type: "integer", nullable: true),
                    Nome = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ValorEstimado = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    LinkAfiliado = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Foto = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItensPresente", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItensPresente_Convidados_ConvidadoId",
                        column: x => x.ConvidadoId,
                        principalTable: "Convidados",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ItensPresente_Eventos_EventoId",
                        column: x => x.EventoId,
                        principalTable: "Eventos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Convidados_EventoId",
                table: "Convidados",
                column: "EventoId");

            migrationBuilder.CreateIndex(
                name: "IX_Eventos_SlugPublico",
                table: "Eventos",
                column: "SlugPublico",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Eventos_UsuarioId",
                table: "Eventos",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_ItensPresente_ConvidadoId",
                table: "ItensPresente",
                column: "ConvidadoId");

            migrationBuilder.CreateIndex(
                name: "IX_ItensPresente_EventoId",
                table: "ItensPresente",
                column: "EventoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ItensPresente");

            migrationBuilder.DropTable(
                name: "Convidados");

            migrationBuilder.DropTable(
                name: "Eventos");
        }
    }
}
