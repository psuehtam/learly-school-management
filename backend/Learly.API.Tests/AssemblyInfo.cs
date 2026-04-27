using Xunit;

// CustomWebApplicationFactory usa um InMemoryDatabaseRoot estático compartilhado; execução
// paralela de testes de integração corrompe o mesmo banco em memória.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
