"use client";

// ─── Dados mock ───────────────────────────────────────────────────────────────
const stats = [
  { label: "Alunos ativos",     value: "47",  icon: "users",   cor: "bg-blue-50 text-blue-600"   },
  { label: "Turmas ativas",     value: "12",  icon: "class",   cor: "bg-purple-50 text-purple-600"},
  { label: "Professores",       value: "5",   icon: "teacher", cor: "bg-amber-50 text-amber-600"  },
  { label: "Parcelas em aberto",value: "8",   icon: "dollar",  cor: "bg-red-50 text-red-600"      },
];

const aulasHoje = [
  { turma: "BOOK 1 B1 KIDS / 01 SEG 14:00",   professor: "Carlos Mendes",   horario: "14:00", turno: "afternoon", alunos: 5 },
  { turma: "BOOK 2 B2 TEENS / 02 QUA 18:30",  professor: "Ana Paula Silva", horario: "18:30", turno: "evening",   alunos: 8 },
  { turma: "BOOK 3 B3 ADULTS / 03 SEX 09:00", professor: "Carlos Mendes",   horario: "09:00", turno: "morning",   alunos: 4 },
];

const parcelasVencidas = [
  { aluno: "Ronald Xavier de Abreu",  turma: "Book 1 / Seg 14:00", vencimento: "05/02/2025", valor: "R$ 290,00" },
  { aluno: "Pedro Henrique Costa",    turma: "Book 2 / Qua 18:30", vencimento: "10/02/2025", valor: "R$ 250,00" },
  { aluno: "Julia Ferreira Lima",     turma: "Book 3 / Sex 09:00", vencimento: "15/02/2025", valor: "R$ 290,00" },
];

const atividadeRecente = [
  { acao: "Nova matrícula criada",      detalhe: "Alice Massari Soares",         hora: "Hoje, 09:15", tipo: "matricula" },
  { acao: "Turma agendada",             detalhe: "Book 2 / Qua 18:30",           hora: "Hoje, 08:40", tipo: "turma"    },
  { acao: "Parcela baixada",            detalhe: "Ronald Xavier — R$ 290,00",    hora: "Ontem, 17:22",tipo: "financeiro"},
  { acao: "Novo usuário cadastrado",    detalhe: "Fernanda Costa (Financeiro)",  hora: "Ontem, 14:05",tipo: "usuario"  },
  { acao: "Feriado marcado no calendário", detalhe: "18/02/2025",               hora: "Ontem, 11:30",tipo: "calendario"},
];

const turnoColors: Record<string, string> = {
  morning:   "bg-amber-50 text-amber-700",
  afternoon: "bg-blue-50 text-blue-700",
  evening:   "bg-purple-50 text-purple-700",
};

const turnoLabel: Record<string, string> = {
  morning: "Morning", afternoon: "Afternoon", evening: "Evening",
};

// ─── Ícones ───────────────────────────────────────────────────────────────────
function Icon({ type }: { type: string }) {
  if (type === "users") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
  if (type === "class") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
  if (type === "teacher") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
  if (type === "dollar") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
  if (type === "matricula") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
      <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  );
  if (type === "turma") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
  if (type === "financeiro") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
  if (type === "usuario") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

const atividadeCores: Record<string, string> = {
  matricula:  "bg-blue-50 text-blue-600",
  turma:      "bg-purple-50 text-purple-600",
  financeiro: "bg-green-50 text-green-600",
  usuario:    "bg-amber-50 text-amber-600",
  calendario: "bg-red-50 text-red-600",
};

// ─── Página ───────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-6">

      {/* Topo */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5 capitalize">{hoje}</p>
      </div>

      {/* Cards de stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-zinc-200 rounded-xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.cor}`}>
              <Icon type={s.icon} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{s.value}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Linha do meio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Aulas de hoje */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Aulas de hoje</h2>
            <span className="text-xs text-zinc-400">{aulasHoje.length} aulas</span>
          </div>
          <div className="divide-y divide-zinc-100">
            {aulasHoje.map((aula, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-zinc-600">{aula.horario}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{aula.turma}</p>
                    <p className="text-xs text-zinc-400">{aula.professor} · {aula.alunos} alunos</p>
                  </div>
                </div>
                <span className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${turnoColors[aula.turno]}`}>
                  {turnoLabel[aula.turno]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Parcelas vencidas */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Parcelas vencidas</h2>
            <span className="text-xs bg-red-50 text-red-600 font-medium px-2 py-0.5 rounded-full">{parcelasVencidas.length} em aberto</span>
          </div>
          <div className="divide-y divide-zinc-100">
            {parcelasVencidas.map((p, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{p.aluno}</p>
                  <p className="text-xs text-zinc-400">{p.turma} · Venceu {p.vencimento}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-red-600">{p.valor}</p>
                  <button className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">Ver financeiro</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Atividade recente */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Atividade recente</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {atividadeRecente.map((a, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-4">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${atividadeCores[a.tipo]}`}>
                <Icon type={a.tipo} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-900">{a.acao}</p>
                <p className="text-xs text-zinc-400 truncate">{a.detalhe}</p>
              </div>
              <span className="text-xs text-zinc-400 shrink-0">{a.hora}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}