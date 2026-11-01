using Backend.Modelos;
using Microsoft.EntityFrameworkCore;

namespace Backend.Dados;

public class ContextoBanco(DbContextOptions<ContextoBanco> opcoes) : DbContext(opcoes)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();

    protected override void OnModelCreating(ModelBuilder modelo)
    {
        modelo.Entity<Usuario>(usuario =>
        {
            usuario.HasIndex(u => u.Email).IsUnique();
            usuario.Property(u => u.Nome).HasMaxLength(120).IsRequired();
            usuario.Property(u => u.Email).HasMaxLength(200).IsRequired();
            usuario.Property(u => u.SenhaHash).IsRequired();
        });
    }
}
