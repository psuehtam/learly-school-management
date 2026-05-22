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
    public DbSet<EscolaHorarioFuncionamento> EscolasHorariosFuncionamento => Set<EscolaHorarioFuncionamento>();
    public DbSet<Perfil> Perfis => Set<Perfil>();
    public DbSet<Permissao> Permissoes => Set<Permissao>();
    public DbSet<PerfilPermissao> PerfilPermissoes => Set<PerfilPermissao>();
    public DbSet<PerfilTemplate> PerfisTemplate => Set<PerfilTemplate>();
    public DbSet<PerfilPermissaoTemplate> PerfilPermissoesTemplate => Set<PerfilPermissaoTemplate>();
    public DbSet<UsuarioPermissao> UsuarioPermissoes => Set<UsuarioPermissao>();
    public DbSet<Turma> Turmas => Set<Turma>();
    public DbSet<TurmaDiaSemana> TurmasDiasSemana => Set<TurmaDiaSemana>();
    public DbSet<TurmaCapituloProgresso> TurmasCapitulosProgresso => Set<TurmaCapituloProgresso>();
    public DbSet<Aula> Aulas => Set<Aula>();
    public DbSet<Aluno> Alunos => Set<Aluno>();
    public DbSet<Matricula> Matriculas => Set<Matricula>();
    public DbSet<Livro> Livros => Set<Livro>();
    public DbSet<Capitulo> Capitulos => Set<Capitulo>();
    public DbSet<Responsavel> Responsaveis => Set<Responsavel>();
    public DbSet<PreResponsavel> PreResponsaveis => Set<PreResponsavel>();
    public DbSet<PreAluno> PreAlunos => Set<PreAluno>();
    public DbSet<PreAlunoDocumento> PreAlunoDocumentos => Set<PreAlunoDocumento>();

    public DbSet<ContratoTemplate> ContratosTemplates => Set<ContratoTemplate>();
    public DbSet<ContratoGerado> ContratosGerados => Set<ContratoGerado>();

    public DbSet<CalendarioGeral> CalendariosGerais => Set<CalendarioGeral>();
    public DbSet<Compromisso> Compromissos => Set<Compromisso>();
    public DbSet<CompromissoParticipante> CompromissosParticipantes => Set<CompromissoParticipante>();

    public DbSet<Presenca> Presencas => Set<Presenca>();
    public DbSet<Homework> Homeworks => Set<Homework>();
    public DbSet<Avaliacao> Avaliacoes => Set<Avaliacao>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(LearlyDbContext).Assembly);
    }
}
