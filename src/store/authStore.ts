import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserRole = 'SELLER' | 'PERFORMER' | 'BOTH' | 'ADMIN';
type ActiveMode = 'SELLER' | 'PERFORMER';

interface User {
  id: string;
  email: string;
  username?: string;
  name: string | null;
  avatarUrl?: string | null;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  activeMode: ActiveMode | null;
  hasSeenSellerOnboarding: boolean;
  hasSeenExecutorOnboarding: boolean;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setActiveMode: (mode: ActiveMode) => void;
  setOnboardingSeen: (mode: ActiveMode) => void;
  setTokens: (token: string, refreshToken: string) => void;
  init: () => void;
  canSwitchToSeller: () => boolean;
  canSwitchToPerformer: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      activeMode: null,
      hasSeenSellerOnboarding: false,
      hasSeenExecutorOnboarding: false,

      login: (user, token, refreshToken) => {
        let initialMode: ActiveMode | null = null;
        if (user.role === 'BOTH') {
          const savedMode = typeof window !== 'undefined' 
            ? localStorage.getItem('activeMode') as ActiveMode | null
            : null;
          initialMode = savedMode || 'SELLER';
        } else if (user.role === 'SELLER') {
          initialMode = 'SELLER';
        } else if (user.role === 'PERFORMER') {
          initialMode = 'PERFORMER';
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
          if (initialMode) {
            localStorage.setItem('activeMode', initialMode);
          }
        }
        set({ user, token, refreshToken: refreshToken || null, isAuthenticated: true, activeMode: initialMode });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('activeMode');
          localStorage.removeItem('hasSeenSellerOnboarding');
          localStorage.removeItem('hasSeenExecutorOnboarding');
        }
        set({ 
          user: null, 
          token: null, 
          refreshToken: null,
          isAuthenticated: false, 
          activeMode: null,
          hasSeenSellerOnboarding: false,
          hasSeenExecutorOnboarding: false,
        });
      },

      updateUser: (user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(user));
        }
        let newMode: ActiveMode | null = get().activeMode;
        if (user.role === 'SELLER' && get().activeMode === 'PERFORMER') {
          newMode = 'SELLER';
        } else if (user.role === 'PERFORMER' && get().activeMode === 'SELLER') {
          newMode = 'PERFORMER';
        }
        set({ user, activeMode: newMode });
      },

      setActiveMode: (mode) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('activeMode', mode);
        }
        set({ activeMode: mode });
      },

      setOnboardingSeen: (mode) => {
        if (typeof window !== 'undefined') {
          if (mode === 'SELLER') {
            localStorage.setItem('hasSeenSellerOnboarding', 'true');
            set({ hasSeenSellerOnboarding: true });
          } else if (mode === 'PERFORMER') {
            localStorage.setItem('hasSeenExecutorOnboarding', 'true');
            set({ hasSeenExecutorOnboarding: true });
          }
        }
      },

      setTokens: (token, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', refreshToken);
        }
        set({ token, refreshToken });
      },

      canSwitchToSeller: () => {
        const { user } = get();
        return user ? (user.role === 'SELLER' || user.role === 'BOTH') : false;
      },

      canSwitchToPerformer: () => {
        const { user } = get();
        return user ? (user.role === 'PERFORMER' || user.role === 'BOTH') : false;
      },

      init: () => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          const refreshToken = localStorage.getItem('refreshToken');
          const userStr = localStorage.getItem('user');
          const savedMode = localStorage.getItem('activeMode') as ActiveMode | null;
          const hasSeenSeller = localStorage.getItem('hasSeenSellerOnboarding') === 'true';
          const hasSeenExecutor = localStorage.getItem('hasSeenExecutorOnboarding') === 'true';
          
          if (token && userStr) {
            try {
              const user = JSON.parse(userStr);
              let activeMode: ActiveMode | null = null;
              
              if (user.role === 'BOTH') {
                activeMode = savedMode || 'SELLER';
              } else if (user.role === 'SELLER') {
                activeMode = 'SELLER';
              } else if (user.role === 'PERFORMER') {
                activeMode = 'PERFORMER';
              }
              
              set({ 
                user, 
                token, 
                refreshToken: refreshToken || null,
                isAuthenticated: true, 
                activeMode,
                hasSeenSellerOnboarding: hasSeenSeller,
                hasSeenExecutorOnboarding: hasSeenExecutor,
              });
            } catch (e) {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              localStorage.removeItem('activeMode');
              localStorage.removeItem('hasSeenSellerOnboarding');
              localStorage.removeItem('hasSeenExecutorOnboarding');
            }
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        activeMode: state.activeMode,
        hasSeenSellerOnboarding: state.hasSeenSellerOnboarding,
        hasSeenExecutorOnboarding: state.hasSeenExecutorOnboarding,
      }),
    }
  )
);
