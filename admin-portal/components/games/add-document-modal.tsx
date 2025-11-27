'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient, type ApiClientError } from '@/lib/api';
import { notifyError, notifySuccess } from '@/lib/notifications';
import type { DocumentSourceType, Language } from '@/lib/types';
import { Loader2, Upload, X } from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const ACCEPTED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

interface AddDocumentModalProps {
  open: boolean;
  onClose: () => void;
  gameId: string;
  onUploaded?: () => void | Promise<void>;
}

const sourceTypeOptions: { value: DocumentSourceType; label: string }[] = [
  { value: 'rulebook', label: 'Rulebook' },
  { value: 'faq', label: 'FAQ' },
  { value: 'expansion', label: 'Expansion' },
  { value: 'quickstart', label: 'Quickstart' },
  { value: 'reference', label: 'Reference' },
  { value: 'other', label: 'Other' },
];

function isApiClientError(error: unknown): error is ApiClientError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

export function AddDocumentModal({
  open,
  onClose,
  gameId,
  onUploaded,
}: AddDocumentModalProps) {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<Language>('es');
  const [sourceType, setSourceType] = useState<DocumentSourceType>('rulebook');
  const [file, setFile] = useState<File | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setTitle('');
    setLanguage('es');
    setSourceType('rulebook');
    setFile(null);
    setTitleError(null);
    setFileError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  if (!open) return null;

  const validateFile = (candidate: File | null): string | null => {
    if (!candidate) return 'Selecciona un archivo.';
    const extension = candidate.name?.toLowerCase().slice(candidate.name.lastIndexOf('.'));
    if (!extension || !ACCEPTED_EXTENSIONS.includes(extension)) {
      return 'Solo se permiten archivos .pdf, .doc o .docx.';
    }
    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      return 'El archivo supera el límite de 10 MB.';
    }
    if (candidate.type && !ACCEPTED_MIMES.includes(candidate.type)) {
      return 'Tipo de archivo no válido. Usa PDF o Word.';
    }
    return null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setFileError(validateFile(selected));
  };

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedTitle = title.trim();
    setTitleError(null);
    setFileError(null);
    if (!trimmedTitle) {
      setTitleError('El título es obligatorio.');
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setFileError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.createDocument(gameId, {
        title: trimmedTitle,
        language,
        source_type: sourceType,
        file: file!,
      });
      notifySuccess('Documento subido correctamente.');
      if (onUploaded) {
        await onUploaded();
      }
      handleClose();
    } catch (error) {
      let message = (error as Error).message || 'No se pudo subir el documento.';
      if (isApiClientError(error)) {
        if (error.status === 409) {
          message = 'Este archivo ya existe para este juego.';
        }
      }
      notifyError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="relative w-full max-w-xl rounded-lg bg-background p-6 shadow-2xl">
        <button
          type="button"
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          onClick={handleClose}
          aria-label="Cerrar"
          disabled={isSubmitting}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Agregar documento</h2>
            <p className="text-sm text-muted-foreground">
              Sube archivos PDF o Word de hasta 10 MB. El documento se almacenará
              automáticamente en Supabase Storage con un UUID único.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej. Gloomhaven Rulebook ES"
                disabled={isSubmitting}
                className="mt-1"
              />
              {titleError && (
                <p className="mt-1 text-sm text-destructive">{titleError}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Idioma</label>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as Language)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={isSubmitting}
                >
                  <option value="es">Español (ES)</option>
                  <option value="en">English (EN)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Tipo de fuente</label>
                <select
                  value={sourceType}
                  onChange={(event) =>
                    setSourceType(event.target.value as DocumentSourceType)
                  }
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={isSubmitting}
                >
                  {sourceTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Archivo</label>
              <div className="mt-2 flex flex-col items-start gap-2 rounded-md border border-dashed border-input bg-muted/40 p-4">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Tamaño máximo 10 MB. Tipos permitidos: PDF, DOC, DOCX.
                </p>
                {file && (
                  <p className="text-sm font-medium text-foreground">
                    Archivo seleccionado: {file.name}
                  </p>
                )}
                {fileError && (
                  <p className="text-sm text-destructive">{fileError}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir documento
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
