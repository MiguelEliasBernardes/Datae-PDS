using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Dados.Migrations
{
    /// <inheritdoc />
    public partial class FotoPresenteComoArquivo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // A foto deixa de ser um link de outro site e passa a ser um arquivo enviado (nome gerado no servidor):
            // os links antigos são apagados, e esses presentes passam a mostrar a cor do evento
            migrationBuilder.Sql("UPDATE \"ItensPresente\" SET \"Foto\" = NULL;");

            migrationBuilder.AlterColumn<string>(
                name: "Foto",
                table: "ItensPresente",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Foto",
                table: "ItensPresente",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(64)",
                oldMaxLength: 64,
                oldNullable: true);
        }
    }
}
