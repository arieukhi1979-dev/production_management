import React from 'react';
import { PortalProvider, usePortal } from './context/PortalContext';
import { Navbar } from './components/common/Navbar';
import { QRModal } from './components/common/QRModal';
import { QRScannerModal } from './components/common/QRScannerModal';
import { PrintAssetTags } from './components/common/PrintAssetTags';
import { LandingDashboard } from './components/landing/LandingDashboard';
import { MachinePlanModule } from './components/machine-plan/MachinePlanModule';
import { SetupModule } from './components/setup/SetupModule';
import { MasterOrderModule } from './components/master-order/MasterOrderModule';
import { OperationBulletinModule } from './components/operation-bulletin/OperationBulletinModule';
import { BOMModule } from './components/bom/BOMModule';
import { ProductionPlanModule } from './components/production-plan/ProductionPlanModule';
import { ProductionReportModule } from './components/production-report/ProductionReportModule';
import { MRPModule } from './components/mrp/MRPModule';

const MainRouter: React.FC = () => {
  const { activeModule } = usePortal();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {activeModule === 'landing' && <LandingDashboard />}
        {activeModule === 'machine-plan' && <MachinePlanModule />}
        {activeModule === 'setup' && <SetupModule />}
        {activeModule === 'master-order' && <MasterOrderModule />}
        {activeModule === 'ob' && <OperationBulletinModule />}
        {activeModule === 'bom' && <BOMModule />}
        {activeModule === 'prod-plan' && <ProductionPlanModule />}
        {activeModule === 'prod-report' && <ProductionReportModule />}
        {activeModule === 'mrp' && <MRPModule />}
      </main>

      {/* Global Modals */}
      <QRModal />
      <QRScannerModal />
      <PrintAssetTags />

      {/* Footer */}
      <footer className="no-print bg-slate-950 border-t border-slate-800 text-slate-500 py-6 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-400">PROD·PORTAL</span>
            <span className="text-slate-700">·</span>
            <span>PT Garment Manufacturing System &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Plant Manager: Arie Prasetya Wibowo</span>
            <span className="text-slate-700">·</span>
            <span>PPC &amp; Industrial Engineering Suite</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <PortalProvider>
      <MainRouter />
    </PortalProvider>
  );
}
