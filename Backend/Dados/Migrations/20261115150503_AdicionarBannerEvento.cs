using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Dados.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarBannerEvento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Banner",
                table: "Eventos",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Banner",
                table: "Eventos");
        }
    }
}
