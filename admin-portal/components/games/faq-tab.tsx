'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Plus, Edit, Trash2, Eye, EyeOff, AlertCircle, Loader2, X } from 'lucide-react';
import type { FAQ, Language, CreateFAQRequest, UpdateFAQRequest } from '@/lib/types';

interface FAQTabProps {
  gameId: string;
}

export function FAQTab({ gameId }: FAQTabProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [languageFilter, setLanguageFilter] = useState<Language | 'all'>('all');
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateFAQRequest>({
    language: 'es',
    question: '',
    answer: '',
    display_order: 0,
    visible: true,
  });

  const loadFAQs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.getGameFAQs(gameId);
      setFaqs([...data].sort((a, b) => a.display_order - b.display_order));
    } catch (err: any) {
      setError(err.message || 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }, [gameId]); // Add gameId as a dependency since it's used inside loadFAQs

  useEffect(() => {
    loadFAQs();
  }, [loadFAQs]);

  const handleCreate = async () => {
    setError('');
    try {
      await apiClient.createFAQ(gameId, formData);
      resetForm();
      setIsCreating(false);
      loadFAQs();
    } catch (err: any) {
      setError(err.message || 'Failed to create FAQ');
    }
  };

  const handleUpdate = async () => {
    if (!editingFaq) return;
    setError('');
    try {
      const updateData: UpdateFAQRequest = {
        question: formData.question,
        answer: formData.answer,
        display_order: formData.display_order,
        visible: formData.visible,
      };
      await apiClient.updateFAQ(gameId, editingFaq.id, updateData);
      resetForm();
      setEditingFaq(null);
      loadFAQs();
    } catch (err: any) {
      setError(err.message || 'Failed to update FAQ');
    }
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    setError('');
    try {
      await apiClient.deleteFAQ(gameId, faqId);
      loadFAQs();
    } catch (err: any) {
      setError(err.message || 'Failed to delete FAQ');
    }
  };

  const startEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      language: faq.language,
      question: faq.question,
      answer: faq.answer,
      display_order: faq.display_order,
      visible: faq.visible,
    });
    setIsCreating(false);
  };

  const resetForm = () => {
    setFormData({
      language: 'es',
      question: '',
      answer: '',
      display_order: 0,
      visible: true,
    });
  };

  const filteredFaqs =
    languageFilter === 'all'
      ? faqs
      : faqs.filter((faq) => faq.language === languageFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={languageFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguageFilter('all')}
          >
            All
          </Button>
          <Button
            variant={languageFilter === 'es' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguageFilter('es')}
          >
            Spanish
          </Button>
          <Button
            variant={languageFilter === 'en' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguageFilter('en')}
          >
            English
          </Button>
        </div>

        {!isCreating && !editingFaq && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        )}
      </div>

      {(isCreating || editingFaq) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>{editingFaq ? 'Edit FAQ' : 'Create FAQ'}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsCreating(false);
                setEditingFaq(null);
                resetForm();
                setError('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value as Language })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  disabled={!!editingFaq}
                >
                  <option value="es">Spanish (ES)</option>
                  <option value="en">English (EN)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Order</label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_order: Number.parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Question</label>
              <Textarea
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                placeholder="Enter the question..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Answer</label>
              <Textarea
                value={formData.answer}
                onChange={(e) =>
                  setFormData({ ...formData, answer: e.target.value })
                }
                placeholder="Enter the answer..."
                className="mt-1"
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="visible"
                checked={formData.visible}
                onChange={(e) =>
                  setFormData({ ...formData, visible: e.target.checked })
                }
                className="h-4 w-4"
              />
              <label htmlFor="visible" className="text-sm font-medium">
                Visible to users
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setEditingFaq(null);
                  resetForm();
                  setError('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={editingFaq ? handleUpdate : handleCreate}>
                {editingFaq ? 'Update' : 'Create'} FAQ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredFaqs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No FAQs yet. Create your first FAQ!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <Card key={faq.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{faq.language.toUpperCase()}</Badge>
                      <Badge variant="secondary">Order: {faq.display_order}</Badge>
                      {faq.visible ? (
                        <Badge variant="success">
                          <Eye className="h-3 w-3 mr-1" />
                          Visible
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {faq.answer}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(faq)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(faq.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
