import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { apiGet } from "../../lib/api";


type User = {
  id: string;
  email?: string;
  tier?: string;
  tierActive?: boolean;
};


type AuthContextType = {
  user: User | null;
  isAuthed: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
};


const AuthContext =
  createContext<AuthContextType | undefined>(undefined);



export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {


  const [user, setUserState] =
    useState<User | null>(null);


  const [loading, setLoading] =
    useState(true);



  /**
   * =========================
   * RESTORE REAL SESSION
   * =========================
   */
  useEffect(() => {

    async function hydrateAuth() {

      const token =
        localStorage.getItem("token");


      if (!token) {

        setUserState(null);
        setLoading(false);

        return;
      }



      try {

        const res =
          await apiGet("/auth/me");


        const nextUser =
          res?.user as User | undefined;


        if (nextUser) {

          setUserState(nextUser);

          localStorage.setItem(
            "user",
            JSON.stringify(nextUser)
          );

        } else {

          logout();

        }


      } catch {

        logout();

      } finally {

        setLoading(false);

      }

    }


    hydrateAuth();

  }, []);



  /**
   * =========================
   * SET USER AFTER LOGIN
   * =========================
   */
  function setUser(user: User | null) {

    setUserState(user);


    if (user) {

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

    } else {

      localStorage.removeItem("user");
      localStorage.removeItem("token");

    }

  }



  /**
   * =========================
   * LOGOUT
   * =========================
   */
  function logout() {

    setUserState(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");

  }



  const value: AuthContextType = {

    user,

    isAuthed:
  !!user,

    loading,

    setUser,

    logout,

  };



  return (

    <AuthContext.Provider value={value}>

      {children}

    </AuthContext.Provider>

  );

}



export function useAuth() {

  const ctx =
    useContext(AuthContext);


  if (!ctx) {

    throw new Error(
      "useAuth must be used inside AuthProvider"
    );

  }


  return ctx;

}