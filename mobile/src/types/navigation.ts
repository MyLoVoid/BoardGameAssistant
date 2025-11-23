export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type GamesStackParamList = {
  GameList: undefined;
  GameDetail: { gameId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Games: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
