export type SignInCredentials = { email: string; password: string };
export type SignInAction = (email: string, password: string) => Promise<void>;

/** Both credential entry and the review demo pass through the real session door. */
export const signInAndDestination = async (
  signIn: SignInAction,
  credentials: SignInCredentials
): Promise<'/actions'> => {
  await signIn(credentials.email, credentials.password);
  return '/actions';
};
