using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Dados.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarPosEvento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MensagemAgradecimento",
                table: "Eventos",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResumoEnviadoEm",
                table: "Eventos",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AgradecimentoEmailEm",
                table: "Convidados",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AgradecimentoWhatsAppEm",
                table: "Convidados",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Telefone",
                table: "Convidados",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            // Eventos que já aconteceram não recebem o resumo automático atrasado
            migrationBuilder.Sql("UPDATE \"Eventos\" SET \"ResumoEnviadoEm\" = now() WHERE \"DataEvento\" < now();");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MensagemAgradecimento",
                table: "Eventos");

            migrationBuilder.DropColumn(
                name: "ResumoEnviadoEm",
                table: "Eventos");

            migrationBuilder.DropColumn(
                name: "AgradecimentoEmailEm",
                table: "Convidados");

            migrationBuilder.DropColumn(
                name: "AgradecimentoWhatsAppEm",
                table: "Convidados");

            migrationBuilder.DropColumn(
                name: "Telefone",
                table: "Convidados");
        }
    }
}
