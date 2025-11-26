'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Plus, Trash2, AlertCircle, Loader2, X, Play } from 'lucide-react';
import type { GameDocument, Language, DocumentSourceType, AIProvider, CreateDocumentRequest } from '@/lib/types';
import { formatFileSize, formatDate } from '@/lib/utils';

interface DocumentsTabProps {
  gameId: string;
}

export function DocumentsTab({ gameId }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<GameDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<CreateDocumentRequest>({
    language: 'es',
    source_type: 'rulebook',
    file_name: '',
    file_path: '',
    provider_name: 'openai',
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
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
  };

  const handleCreate = async () => {
    setError('');
    setSuccess('');
    try {
      await apiClient.createDocument(gameId, formData);
      resetForm();
      setIsCreating(false);
      setSuccess('Document created successfully! Remember to upload the file to Supabase Storage and process knowledge.');
      loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to create document');
    }
  };

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

    if (!confirm(`Process knowledge for ${selectedDocs.size} document(s)?`)) return;

    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const result = await apiClient.processKnowledge(gameId, {
        document_ids: Array.from(selectedDocs),
      });

      const { success: successCount, fail: failCount } = result.results.reduce(
        (acc, r) => {
          if (r.status === 'success') acc.success += 1;
          else if (r.status === 'error') acc.fail += 1;
          return acc;
        },
        { success: 0, fail: 0 }
      );

      setSuccess(`Knowledge processing complete! Success: ${successCount}, Failed: ${failCount}`);
      setSelectedDocs(new Set());
      loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to process knowledge');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      language: 'es',
      source_type: 'rulebook',
      file_name: '',
      file_path: '',
      provider_name: 'openai',
    });
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
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          )}
        </div>
      </div>

      {isCreating && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Add Document Reference</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsCreating(false);
                resetForm();
                setError('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/10 text-primary px-4 py-3 rounded-md text-sm">
              <p className="font-medium mb-1">Note:</p>
              <p>
                This creates a document reference. You'll need to manually upload the
                actual file to Supabase Storage and then use "Process Knowledge" to
                index it with the AI provider.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value as Language })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                >
                  <option value="es">Spanish (ES)</option>
                  <option value="en">English (EN)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Source Type</label>
                <select
                  value={formData.source_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      source_type: e.target.value as DocumentSourceType,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                >
                  <option value="rulebook">Rulebook</option>
                  <option value="faq">FAQ</option>
                  <option value="expansion">Expansion</option>
                  <option value="quickstart">Quickstart</option>
                  <option value="reference">Reference</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">File Name</label>
              <Input
                value={formData.file_name}
                onChange={(e) =>
                  setFormData({ ...formData, file_name: e.target.value })
                }
                placeholder="e.g., gloomhaven_rulebook_es.pdf"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                File Path (optional, Supabase Storage path)
              </label>
              <Input
                value={formData.file_path}
                onChange={(e) =>
                  setFormData({ ...formData, file_path: e.target.value })
                }
                placeholder="e.g., game_documents/gloomhaven/rulebook_es.pdf"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">AI Provider</label>
              <select
                value={formData.provider_name}
                onChange={(e) =>
                  setFormData({ ...formData, provider_name: e.target.value as AIProvider })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
                <option value="claude">Claude</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  resetForm();
                  setError('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Document</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No documents yet. Add your first document reference!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedDocs.has(doc.id)}
                    onChange={() => toggleDocSelection(doc.id)}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{doc.language.toUpperCase()}</Badge>
                      <Badge variant="secondary">{doc.source_type}</Badge>
                      <Badge variant={getStatusBadgeVariant(doc.status)}>
                        {doc.status}
                      </Badge>
                      <Badge variant="outline">{doc.provider_name}</Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{doc.file_name}</h3>
                    {doc.file_path && (
                      <p className="text-sm text-muted-foreground mb-1">
                        Path: {doc.file_path}
                      </p>
                    )}
                    {doc.file_size_bytes && (
                      <p className="text-sm text-muted-foreground mb-1">
                        Size: {formatFileSize(doc.file_size_bytes)}
                      </p>
                    )}
                    {doc.provider_file_id && (
                      <p className="text-sm text-muted-foreground mb-1">
                        Provider File ID: {doc.provider_file_id}
                      </p>
                    )}
                    {doc.error_message && (
                      <p className="text-sm text-destructive mt-2">
                        Error: {doc.error_message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {formatDate(doc.created_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
