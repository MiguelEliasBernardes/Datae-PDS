using Backend.Modelos;
using Microsoft.EntityFrameworkCore;

namespace Backend.Dados;

public class ContextoBanco(DbContextOptions<ContextoBanco> opcoes) : DbContext(opcoes)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Evento> Eventos => Set<Evento>();
    public DbSet<Convidado> Convidados => Set<Convidado>();
    public DbSet<ItemPresente> ItensPresente => Set<ItemPresente>();
    public DbSet<FotoMural> FotosMural => Set<FotoMural>();
    public DbSet<CotaPresente> CotasPresente => Set<CotaPresente>();
    public DbSet<Formando> Formandos => Set<Formando>();
    public DbSet<Despesa> Despesas => Set<Despesa>();
    public DbSet<PagamentoFormando> PagamentosFormando => Set<PagamentoFormando>();
    public DbSet<ItemChecklist> ItensChecklist => Set<ItemChecklist>();
    public DbSet<PixInformado> PixInformados => Set<PixInformado>();
    public DbSet<CoOrganizador> CoOrganizadores => Set<CoOrganizador>();

    protected override void OnModelCreating(ModelBuilder modelo)
    {
        modelo.Entity<Usuario>(usuario =>
        {
            usuario.HasIndex(u => u.Email).IsUnique();
            usuario.HasIndex(u => u.GoogleId).IsUnique();
            usuario.Property(u => u.Nome).HasMaxLength(120).IsRequired();
            usuario.Property(u => u.Email).HasMaxLength(200).IsRequired();
            usuario.Property(u => u.GoogleId).HasMaxLength(64);
        });

        modelo.Entity<Evento>(evento =>
        {
            // Excluir o usuário exclui os eventos dele
            evento.HasOne<Usuario>().WithMany().HasForeignKey(e => e.UsuarioId).OnDelete(DeleteBehavior.Cascade);

            evento.HasIndex(e => e.SlugPublico).IsUnique();
            evento.Property(e => e.Tipo).HasConversion<string>().HasMaxLength(30);
            evento.Property(e => e.NomeEvento).HasMaxLength(150).IsRequired();
            evento.Property(e => e.Local).HasMaxLength(250);
            evento.Property(e => e.SlugPublico).HasMaxLength(160).IsRequired();
            evento.Property(e => e.Descricao).HasMaxLength(2000);
            evento.Property(e => e.CorPrincipal).HasMaxLength(7);
            evento.Property(e => e.CorSecundaria).HasMaxLength(7);
            evento.Property(e => e.Banner).HasMaxLength(64);
            evento.Property(e => e.ChavePix).HasMaxLength(77);
            evento.Property(e => e.NomeRecebedorPix).HasMaxLength(25);
            evento.Property(e => e.CidadePix).HasMaxLength(15);
            evento.HasIndex(e => e.CodigoTurma).IsUnique();
            evento.Property(e => e.CodigoTurma).HasMaxLength(16);
            evento.HasIndex(e => e.CodigoOrganizacao).IsUnique();
            evento.Property(e => e.CodigoOrganizacao).HasMaxLength(16);
            evento.Property(e => e.MensagemAgradecimento).HasMaxLength(1000);
        });

        modelo.Entity<Convidado>(convidado =>
        {
            // Excluir o evento exclui os convidados dele
            convidado.HasOne<Evento>().WithMany().HasForeignKey(c => c.EventoId).OnDelete(DeleteBehavior.Cascade);

            convidado.Property(c => c.Nome).HasMaxLength(120).IsRequired();
            convidado.Property(c => c.Email).HasMaxLength(200);
            convidado.Property(c => c.Telefone).HasMaxLength(16);
            convidado.Property(c => c.StatusPresenca).HasConversion<string>().HasMaxLength(20);
            convidado.Property(c => c.Observacao).HasMaxLength(500);
        });

        modelo.Entity<ItemPresente>(presente =>
        {
            // Excluir o evento exclui os presentes; excluir o convidado só libera o presente
            presente.HasOne<Evento>().WithMany().HasForeignKey(p => p.EventoId).OnDelete(DeleteBehavior.Cascade);
            presente.HasOne<Convidado>().WithMany().HasForeignKey(p => p.ConvidadoId).OnDelete(DeleteBehavior.SetNull);
            // Excluir o formando exclui a lista pessoal dele
            presente.HasOne<Formando>().WithMany().HasForeignKey(p => p.FormandoId).OnDelete(DeleteBehavior.Cascade);

            presente.Property(p => p.Nome).HasMaxLength(150).IsRequired();
            presente.Property(p => p.Descricao).HasMaxLength(1000);
            presente.Property(p => p.ValorEstimado).HasPrecision(10, 2);
            presente.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
            presente.Property(p => p.LinkAfiliado).HasMaxLength(500);
            presente.Property(p => p.Foto).HasMaxLength(500);
            presente.Property(p => p.CodigoReserva).HasMaxLength(32);
            presente.Ignore(p => p.ValorCota);
        });

        modelo.Entity<CotaPresente>(cota =>
        {
            // Excluir o presente exclui as cotas; excluir o convidado mantém a cota com o nome guardado
            cota.HasOne<ItemPresente>().WithMany().HasForeignKey(c => c.ItemPresenteId).OnDelete(DeleteBehavior.Cascade);
            cota.HasOne<Convidado>().WithMany().HasForeignKey(c => c.ConvidadoId).OnDelete(DeleteBehavior.SetNull);

            cota.Property(c => c.NomeConvidado).HasMaxLength(120).IsRequired();
            cota.Property(c => c.Valor).HasPrecision(10, 2);
        });

        modelo.Entity<Formando>(formando =>
        {
            // Excluir o evento exclui os formandos (e os pagamentos deles)
            formando.HasOne<Evento>().WithMany().HasForeignKey(f => f.EventoId).OnDelete(DeleteBehavior.Cascade);
            // Excluir a conta só desfaz o vínculo; o formando continua na turma (e no rateio)
            formando.HasOne<Usuario>().WithMany().HasForeignKey(f => f.UsuarioId).OnDelete(DeleteBehavior.SetNull);

            // Uma conta é no máximo um formando por evento; o endereço é único dentro do evento
            formando.HasIndex(f => new { f.EventoId, f.UsuarioId }).IsUnique();
            formando.HasIndex(f => new { f.EventoId, f.Slug }).IsUnique();
            formando.HasIndex(f => f.CodigoConvite).IsUnique();

            formando.Property(f => f.Nome).HasMaxLength(120).IsRequired();
            formando.Property(f => f.Email).HasMaxLength(200);
            formando.Property(f => f.Papel).HasConversion<string>().HasMaxLength(20);
            formando.Property(f => f.CodigoConvite).HasMaxLength(16);
            formando.Property(f => f.Slug).HasMaxLength(130).IsRequired();
            formando.Property(f => f.Mensagem).HasMaxLength(1000);
        });

        modelo.Entity<Despesa>(despesa =>
        {
            despesa.HasOne<Evento>().WithMany().HasForeignKey(d => d.EventoId).OnDelete(DeleteBehavior.Cascade);

            despesa.Property(d => d.Descricao).HasMaxLength(200).IsRequired();
            despesa.Property(d => d.Valor).HasPrecision(12, 2);
        });

        modelo.Entity<ItemChecklist>(item =>
        {
            // Excluir o evento exclui a checklist; excluir o formando responsável só deixa o item sem responsável
            item.HasOne<Evento>().WithMany().HasForeignKey(i => i.EventoId).OnDelete(DeleteBehavior.Cascade);
            item.HasOne<Formando>().WithMany().HasForeignKey(i => i.ResponsavelFormandoId).OnDelete(DeleteBehavior.SetNull);

            item.Property(i => i.Titulo).HasMaxLength(150).IsRequired();
            item.Property(i => i.Descricao).HasMaxLength(500);
            item.Property(i => i.Categoria).HasConversion<string>().HasMaxLength(20);
            item.Property(i => i.Origem).HasConversion<string>().HasMaxLength(20);
            item.Property(i => i.ChaveSugestao).HasMaxLength(60);
        });

        modelo.Entity<CoOrganizador>(coOrganizador =>
        {
            // Excluir o evento ou a conta tira a pessoa da organização
            coOrganizador.HasOne<Evento>().WithMany().HasForeignKey(c => c.EventoId).OnDelete(DeleteBehavior.Cascade);
            coOrganizador.HasOne<Usuario>().WithMany().HasForeignKey(c => c.UsuarioId).OnDelete(DeleteBehavior.Cascade);

            // Uma conta entra uma vez só em cada evento
            coOrganizador.HasIndex(c => new { c.EventoId, c.UsuarioId }).IsUnique();
        });

        modelo.Entity<PixInformado>(pix =>
        {
            // Excluir o evento ou desfazer a compra de cotas exclui o aviso; excluir o convidado ou o formando
            // mantém o aviso (o nome fica guardado)
            pix.HasOne<Evento>().WithMany().HasForeignKey(p => p.EventoId).OnDelete(DeleteBehavior.Cascade);
            pix.HasOne<CotaPresente>().WithMany().HasForeignKey(p => p.CotaPresenteId).OnDelete(DeleteBehavior.Cascade);
            pix.HasOne<Convidado>().WithMany().HasForeignKey(p => p.ConvidadoId).OnDelete(DeleteBehavior.SetNull);
            pix.HasOne<Formando>().WithMany().HasForeignKey(p => p.FormandoId).OnDelete(DeleteBehavior.SetNull);

            // Uma compra de cotas tem no máximo um aviso de Pix (vários nulos são permitidos)
            pix.HasIndex(p => p.CotaPresenteId).IsUnique();

            pix.Property(p => p.NomeConvidado).HasMaxLength(120).IsRequired();
            pix.Property(p => p.Valor).HasPrecision(10, 2);
            pix.Property(p => p.Recado).HasMaxLength(500);
        });

        modelo.Entity<PagamentoFormando>(pagamento =>
        {
            pagamento.HasOne<Formando>().WithMany().HasForeignKey(p => p.FormandoId).OnDelete(DeleteBehavior.Cascade);

            pagamento.Property(p => p.Valor).HasPrecision(12, 2);
            pagamento.Property(p => p.Observacao).HasMaxLength(500);
        });

        modelo.Entity<FotoMural>(foto =>
        {
            // Excluir o evento exclui as fotos (os arquivos em disco são apagados pelo ServicoEvento)
            foto.HasOne<Evento>().WithMany().HasForeignKey(f => f.EventoId).OnDelete(DeleteBehavior.Cascade);

            foto.Property(f => f.NomeAutor).HasMaxLength(120);
            foto.Property(f => f.Arquivo).HasMaxLength(64).IsRequired();
            foto.Property(f => f.Status).HasConversion<string>().HasMaxLength(20);
        });
    }
}
