import React from 'react';
import {
  PublicConfidentialityNotice,
  PublicEnterpriseCards,
  PublicStartHero,
} from '../../../features/public-start/components';
import { PortfolioEntryExperience } from '../../../features/portfolio-entry/public';

export function PublicStartPage() {
  return (
    <div className="space-y-7 py-6">
      <div className="space-y-8">
        <PublicStartHero />
        <PortfolioEntryExperience />
      </div>

      <PublicConfidentialityNotice />
      <PublicEnterpriseCards />
    </div>
  );
}
