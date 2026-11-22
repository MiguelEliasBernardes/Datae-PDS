using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Dados.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarAssistenteIa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GeracoesIa",
                table: "Formandos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "GeracoesIa",
                table: "Eventos",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GeracoesIa",
                table: "Formandos");

            migrationBuilder.DropColumn(
                name: "GeracoesIa",
                table: "Eventos");
        }
    }
}
