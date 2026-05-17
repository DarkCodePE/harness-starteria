import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { PortfolioLeadBreadcrumbs } from '../components/portfolio/PortfolioLeadPageElements';
import { PortfolioLeadStartExperience } from '../components/portfolio/PortfolioLeadStartExperience';

export function PortfolioLeadStartPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [importOpen, setImportOpen] = useState(searchParams.get('mode') === 'import');

  const mode = useMemo(() => searchParams.get('mode'), [searchParams]);

  useEffect(() => {
    setImportOpen(mode === 'import');
  }, [mode]);

  const handleImportOpenChange = (open: boolean) => {
    setImportOpen(open);
    if (!open) {
      navigate('/portfolio/iniciar', { replace: true });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <PortfolioLeadBreadcrumbs
        items={[
          { label: 'Portfolio Lead', path: '/portfolio/inicio' },
          { label: 'Inicio', path: '/portfolio/inicio' },
          { label: 'Iniciar' },
        ]}
      />

      <PortfolioLeadStartExperience
        importOpen={importOpen}
        onImportOpenChange={handleImportOpenChange}
        onNavigate={path => navigate(path)}
      />
    </div>
  );
}
