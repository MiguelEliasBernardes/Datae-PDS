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
        });

        modelo.Entity<Convidado>(convidado =>
        {
            // Excluir o evento exclui os convidados dele
            convidado.HasOne<Evento>().WithMany().HasForeignKey(c => c.EventoId).OnDelete(DeleteBehavior.Cascade);

            convidado.Property(c => c.Nome).HasMaxLength(120).IsRequired();
            convidado.Property(c => c.Email).HasMaxLength(200);
            convidado.Property(c => c.StatusPresenca).HasConversion<string>().HasMaxLength(20);
            convidado.Property(c => c.Observacao).HasMaxLength(500);
        });

        modelo.Entity<ItemPresente>(presente =>
        {
            // Excluir o evento exclui os presentes; excluir o convidado só libera o presente
            presente.HasOne<Evento>().WithMany().HasForeignKey(p => p.EventoId).OnDelete(DeleteBehavior.Cascade);
            presente.HasOne<Convidado>().WithMany().HasForeignKey(p => p.ConvidadoId).OnDelete(DeleteBehavior.SetNull);

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

            formando.Property(f => f.Nome).HasMaxLength(120).IsRequired();
            formando.Property(f => f.Email).HasMaxLength(200);
            formando.Property(f => f.Papel).HasConversion<string>().HasMaxLength(20);
        });

        modelo.Entity<Despesa>(despesa =>
        {
            despesa.HasOne<Evento>().WithMany().HasForeignKey(d => d.EventoId).OnDelete(DeleteBehavior.Cascade);

            despesa.Property(d => d.Descricao).HasMaxLength(200).IsRequired();
            despesa.Property(d => d.Valor).HasPrecision(12, 2);
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
