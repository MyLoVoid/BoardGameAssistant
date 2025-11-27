'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GameInfoTab } from '@/components/games/game-info-tab';
import { FAQTab } from '@/components/games/faq-tab';
import { DocumentsTab } from '@/components/games/documents-tab';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import type { Game } from '@/lib/types';

export default function GameDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string | string[] }>();
  const gameId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [documentsRefreshKey, setDocumentsRefreshKey] = useState(0);

  useEffect(() => {
    if (!gameId) {
      return;
    }
    void loadGame(gameId);
  }, [gameId]);

  const loadGame = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.getGame(id);
      setGame(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (!gameId) {
      return;
    }
    void loadGame(gameId);
  };

  const handleDocumentsReload = useCallback(() => {
    setDocumentsRefreshKey((prev) => prev + 1);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/games')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </Button>
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error || 'Game not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/games')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{game.name}</h1>
            <p className="text-muted-foreground mt-1">
              Manage game information, FAQs, and documents
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="home">
          <GameInfoTab game={game} onUpdate={handleRefresh} />
        </TabsContent>

        <TabsContent value="faqs">
          <FAQTab gameId={game.id} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab
            key={documentsRefreshKey}
            gameId={game.id}
            onRefreshRequested={handleDocumentsReload}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
