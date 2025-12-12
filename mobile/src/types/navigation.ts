import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type GamesStackParamList = {
  GameList: undefined;
  GameDetail: { gameId: string };
  GameChat: { gameId: string; gameName: string; sessionId?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Games: NavigatorScreenParams<GamesStackParamList>;
  Chat: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
