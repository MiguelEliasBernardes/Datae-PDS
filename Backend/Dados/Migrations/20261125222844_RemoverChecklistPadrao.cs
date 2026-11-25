using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Dados.Migrations
{
    /// <inheritdoc />
    public partial class RemoverChecklistPadrao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // A checklist deixa de vir com tarefas padrão por tipo de evento: apaga todas as que vieram
            // do modelo (mesmo as concluídas). As criadas à mão ou pelo Roteiro com IA continuam
            migrationBuilder.Sql("DELETE FROM \"ItensChecklist\" WHERE \"Origem\" = 'Sugestao';");

            migrationBuilder.DropColumn(
                name: "ChaveSugestao",
                table: "ItensChecklist");

            migrationBuilder.DropColumn(
                name: "ChecklistCriadaEm",
                table: "Eventos");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ChaveSugestao",
                table: "ItensChecklist",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ChecklistCriadaEm",
                table: "Eventos",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
