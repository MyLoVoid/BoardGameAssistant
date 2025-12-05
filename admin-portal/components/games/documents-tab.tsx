'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Plus, Trash2, AlertCircle, Loader2, Play, Download } from 'lucide-react';
import type { GameDocument } from '@/lib/types';
import { formatFileSize, formatDate } from '@/lib/utils';
import { AddDocumentModal } from '@/components/games/add-document-modal';
import { notifyError, notifyInfo } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

interface DocumentsTabProps {
  gameId: string;
  onRefreshRequested?: () => void;
}

export function DocumentsTab({ gameId, onRefreshRequested }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<GameDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.getGameDocuments(gameId);
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    setError('');
    setSuccess('');
    try {
      await apiClient.deleteDocument(gameId, documentId);
      setSuccess('Document deleted successfully!');
      loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    }
  };

  const handleProcessKnowledge = async () => {
    if (selectedDocs.size === 0) {
      setError('Please select at least one document to process');
      return;
    }

    if (!confirm(`Process ${selectedDocs.size} document(s) with Gemini?`)) return;

    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const result = await apiClient.processKnowledge(gameId, {
        document_ids: Array.from(selectedDocs),
        provider_name: 'gemini',
      });

      const successCount = result.success_count ?? 0;
      const failCount = result.error_count ?? 0;

      setSuccess(
        `Knowledge processing complete! Success: ${successCount}, Failed: ${failCount}`
      );
      setSelectedDocs(new Set());
      loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to process knowledge');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessSingleDocument = async (docId: string) => {
    if (!confirm('Process this document with Gemini?')) return;

    setProcessingDocId(docId);
    setError('');
    setSuccess('');
    try {
      const result = await apiClient.processKnowledge(gameId, {
        document_ids: [docId],
        provider_name: 'gemini',
      });

      const successCount = result.success_count ?? 0;
      const failCount = result.error_count ?? 0;

      if (successCount > 0) {
        setSuccess('Document processed successfully!');
      } else {
        setError('Failed to process document');
      }
      loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to process document');
    } finally {
      setProcessingDocId(null);
    }
  };

  const toggleDocSelection = (docId: string) => {
    const newSet = new Set(selectedDocs);
    if (newSet.has(docId)) {
      newSet.delete(docId);
    } else {
      newSet.add(docId);
    }
    setSelectedDocs(newSet);
  };

  const handleUploadComplete = async () => {
    setSelectedDocs(new Set());
  await loadDocuments();
  onRefreshRequested?.();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ready':
        return 'success';
      case 'processing':
        return 'warning';
      case 'error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleDownload = async (document: GameDocument) => {
    if (!document.file_path) {
      notifyError('Este documento no tiene una ruta de archivo disponible.');
      return;
    }
    const [bucket, ...pathParts] = document.file_path.split('/');
    const storagePath = pathParts.join('/');
    if (!bucket || !storagePath) {
      notifyError('La ruta del documento es inválida.');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, 60);
      if (error || !data?.signedUrl) {
        throw error;
      }
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch (downloadError) {
      console.error('Failed to download document', downloadError);
      notifyError('No se pudo descargar el documento.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(error || success) && (
        <div
          className={`px-4 py-3 rounded-md flex items-start gap-2 ${
            error
              ? 'bg-destructive/10 text-destructive'
              : 'bg-success/10 text-success'
          }`}
        >
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error || success}</p>
        </div>
      )}

      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          {selectedDocs.size > 0 && (
            <Button onClick={handleProcessKnowledge} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Process Knowledge ({selectedDocs.size})
                </>
              )}
            </Button>
          )}
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No documents yet. Upload your first document to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Seleccionar
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Documento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Idioma
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Fuente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Procesar
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/30">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedDocs.has(doc.id)}
                          onChange={() => toggleDocSelection(doc.id)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {doc.title || doc.file_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Archivo: {doc.file_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            {doc.file_size && (
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(doc.file_size)}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Creado: {formatDate(doc.created_at)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => handleDownload(doc)}
                            disabled={!doc.file_path}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                          </Button>
                          {!doc.file_path && (
                            <p className="text-xs text-destructive">
                              Ruta de almacenamiento no disponible.
                            </p>
                          )}
                          {doc.error_message && (
                            <p className="text-xs text-destructive">{doc.error_message}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className="uppercase">
                          {doc.language}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 capitalize">
                        <Badge variant="secondary">{doc.source_type}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={getStatusBadgeVariant(doc.status)}>{doc.status}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        {doc.status === 'ready' ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                            Procesado
                          </Badge>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleProcessSingleDocument(doc.id)}
                            disabled={processingDocId === doc.id}
                          >
                            {processingDocId === doc.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Procesando...
                              </>
                            ) : (
                              'Procesar'
                            )}
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => handleDelete(doc.id)}
                            aria-label="Eliminar documento"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <AddDocumentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        gameId={gameId}
        onUploaded={handleUploadComplete}
      />
    </div>
  );
}
