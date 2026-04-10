using Audit.EntityFramework;
using Learly.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Learly.Infrastructure.Data
{
    // O segredo está aqui: herdar de AuditDbContext em vez de DbContext!
    public class LearlyDbContext : AuditDbContext
    {
        public LearlyDbContext(DbContextOptions<LearlyDbContext> options) : base(options) 
        { 
        }

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Escola> Escolas { get; set; }
        public DbSet<Perfil> Perfis { get; set; }
        public DbSet<Permissao> Permissoes { get; set; }
        public DbSet<PerfilPermissao> PerfilPermissoes { get; set; }
        public DbSet<UsuarioPermissao> UsuarioPermissoes { get; set; }
        public DbSet<Turma> Turmas { get; set; }
        public DbSet<Aula> Aulas { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<PerfilPermissao>()
                .HasKey(pp => new { pp.PerfilId, pp.PermissaoId });

            modelBuilder.Entity<UsuarioPermissao>()
                .HasKey(up => new { up.UsuarioId, up.PermissaoId });
        }
    }
}