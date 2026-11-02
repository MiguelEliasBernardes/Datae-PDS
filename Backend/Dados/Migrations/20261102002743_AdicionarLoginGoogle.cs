using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Dados.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarLoginGoogle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "SenhaHash",
                table: "Usuarios",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "GoogleId",
                table: "Usuarios",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_GoogleId",
                table: "Usuarios",
                column: "GoogleId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Usuarios_GoogleId",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "GoogleId",
                table: "Usuarios");

            migrationBuilder.AlterColumn<string>(
                name: "SenhaHash",
                table: "Usuarios",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}
