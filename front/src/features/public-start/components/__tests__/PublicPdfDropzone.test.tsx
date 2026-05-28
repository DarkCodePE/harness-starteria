import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { PublicPdfDropzone } from '../PublicPdfDropzone';

function makePdfFile(name = 'test.pdf', size = 1024): File {
  const file = new File(['%PDF-1.4'], name, { type: 'application/pdf' });
  // The File's underlying byte length is small; override `size` so we can
  // exercise the >10MB validation branch without allocating huge buffers.
  Object.defineProperty(file, 'size', { value: size, writable: false });
  return file;
}

function makeNonPdfFile(): File {
  return new File(['not a pdf'], 'note.txt', { type: 'text/plain' });
}

describe('PublicPdfDropzone', () => {
  it('renders idle copy + accessible role', () => {
    render(<PublicPdfDropzone onFileSelected={() => undefined} />);
    const zone = screen.getByTestId('public-pdf-dropzone');
    expect(zone).toHaveAttribute('role', 'button');
    expect(zone).toHaveAttribute('aria-label', expect.stringMatching(/Arrastra un PDF/i));
    expect(zone).toHaveAttribute('data-drag-active', 'false');
    expect(
      screen.getByText(/Arrastra tu PDF aquí o haz click para seleccionar/i),
    ).toBeInTheDocument();
  });

  it('highlights on dragover and resets on dragleave', () => {
    render(<PublicPdfDropzone onFileSelected={() => undefined} />);
    const zone = screen.getByTestId('public-pdf-dropzone');
    fireEvent.dragOver(zone);
    expect(zone).toHaveAttribute('data-drag-active', 'true');
    expect(screen.getByText(/Suelta el PDF para subirlo/i)).toBeInTheDocument();
    fireEvent.dragLeave(zone);
    expect(zone).toHaveAttribute('data-drag-active', 'false');
  });

  it('drop with a valid PDF fires onFileSelected', () => {
    const onFileSelected = vi.fn();
    const onValidationError = vi.fn();
    render(
      <PublicPdfDropzone
        onFileSelected={onFileSelected}
        onValidationError={onValidationError}
      />,
    );
    const zone = screen.getByTestId('public-pdf-dropzone');
    const file = makePdfFile('iniciativa.pdf', 4096);
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onFileSelected).toHaveBeenCalledTimes(1);
    expect(onFileSelected.mock.calls[0][0].name).toBe('iniciativa.pdf');
    expect(onValidationError).not.toHaveBeenCalled();
    expect(zone).toHaveAttribute('data-drag-active', 'false');
  });

  it('drop with a non-PDF file fires onValidationError, not onFileSelected', () => {
    const onFileSelected = vi.fn();
    const onValidationError = vi.fn();
    render(
      <PublicPdfDropzone
        onFileSelected={onFileSelected}
        onValidationError={onValidationError}
      />,
    );
    fireEvent.drop(screen.getByTestId('public-pdf-dropzone'), {
      dataTransfer: { files: [makeNonPdfFile()] },
    });
    expect(onFileSelected).not.toHaveBeenCalled();
    expect(onValidationError).toHaveBeenCalledWith(expect.stringMatching(/PDF/i));
  });

  it('drop with an oversized PDF rejects via onValidationError (>10MB)', () => {
    const onFileSelected = vi.fn();
    const onValidationError = vi.fn();
    render(
      <PublicPdfDropzone
        onFileSelected={onFileSelected}
        onValidationError={onValidationError}
      />,
    );
    const big = makePdfFile('huge.pdf', 11 * 1024 * 1024);
    fireEvent.drop(screen.getByTestId('public-pdf-dropzone'), {
      dataTransfer: { files: [big] },
    });
    expect(onFileSelected).not.toHaveBeenCalled();
    expect(onValidationError).toHaveBeenCalledWith(expect.stringMatching(/10\s*MB/i));
  });

  it('Enter key on the zone opens the file picker (triggers the hidden input click)', () => {
    render(<PublicPdfDropzone onFileSelected={() => undefined} />);
    const zone = screen.getByTestId('public-pdf-dropzone');
    const input = zone.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');
    fireEvent.keyDown(zone, { key: 'Enter' });
    expect(clickSpy).toHaveBeenCalled();
  });
});
