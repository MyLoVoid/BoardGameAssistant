export interface MockGame {
  id: string;
  name: string;
  bggId: number;
  minPlayers: number;
  maxPlayers: number;
  playTime: number;
  rating: number;
  section: string;
  status: 'active' | 'beta';
  languages: Array<'es' | 'en'>;
}

export const mockGames: MockGame[] = [
  {
    id: 'gloomhaven',
    name: 'Gloomhaven',
    bggId: 174430,
    minPlayers: 1,
    maxPlayers: 4,
    playTime: 120,
    rating: 8.8,
    section: 'BGC',
    status: 'active',
    languages: ['es', 'en'],
  },
  {
    id: 'terraforming-mars',
    name: 'Terraforming Mars',
    bggId: 167791,
    minPlayers: 1,
    maxPlayers: 5,
    playTime: 90,
    rating: 8.4,
    section: 'BGC',
    status: 'active',
    languages: ['es', 'en'],
  },
  {
    id: 'wingspan',
    name: 'Wingspan',
    bggId: 266192,
    minPlayers: 1,
    maxPlayers: 5,
    playTime: 45,
    rating: 8.1,
    section: 'BGC',
    status: 'beta',
    languages: ['en'],
  },
];
