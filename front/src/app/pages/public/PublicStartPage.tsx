import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  PublicConfidentialityNotice,
  PublicQuickInput,
  PublicStartHero,
} from '../../../features/public-start/components';
import { createPublicDraftFromInput } from '../../../features/public-start/services/publicDraftService';

const PUBLIC_START_INPUT_KEY = 'starteria.publicStart.inputText';

export function PublicStartPage() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    const trimmed = inputText.trim();
    if (trimmed.length < 30 || loading) return;
    setLoading(true);
    window.sessionStorage.setItem(PUBLIC_START_INPUT_KEY, trimmed);
    window.setTimeout(() => {
      try {
        const draft = createPublicDraftFromInput(trimmed);
        navigate(`/public/draft/${draft.id}/edit`);
      } catch {
        setNotice('No pudimos crear el borrador. Intenta nuevamente.');
        setLoading(false);
      }
    }, 350);
  };

  const handleUploadUnavailable = () => {
    setNotice('Próximamente podrás adjuntar un documento no sensible.');
  };

  return (
    <div className="relative -mx-5 -my-8 overflow-hidden px-5 py-6 md:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.12),rgba(248,250,252,0)_64%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-5">
        <PublicStartHero />
        <PublicQuickInput
          value={inputText}
          notice={notice}
          loading={loading}
          onChange={value => {
            setInputText(value);
            if (notice) setNotice(null);
          }}
          onSubmit={handleSubmit}
          onUploadUnavailable={handleUploadUnavailable}
        />
        <PublicConfidentialityNotice />
      </div>
    </div>
  );
}
