import React, { useState } from 'react';

// The content of database/schema.sql is embedded here.
// In a real-world scenario, this might be fetched from a static asset endpoint.
const schemaContent = `-- =============================================
-- Script: PCM Industrial - Database Schema
-- Author: World-Class Senior Frontend Engineer
-- Description: Creates the full database schema, RLS policies, and seeds initial data.
-- Target Server: SQL Server 2016+
-- =============================================

-- =============================================
-- PRE-CONFIGURATION
-- =============================================
-- Create the database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'PCM_Industrial_DB')
BEGIN
    CREATE DATABASE PCM_Industrial_DB;
END
GO

USE PCM_Industrial_DB;
GO

-- =============================================
-- TABLE CREATION
-- =============================================

-- Companies Table
CREATE TABLE Companies (
    Id INT PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL
);
GO

-- Plants Table
CREATE TABLE Plants (
    Id INT PRIMARY KEY,
    CompanyId INT NOT NULL,
    Code NVARCHAR(50) NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    CNPJ NVARCHAR(18) NOT NULL,
    Address NVARCHAR(500),
    CONSTRAINT FK_Plants_Companies FOREIGN KEY (CompanyId) REFERENCES Companies(Id)
);
GO

-- Teams Table
CREATE TABLE Teams (
    Id INT PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL
);
GO

-- Users Table
CREATE TABLE Users (
    Id INT PRIMARY KEY,
    CompanyId INT NULL, -- NULL for SYSTEM_ADMINISTRATOR
    PlantId INT NULL,
    TeamId INT NULL,
    Login NVARCHAR(100) NOT NULL UNIQUE,
    Name NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    Role NVARCHAR(50) NOT NULL CHECK (Role IN ('SYSTEM_ADMINISTRATOR', 'ADMINISTRATOR', 'ADMIN_PLANTA', 'TECNICO_PCM', 'OPERADOR', 'VISUALIZADOR')),
    CONSTRAINT FK_Users_Companies FOREIGN KEY (CompanyId) REFERENCES Companies(Id),
    CONSTRAINT FK_Users_Plants FOREIGN KEY (PlantId) REFERENCES Plants(Id),
    CONSTRAINT FK_Users_Teams FOREIGN KEY (TeamId) REFERENCES Teams(Id)
);
GO
-- Add index for performance on login
CREATE INDEX IX_Users_Login ON Users(Login);
GO


-- Equipment Table
CREATE TABLE Equipment (
    Id INT PRIMARY KEY,
    PlantId INT NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    Type NVARCHAR(100) NOT NULL CHECK (Type IN ('Extrusora', 'Rebobinadeira', 'Impressora', 'Corte e Solda')),
    Line NVARCHAR(100),
    Availability DECIMAL(5, 2) NOT NULL,
    MTTR DECIMAL(10, 2) NOT NULL,
    MTBF DECIMAL(10, 2) NOT NULL,
    OpenedAt DATETIME2 NULL, -- Tracks current downtime
    ClosedAt DATETIME2 NULL,
    CONSTRAINT FK_Equipment_Plants FOREIGN KEY (PlantId) REFERENCES Plants(Id)
);
GO
-- Add index for performance on PlantId
CREATE INDEX IX_Equipment_PlantId ON Equipment(PlantId);
GO


-- MaintenanceCalls Table
CREATE TABLE MaintenanceCalls (
    Id INT PRIMARY KEY,
    EquipmentId INT NOT NULL,
    PlantId INT NOT NULL,
    RequesterId INT NOT NULL,
    ResponsibleId INT NULL,
    Status NVARCHAR(50) NOT NULL CHECK (Status IN ('Aberto', 'Em Andamento', 'Aguardando Aprovação', 'Resolvido', 'Encerrado', 'Cancelado')),
    Priority NVARCHAR(50) NOT NULL CHECK (Priority IN ('Crítico', 'Alto', 'Médio', 'Baixo')),
    Source NVARCHAR(50) NOT NULL CHECK (Source IN ('Manual', 'Automático')),
    Description NVARCHAR(MAX) NOT NULL,
    ProblemType NVARCHAR(100),
    OpenedAt DATETIME2 NOT NULL,
    AssignedAt DATETIME2 NULL,
    ResolvedAt DATETIME2 NULL,
    ApprovedAt DATETIME2 NULL,
    ClosedAt DATETIME2 NULL,
    CONSTRAINT FK_MaintenanceCalls_Equipment FOREIGN KEY (EquipmentId) REFERENCES Equipment(Id),
    CONSTRAINT FK_MaintenanceCalls_Plants FOREIGN KEY (PlantId) REFERENCES Plants(Id),
    CONSTRAINT FK_MaintenanceCalls_Requester FOREIGN KEY (RequesterId) REFERENCES Users(Id),
    CONSTRAINT FK_MaintenanceCalls_Responsible FOREIGN KEY (ResponsibleId) REFERENCES Users(Id)
);
GO
-- Add indexes for performance
CREATE INDEX IX_MaintenanceCalls_Status ON MaintenanceCalls(Status);
CREATE INDEX IX_MaintenanceCalls_EquipmentId ON MaintenanceCalls(EquipmentId);
GO

-- AlertRules Table
CREATE TABLE AlertRules (
    Id INT PRIMARY KEY,
    EquipmentId INT NOT NULL,
    Metric NVARCHAR(50) NOT NULL CHECK (Metric IN ('Vibração', 'Temperatura', 'Pressão')),
    Condition NVARCHAR(50) NOT NULL CHECK (Condition IN ('Maior que', 'Menor que')),
    Threshold DECIMAL(10, 2) NOT NULL,
    Description NVARCHAR(500),
    CONSTRAINT FK_AlertRules_Equipment FOREIGN KEY (EquipmentId) REFERENCES Equipment(Id)
);
GO


-- =============================================
-- ROW-LEVEL SECURITY (RLS) IMPLEMENTATION
-- =============================================
-- This policy ensures that users can only see data from their own company.
-- A SYSTEM_ADMINISTRATOR (with CompanyId NULL in session context) can see all data.

-- 1. Create a schema to hold the security objects
CREATE SCHEMA Security;
GO

-- 2. Create the filter predicate function
CREATE FUNCTION Security.CompanyFilter(@CompanyId INT)
RETURNS TABLE
WITH SCHEMABINDING
AS
    RETURN SELECT 1 AS FilterPredicate
    WHERE
        -- Allow access if the CompanyId matches the session context
        @CompanyId = CAST(SESSION_CONTEXT(N'CompanyId') AS INT)
        -- Or allow access if the user is a system admin (no CompanyId in session context)
        OR SESSION_CONTEXT(N'CompanyId') IS NULL;
GO


-- 3. Create security policies for each relevant table
-- Policy for Plants
CREATE SECURITY POLICY Security.PlantCompanyFilterPolicy
ADD FILTER PREDICATE Security.CompanyFilter(CompanyId) ON dbo.Plants
WITH (STATE = ON);
GO

-- Policy for Users (to prevent admins from seeing users of other companies)
CREATE SECURITY POLICY Security.UserCompanyFilterPolicy
ADD FILTER PREDICATE Security.CompanyFilter(CompanyId) ON dbo.Users
WITH (STATE = ON);
GO

-- Policy for Equipment (linked via Plant)
CREATE SECURITY POLICY Security.EquipmentCompanyFilterPolicy
ADD FILTER PREDICATE Security.CompanyFilter(
    -- Subquery to get CompanyId from the associated Plant
    (SELECT p.CompanyId FROM dbo.Plants p WHERE p.Id = PlantId)
) ON dbo.Equipment
WITH (STATE = ON);
GO

-- Policy for MaintenanceCalls (linked via Plant)
CREATE SECURITY POLICY Security.CallCompanyFilterPolicy
ADD FILTER PREDICATE Security.CompanyFilter(
    -- Subquery to get CompanyId from the associated Plant
    (SELECT p.CompanyId FROM dbo.Plants p WHERE p.Id = PlantId)
) ON dbo.MaintenanceCalls
WITH (STATE = ON);
GO

-- Policy for AlertRules (linked via Equipment -> Plant)
CREATE SECURITY POLICY Security.AlertRuleCompanyFilterPolicy
ADD FILTER PREDICATE Security.CompanyFilter(
    -- Subquery to get CompanyId from the associated Plant
    (SELECT p.CompanyId FROM dbo.Plants p JOIN dbo.Equipment e ON p.Id = e.PlantId WHERE e.Id = EquipmentId)
) ON dbo.AlertRules
WITH (STATE = ON);
GO


-- =============================================
-- SEED DATA INSERTION
-- =============================================

-- Companies
INSERT INTO Companies (Id, Name) VALUES
(1, 'Plásticos do Brasil S.A.'),
(2, 'Polímeros Avançados Ltda.');
GO

-- Plants
INSERT INTO Plants (Id, CompanyId, Code, Name, CNPJ, Address) VALUES
(1, 1, 'PLT-001', 'Planta A (SP)', '11.111.111/0001-01', 'Rua Industrial 1, São Paulo, SP'),
(2, 1, 'PLT-002', 'Planta B (RJ)', '22.222.222/0001-02', 'Av. Principal 2, Rio de Janeiro, RJ'),
(3, 2, 'POLI-001', 'Unidade Curitiba', '33.333.333/0001-03', 'Rua Inovação 3, Curitiba, PR'),
(4, 2, 'POLI-002', 'Unidade Manaus', '44.444.444/0001-04', 'Distrito Industrial 4, Manaus, AM');
GO

-- Teams
INSERT INTO Teams (Id, Name) VALUES
(1, 'Mecânica'),
(2, 'Elétrica'),
(3, 'Hidráulica');
GO

-- Users
INSERT INTO Users (Id, CompanyId, PlantId, TeamId, Login, Name, Email, Role) VALUES
(100, NULL, NULL, NULL, 'sysadmin', 'Admin do Sistema', 'sysadmin@pcm.com', 'SYSTEM_ADMINISTRATOR'),
(1, 1, NULL, NULL, 'admin', 'Admin Geral (Empresa 1)', 'admin@ind1.com', 'ADMINISTRATOR'),
(2, 1, 1, NULL, 'admin.planta1', 'Admin Planta A', 'admin.planta1@ind1.com', 'ADMIN_PLANTA'),
(3, 1, NULL, 1, 'tecnico1', 'João Silva', 'joao.silva@ind1.com', 'TECNICO_PCM'),
(4, 1, NULL, NULL, 'operador1', 'Maria Souza', 'maria.souza@ind1.com', 'OPERADOR'),
(5, 2, NULL, NULL, 'admin2', 'Admin Geral (Empresa 2)', 'admin@ind2.com', 'ADMINISTRATOR'),
(6, 2, NULL, 2, 'tecnico2', 'Ana Costa', 'ana.costa@ind2.com', 'TECNICO_PCM'),
(7, 2, 3, NULL, 'operador2', 'Pedro Lima', 'pedro.lima@ind2.com', 'OPERADOR');
GO

-- Equipment
INSERT INTO Equipment (Id, PlantId, Name, Type, Line, Availability, MTTR, MTBF, OpenedAt, ClosedAt) VALUES
(1, 1, 'Extrusora Alpha', 'Extrusora', 'Linha 1', 95.5, 2.5, 250, NULL, NULL),
(2, 1, 'Rebobinadeira Beta', 'Rebobinadeira', 'Linha 1', 98.2, 1.2, 500, NULL, NULL),
(3, 2, 'Impressora Gamma', 'Impressora', 'Linha A', 92.0, 4.0, 180, NULL, NULL),
(4, 3, 'Corte/Solda Delta', 'Corte e Solda', 'CS-01', 99.1, 0.8, 800, NULL, NULL),
(5, 4, 'Extrusora Epsilon', 'Extrusora', 'Linha 2', 96.3, 2.1, 320, NULL, NULL);
GO

-- MaintenanceCalls
INSERT INTO MaintenanceCalls (Id, EquipmentId, PlantId, RequesterId, ResponsibleId, Status, Priority, Source, Description, ProblemType, OpenedAt, AssignedAt, ResolvedAt, ApprovedAt, ClosedAt) VALUES
(1, 1, 1, 1, 3, 'Em Andamento', 'Crítico', 'Automático', '[AUTO] Temperatura do canhão excedeu 240°C.', 'Superaquecimento', '2024-07-19T08:00:00Z', '2024-07-19T08:15:00Z', NULL, NULL, NULL),
(2, 3, 2, 4, NULL, 'Aberto', 'Alto', 'Manual', 'Impressora com falha no sistema de secagem.', 'Falha Elétrica', '2024-07-18T09:15:00Z', NULL, NULL, NULL, NULL),
(3, 2, 1, 4, 3, 'Aguardando Aprovação', 'Médio', 'Manual', 'Sensor de tensão da rebobinadeira descalibrado.', 'Calibração', '2024-07-17T10:00:00Z', '2024-07-17T10:30:00Z', '2024-07-17T14:00:00Z', NULL, NULL),
(4, 1, 1, 2, 3, 'Encerrado', 'Baixo', 'Manual', 'Troca preventiva do filtro de óleo.', 'Manutenção Preventiva', '2024-07-16T14:00:00Z', '2024-07-16T14:10:00Z', '2024-07-16T15:00:00Z', '2024-07-16T15:05:00Z', '2024-07-16T15:05:00Z'),
(5, 4, 3, 7, NULL, 'Aberto', 'Médio', 'Manual', 'Ruído incomum na esteira de saída.', 'Falha Mecânica', '2024-07-19T11:00:00Z', NULL, NULL, NULL, NULL),
(6, 5, 4, 5, 6, 'Encerrado', 'Baixo', 'Manual', 'Troca de filtro de ar programada.', 'Manutenção Preventiva', '2024-07-15T14:00:00Z', '2024-07-15T14:05:00Z', '2024-07-15T14:30:00Z', '2024-07-15T14:32:00Z', '2024-07-15T14:32:00Z');
GO

-- AlertRules
INSERT INTO AlertRules (Id, EquipmentId, Metric, Condition, Threshold, Description) VALUES
(1, 1, 'Temperatura', 'Maior que', 240, 'Abrir chamado crítico se temp. do canhão da Extrusora Alpha > 240°C'),
(2, 1, 'Vibração', 'Maior que', 10, 'Abrir chamado médio se vibração da Extrusora Alpha > 10 mm/s'),
(3, 3, 'Pressão', 'Menor que', 5, 'Alerta se pressão de tinta da Impressora Gamma < 5 bar'),
(4, 5, 'Vibração', 'Maior que', 8, 'Abrir chamado médio se vibração da Extrusora Epsilon > 8 mm/s');
GO

PRINT 'PCM Industrial database schema and seed data created successfully.';
GO
`;

const SchemaViewerPage: React.FC = () => {
    const [copyStatus, setCopyStatus] = useState('Copiar Script');

    const handleCopy = () => {
        navigator.clipboard.writeText(schemaContent).then(() => {
            setCopyStatus('Copiado!');
            setTimeout(() => setCopyStatus('Copiar Script'), 2000);
        }).catch(err => {
            setCopyStatus('Falha ao copiar');
            console.error('Failed to copy text: ', err);
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Schema do Banco de Dados (SQL Server)</h1>
                    <p className="text-neutral-500 mt-1">Este é o script completo para criar a estrutura do banco. Execute-o em seu ambiente SQL Server.</p>
                </div>
                <button
                    onClick={handleCopy}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center"
                >
                    <i className={`fas ${copyStatus === 'Copiado!' ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                    {copyStatus}
                </button>
            </div>
            <div className="bg-neutral-900/80 dark:bg-black/50 p-4 rounded-lg border border-neutral-700 h-[calc(100vh-200px)] overflow-auto">
                <pre className="text-sm text-green-300 font-mono whitespace-pre-wrap">
                    <code>
                        {schemaContent}
                    </code>
                </pre>
            </div>
        </div>
    );
};

export default SchemaViewerPage;
