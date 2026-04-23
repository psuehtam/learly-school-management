using Learly.Domain.Entities;
using Learly.Infrastructure.Data.Configurations;
using Microsoft.EntityFrameworkCore;

namespace Learly.Infrastructure.Data;

public class LearlyDbContext : DbContext
{
    public LearlyDbContext(DbContextOptions<LearlyDbContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Escola> Escolas => Set<Escola>();
    public DbSet<Perfil> Perfis => Set<Perfil>();
    public DbSet<Permissao> Permissoes => Set<Permissao>();
    public DbSet<PerfilPermissao> PerfilPermissoes => Set<PerfilPermissao>();
    public DbSet<UsuarioPermissao> UsuarioPermissoes => Set<UsuarioPermissao>();
    public DbSet<Turma> Turmas => Set<Turma>();
    public DbSet<Aula> Aulas => Set<Aula>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(LearlyDbContext).Assembly);
    }
}
