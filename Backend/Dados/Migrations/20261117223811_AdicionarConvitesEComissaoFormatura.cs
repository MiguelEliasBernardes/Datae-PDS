using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Dados.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarConvitesEComissaoFormatura : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Formandos_EventoId",
                table: "Formandos");

            migrationBuilder.AddColumn<int>(
                name: "FormandoId",
                table: "ItensPresente",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CodigoConvite",
                table: "Formandos",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Mensagem",
                table: "Formandos",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "Formandos",
                type: "character varying(130)",
                maxLength: 130,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "UsuarioId",
                table: "Formandos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CodigoTurma",
                table: "Eventos",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            // Formandos que já existiam ganham endereço e convite antes dos índices únicos
            // (o organizador pode gerar outro código depois, se quiser)
            migrationBuilder.Sql("""
                UPDATE "Formandos"
                SET "Slug" = 'formando-' || "Id",
                    "CodigoConvite" = upper(substr(md5(random()::text || "Id"::text), 1, 8))
                WHERE "Slug" = '';
                """);

            migrationBuilder.CreateIndex(
                name: "IX_ItensPresente_FormandoId",
                table: "ItensPresente",
                column: "FormandoId");

            migrationBuilder.CreateIndex(
                name: "IX_Formandos_CodigoConvite",
                table: "Formandos",
                column: "CodigoConvite",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Formandos_EventoId_Slug",
                table: "Formandos",
                columns: new[] { "EventoId", "Slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Formandos_EventoId_UsuarioId",
                table: "Formandos",
                columns: new[] { "EventoId", "UsuarioId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Formandos_UsuarioId",
                table: "Formandos",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Eventos_CodigoTurma",
                table: "Eventos",
                column: "CodigoTurma",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Formandos_Usuarios_UsuarioId",
                table: "Formandos",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ItensPresente_Formandos_FormandoId",
                table: "ItensPresente",
                column: "FormandoId",
                principalTable: "Formandos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Formandos_Usuarios_UsuarioId",
                table: "Formandos");

            migrationBuilder.DropForeignKey(
                name: "FK_ItensPresente_Formandos_FormandoId",
                table: "ItensPresente");

            migrationBuilder.DropIndex(
                name: "IX_ItensPresente_FormandoId",
                table: "ItensPresente");

            migrationBuilder.DropIndex(
                name: "IX_Formandos_CodigoConvite",
                table: "Formandos");

            migrationBuilder.DropIndex(
                name: "IX_Formandos_EventoId_Slug",
                table: "Formandos");

            migrationBuilder.DropIndex(
                name: "IX_Formandos_EventoId_UsuarioId",
                table: "Formandos");

            migrationBuilder.DropIndex(
                name: "IX_Formandos_UsuarioId",
                table: "Formandos");

            migrationBuilder.DropIndex(
                name: "IX_Eventos_CodigoTurma",
                table: "Eventos");

            migrationBuilder.DropColumn(
                name: "FormandoId",
                table: "ItensPresente");

            migrationBuilder.DropColumn(
                name: "CodigoConvite",
                table: "Formandos");

            migrationBuilder.DropColumn(
                name: "Mensagem",
                table: "Formandos");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "Formandos");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Formandos");

            migrationBuilder.DropColumn(
                name: "CodigoTurma",
                table: "Eventos");

            migrationBuilder.CreateIndex(
                name: "IX_Formandos_EventoId",
                table: "Formandos",
                column: "EventoId");
        }
    }
}
