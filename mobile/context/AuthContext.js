import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({
  userToken: null,
  isLoading: true,
  signIn: async (token, email) => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const t = await AsyncStorage.getItem('userToken');
        setUserToken(t);
      } catch (e) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const signIn = async (token, email) => {
    await AsyncStorage.setItem('userToken', token);
    if (email) await AsyncStorage.setItem('userEmail', email);
    setUserToken(token);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userEmail');
    setUserToken(null);
  };

  return (
    <AuthContext.Provider value={{ userToken, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
