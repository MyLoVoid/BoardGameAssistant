'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import type { GameStatus, AppSection } from '@/lib/types';

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateGameModal({ isOpen, onClose, onSuccess }: CreateGameModalProps) {
  const [name, setName] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [status, setStatus] = useState<GameStatus>('active');
  const [bggId, setBggId] = useState('');
  const [minPlayers, setMinPlayers] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [playingTime, setPlayingTime] = useState('');
  const [rating, setRating] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sections, setSections] = useState<AppSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSections();
      // Reset form
      setName('');
      setBggId('');
      setMinPlayers('');
      setMaxPlayers('');
      setPlayingTime('');
      setRating('');
      setThumbnailUrl('');
      setImageUrl('');
      setStatus('active');
      setError('');
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
      const data: any = {
        section_id: sectionId,
        name: name.trim(),
        status,
      };

      // Add optional fields only if they have values
      if (bggId.trim()) {
        data.bgg_id = parseInt(bggId);
      }
      if (minPlayers.trim()) {
        data.min_players = parseInt(minPlayers);
      }
      if (maxPlayers.trim()) {
        data.max_players = parseInt(maxPlayers);
      }
      if (playingTime.trim()) {
        data.playing_time = parseInt(playingTime);
      }
      if (rating.trim()) {
        data.rating = parseFloat(rating);
      }
      if (thumbnailUrl.trim()) {
        data.thumbnail_url = thumbnailUrl.trim();
      }
      if (imageUrl.trim()) {
        data.image_url = imageUrl.trim();
      }

      await apiClient.createGame(data);

      // Reset form
      setName('');
      setBggId('');
      setMinPlayers('');
      setMaxPlayers('');
      setPlayingTime('');
      setRating('');
      setThumbnailUrl('');
      setImageUrl('');
      setError('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Create New Game</CardTitle>
            <CardDescription className="mt-1.5">
              Manually add a new game to your catalog
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

            {/* Required Fields */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Game Name *
              </label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Wingspan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
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
                Status *
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

            {/* Optional Fields */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Optional Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="bgg_id" className="text-sm font-medium">
                    BGG ID
                  </label>
                  <Input
                    id="bgg_id"
                    type="number"
                    placeholder="e.g., 266192"
                    value={bggId}
                    onChange={(e) => setBggId(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="rating" className="text-sm font-medium">
                    Rating
                  </label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g., 8.05"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="min_players" className="text-sm font-medium">
                    Min Players
                  </label>
                  <Input
                    id="min_players"
                    type="number"
                    min="1"
                    placeholder="e.g., 1"
                    value={minPlayers}
                    onChange={(e) => setMinPlayers(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="max_players" className="text-sm font-medium">
                    Max Players
                  </label>
                  <Input
                    id="max_players"
                    type="number"
                    min="1"
                    placeholder="e.g., 5"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <label htmlFor="playing_time" className="text-sm font-medium">
                    Playing Time (minutes)
                  </label>
                  <Input
                    id="playing_time"
                    type="number"
                    min="1"
                    placeholder="e.g., 70"
                    value={playingTime}
                    onChange={(e) => setPlayingTime(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <label htmlFor="thumbnail_url" className="text-sm font-medium">
                    Thumbnail URL
                  </label>
                  <Input
                    id="thumbnail_url"
                    type="url"
                    placeholder="https://..."
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <label htmlFor="image_url" className="text-sm font-medium">
                    Full Image URL
                  </label>
                  <Input
                    id="image_url"
                    type="url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
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
                    Creating...
                  </>
                ) : (
                  'Create Game'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
