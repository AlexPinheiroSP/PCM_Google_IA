# Banco de Dados - PCM Industrial

Este diretório contém todos os scripts e artefatos relacionados ao banco de dados da aplicação PCM Industrial.

## `schema.sql`

Este é o script principal para a criação de toda a estrutura do banco de dados no **SQL Server**.

### O que o script faz?

1.  **Criação de Tabelas**: Define todas as tabelas necessárias para a aplicação, como `Companies`, `Users`, `Equipment`, `MaintenanceCalls`, etc.
2.  **Relacionamentos**: Estabelece chaves primárias e estrangeiras para garantir a integridade referencial dos dados.
3.  **Índices**: Cria índices em colunas frequentemente consultadas para otimizar a performance das queries.
4.  **Segurança (Row-Level Security)**: Implementa uma política de segurança para garantir que os dados sejam automaticamente filtrados por empresa (`CompanyId`). Isso é crucial para o modelo *multitenant* da aplicação.
5.  **Dados Iniciais (Seed Data)**: Insere um conjunto de dados iniciais para que a aplicação possa ser executada e testada imediatamente após a criação do banco.

### Como executar o script?

1.  **Pré-requisitos**: Tenha uma instância do SQL Server (2016 ou superior) em execução.
2.  **Conexão**: Conecte-se à sua instância do SQL Server usando uma ferramenta como SQL Server Management Studio (SSMS) ou Azure Data Studio.
3.  **Criação do Banco**: Crie um novo banco de dados vazio (ex: `PCM_Industrial_DB`).
    ```sql
    CREATE DATABASE PCM_Industrial_DB;
    GO
    USE PCM_Industrial_DB;
    GO
    ```
4.  **Execução**: Abra o arquivo `schema.sql`, copie todo o seu conteúdo e execute-o na janela de consulta do banco de dados que você acabou de criar.

### Sobre o Row-Level Security (RLS)

A política de segurança `CompanyFilter` foi criada para isolar os dados de cada empresa. Para que ela funcione corretamente, a aplicação **backend** deve, após a autenticação de um usuário, executar o seguinte comando para definir o contexto da sessão do banco de dados:

```sql
EXEC sp_set_session_context @key = N'CompanyId', @value = '...';
```

Substitua `...` pelo ID da empresa (`CompanyId`) do usuário logado. Uma vez que o contexto da sessão é definido, todas as consultas subsequentes feitas nessa sessão serão automaticamente e transparentemente filtradas pela política, impedindo o acesso a dados de outras empresas. Se o `@value` não for definido (ou for `NULL`), a política permitirá que usuários do sistema (como o `SYSTEM_ADMINISTRATOR`) vejam todos os dados.