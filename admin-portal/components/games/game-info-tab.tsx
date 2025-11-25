'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { RefreshCw, Save, AlertCircle, Loader2 } from 'lucide-react';
import type { Game, GameStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface GameInfoTabProps {
  game: Game;
  onUpdate: () => void;
}

export function GameInfoTab({ game, onUpdate }: GameInfoTabProps) {
  const [editing, setEditing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: game.name,
    description: game.description || '',
    status: game.status,
    min_players: game.min_players || '',
    max_players: game.max_players || '',
    min_playtime: game.min_playtime || '',
    max_playtime: game.max_playtime || '',
  });

  const handleSyncFromBGG = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.syncGameFromBGG(game.id);
      setSuccess('Game synced successfully from BGG!');
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to sync from BGG');
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.updateGame(game.id, {
        name: formData.name,
        description: formData.description || undefined,
        status: formData.status,
        min_players: formData.min_players ? parseInt(formData.min_players as string) : undefined,
        max_players: formData.max_players ? parseInt(formData.max_players as string) : undefined,
        min_playtime: formData.min_playtime ? parseInt(formData.min_playtime as string) : undefined,
        max_playtime: formData.max_playtime ? parseInt(formData.max_playtime as string) : undefined,
      });
      setSuccess('Game updated successfully!');
      setEditing(false);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to update game');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: game.name,
      description: game.description || '',
      status: game.status,
      min_players: game.min_players || '',
      max_players: game.max_players || '',
      min_playtime: game.min_playtime || '',
      max_playtime: game.max_playtime || '',
    });
    setEditing(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="space-y-6">
      {(error || success) && (
        <div
          className={`px-4 py-3 rounded-md flex items-start gap-2 ${
            error
              ? 'bg-destructive/10 text-destructive'
              : 'bg-green-50 text-green-800'
          }`}
        >
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error || success}</p>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Game Information</CardTitle>
          <div className="flex gap-2">
            {game.bgg_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncFromBGG}
                disabled={syncing || editing}
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync from BGG
                  </>
                )}
              </Button>
            )}
            {!editing ? (
              <Button size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              {game.image_url ? (
                <Image
                  src={game.image_url}
                  alt={game.name}
                  width={200}
                  height={200}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-[200px] h-[200px] rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                {editing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-lg font-semibold mt-1">{game.name}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                {editing ? (
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-1"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {game.description || 'No description'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  {editing ? (
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as GameStatus,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                    >
                      <option value="active">Active</option>
                      <option value="beta">Beta</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  ) : (
                    <div className="mt-1">
                      <Badge>{game.status}</Badge>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">BGG ID</label>
                  <p className="text-sm mt-1">
                    {game.bgg_id ? (
                      <a
                        href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {game.bgg_id}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Not linked</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Players</label>
                  {editing ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={formData.min_players}
                        onChange={(e) =>
                          setFormData({ ...formData, min_players: e.target.value })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={formData.max_players}
                        onChange={(e) =>
                          setFormData({ ...formData, max_players: e.target.value })
                        }
                      />
                    </div>
                  ) : (
                    <p className="text-sm mt-1">
                      {game.min_players && game.max_players
                        ? `${game.min_players}-${game.max_players}`
                        : '-'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Playtime (minutes)</label>
                  {editing ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={formData.min_playtime}
                        onChange={(e) =>
                          setFormData({ ...formData, min_playtime: e.target.value })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={formData.max_playtime}
                        onChange={(e) =>
                          setFormData({ ...formData, max_playtime: e.target.value })
                        }
                      />
                    </div>
                  ) : (
                    <p className="text-sm mt-1">
                      {game.min_playtime && game.max_playtime
                        ? `${game.min_playtime}-${game.max_playtime}`
                        : '-'}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Year Published</label>
                  <p className="text-sm mt-1">
                    {game.year_published || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">BGG Rating</label>
                  <p className="text-sm mt-1">
                    {game.bgg_rating ? game.bgg_rating.toFixed(2) : '-'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Last Synced from BGG</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {game.last_synced_from_bgg_at
                    ? formatDate(game.last_synced_from_bgg_at)
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
