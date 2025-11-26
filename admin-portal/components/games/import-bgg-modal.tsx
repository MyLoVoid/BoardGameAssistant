'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import type { GameStatus, AppSection } from '@/lib/types';

interface ImportBGGModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportBGGModal({ isOpen, onClose, onSuccess }: ImportBGGModalProps) {
  const [bggId, setBggId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [status, setStatus] = useState<GameStatus>('active');
  const [sections, setSections] = useState<AppSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSections();
    }
  }, [isOpen]);

  const loadSections = async () => {
    try {
      const data = await apiClient.getSections();
      setSections(data);
      if (data.length > 0) {
        setSectionId(data[0].id);
      } else {
        setError('No sections available. Please create the BGC section first.');
      }
    } catch (err: any) {
      console.error('Error loading sections:', err);
      setError('Failed to load sections. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.importFromBGG({
        bgg_id: parseInt(bggId),
        section_id: sectionId,
        status,
      });

      // Reset form
      setBggId('');
      setError('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import game from BGG');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Import Game from BGG</CardTitle>
            <CardDescription className="mt-1.5">
              Enter a BoardGameGeek ID to import game data
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="bgg_id" className="text-sm font-medium">
                BGG ID *
              </label>
              <Input
                id="bgg_id"
                type="number"
                placeholder="e.g., 174430 (Gloomhaven)"
                value={bggId}
                onChange={(e) => setBggId(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Find the ID in the BGG URL: boardgamegeek.com/boardgame/[ID]/...
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="section_id" className="text-sm font-medium">
                Section *
              </label>
              <select
                id="section_id"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
                disabled={loading || sections.length === 0}
              >
                {sections.length === 0 ? (
                  <option value="">No sections available</option>
                ) : (
                  sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Initial Status *
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as GameStatus)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="beta">Beta</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || sections.length === 0} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Game'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
