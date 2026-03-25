import { useLocalStorage } from './useLocalStorage';

export function useUserAvatars() {
  const [avatars, setAvatars] = useLocalStorage<Record<string, string>>('ribercred_user_avatars', {});

  const setAvatar = (userId: string, base64: string) => {
    setAvatars(prev => ({ ...prev, [userId]: base64 }));
  };

  const getAvatar = (userId: string): string | undefined => avatars[userId];

  return { avatars, setAvatar, getAvatar };
}
