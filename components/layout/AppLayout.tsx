import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MaintenanceCallsPage from '../../pages/MaintenanceCallsPage';
import EquipmentPage from '../../pages/EquipmentPage';
import UsersPage from '../../pages/UsersPage';
import SettingsPage from '../../pages/SettingsPage';
import AiSuggestionsPage from '../../pages/AiSuggestionsPage';
import TeamViewPage from '../../pages/TeamViewPage';
import AlertsPage from '../../pages/AlertsPage';
import DatabaseSettingsPage from '../../pages/DatabaseSettingsPage';
import AnalysisPage from '../../pages/AnalysisPage';
import MessagingSettingsPage from '../../pages/MessagingSettingsPage';
import CompaniesPage from '../../pages/CompaniesPage';
import SchemaViewerPage from '../../pages/SchemaViewerPage';
import TeamsPage from '../../pages/TeamsPage';
import RolesPage from '../../pages/RolesPage';
import ReportsPage from '../../pages/ReportsPage';
import AccessControlPage from '../../pages/AccessControlPage';
import { Page } from '../../types';


const AppLayout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('analysis');

  const renderPage = () => {
    switch (currentPage) {
      case 'analysis':
        return <AnalysisPage />;
      case 'calls':
        return <MaintenanceCallsPage />;
      case 'equipment':
        return <EquipmentPage />;
      case 'users':
        return <UsersPage />;
      case 'teams':
        return <TeamsPage />;
      case 'roles':
        return <RolesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'access-control':
        return <AccessControlPage />;
      case 'settings':
        return <SettingsPage setCurrentPage={setCurrentPage} />;
      case 'messaging':
        return <MessagingSettingsPage />;
      case 'ai':
        return <AiSuggestionsPage />;
      case 'team-view':
        return <TeamViewPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'database':
        return <DatabaseSettingsPage />;
      case 'companies':
        return <CompaniesPage />;
      case 'schema':
        return <SchemaViewerPage />;
      default:
        return <AnalysisPage />;
    }
  };

  return (
    <div className="flex h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-100 dark:bg-neutral-900 p-4 sm:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;