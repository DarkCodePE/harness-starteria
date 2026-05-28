import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  PublicConfidentialityNotice,
  PublicEnterpriseCards,
  PublicQuickInput,
  PublicStartHero,
} from '../../../features/public-start/components';
import { PublicUploadProgress } from '../../../features/public-start/components/PublicUploadProgress';
import {
  createPublicDraftFromInput,
  createPublicDraftFromUpload,
} from '../../../features/public-start/services/publicDraftService';
import { getAnonymousSessionId } from '../../../features/public-start/services/publicDraftStorage';
import { usePublicPdfAutofill } from '../../hooks/usePublicPdfAutofill';
import { isPdfAutofillEnabled } from '../../services/featureFlags';

const PUBLIC_START_INPUT_KEY = 'starteria.publicStart.inputText';

export function PublicStartPage() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Anonymous draft + session for the PDF upload path. The draftId doubles
  // as the AutofillContext key, so we create it BEFORE uploading and reuse it.
  // It is kept in state (not a ref) so the polling hook re-binds to the live
  // draftId before `upload` runs.
  const [uploadDraftId, setUploadDraftId] = useState<string | null>(null);
  // The picked file + a one-shot guard are kept in refs (not state) so that
  // clearing them does NOT retrigger the upload effect and cancel its own
  // in-flight run before it can navigate.
  const pendingFileRef = useRef<File | null>(null);
  const startedDraftRef = useRef<string | null>(null);
  const [anonymousSessionId] = useState(() => getAnonymousSessionId());
  const uploadEnabled = isPdfAutofillEnabled();

  const { status, uploadProgress, upload, cancel } = usePublicPdfAutofill(
    uploadDraftId ?? undefined,
    anonymousSessionId,
  );

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

  const handleFileSelected = (file: File) => {
    setNotice(null);
    // Create the anonymous draft up-front; its id keys the AutofillContext
    // and is sent to the backend so the run is attributed to this draft.
    const draft = createPublicDraftFromUpload(file.name);
    // Stash the file in a ref and commit the draftId to state so the hook
    // re-binds to the live draftId; the effect below then runs the upload.
    pendingFileRef.current = file;
    setUploadDraftId(draft.id);
  };

  // Run the upload once the hook is bound to the freshly created draftId.
  // Depends only on uploadDraftId (+ stable upload/navigate); the file lives in
  // a ref and a per-draft guard makes this a one-shot, so the effect never
  // retriggers and cancels its own in-flight run before navigating.
  useEffect(() => {
    if (!uploadDraftId) return;
    const file = pendingFileRef.current;
    if (!file) return;
    if (startedDraftRef.current === uploadDraftId) return;
    startedDraftRef.current = uploadDraftId;
    pendingFileRef.current = null;

    let cancelled = false;
    (async () => {
      const started = await upload(file);
      if (cancelled) return;
      if (!started) {
        setNotice('No pudimos procesar el documento. Intenta nuevamente.');
        return;
      }
      // `upload` polled to completion and merged proposals into the (app-level)
      // AutofillContext keyed by uploadDraftId, so they survive this navigation.
      navigate(`/public/draft/${uploadDraftId}/edit`);
    })();
    return () => {
      cancelled = true;
    };
  }, [uploadDraftId, upload, navigate]);

  const handleValidationError = (message: string) => {
    setNotice(message);
  };

  const uploadBusy = status === 'uploading' || status === 'running';

  // Issue #30 — cancel both the in-flight hook AND the local upload-draft
  // bookkeeping so the user can immediately pick another file or switch to
  // the text path. `startedDraftRef` is cleared so a re-pick of the same
  // draftId would still re-trigger the upload effect (defensive — in practice
  // a new draftId is minted per pick).
  const handleCancelUpload = () => {
    cancel();
    pendingFileRef.current = null;
    startedDraftRef.current = null;
    setUploadDraftId(null);
    setNotice(null);
  };

  // Surface extraction failures inline without blocking the text path.
  useEffect(() => {
    if (status === 'failed' || status === 'timeout') {
      setNotice('No pudimos procesar el documento. Puedes intentarlo de nuevo o describir tu idea.');
      cancel();
    }
  }, [status, cancel]);

  return (
    <div className="space-y-7 py-6">
      <div className="space-y-8">
        <PublicStartHero />
        {uploadBusy ? (
          <PublicUploadProgress
            status={status as 'uploading' | 'running'}
            uploadProgress={uploadProgress}
            onCancel={handleCancelUpload}
          />
        ) : (
          <PublicQuickInput
            value={inputText}
            notice={notice}
            loading={loading}
            uploadEnabled={uploadEnabled}
            uploadBusy={uploadBusy}
            onChange={value => {
              setInputText(value);
              if (notice) setNotice(null);
            }}
            onSubmit={handleSubmit}
            onUploadUnavailable={handleUploadUnavailable}
            onFileSelected={handleFileSelected}
            onUploadValidationError={handleValidationError}
          />
        )}
      </div>

      <PublicConfidentialityNotice />
      <PublicEnterpriseCards />
    </div>
  );
}
