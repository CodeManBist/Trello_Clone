import {
    createContext,
    useContext,
    useState,
    type ReactNode,
  } from "react";
  
  type User = {
    id: string;
    username: string;
    email: string;
  };
  
  type AuthContextType = {
    user: User | null;
    setUser: (user: User | null) => void;
    logout: () => void;
  };
  
  const AuthContext = createContext<AuthContextType | undefined>(
    undefined
  );
  
  export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<User | null>(() => {
      const storedUser = localStorage.getItem("user");
  
      if (!storedUser) {
        return null;
      }
  
      try {
        return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem("user");
        return null;
      }
    });
  
    const setUser = (user: User | null) => {
      setUserState(user);
  
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }
    };
  
    const logout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUserState(null);
    };
  
    return (
      <AuthContext.Provider
        value={{
          user,
          setUser,
          logout,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }
  
  export function useAuth() {
    const context = useContext(AuthContext);
  
    if (!context) {
      throw new Error("useAuth must be used inside AuthProvider");
    }
  
    return context;
  }