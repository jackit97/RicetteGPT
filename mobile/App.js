import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import RecipeListScreen from './screens/RecipeListScreen';
import RecipeDetailScreen from './screens/RecipeDetailScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MyRecipesScreen from './screens/MyRecipesScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { theme } from './theme';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthedTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.colors.card },
        headerTitleStyle: { fontWeight: '800', color: theme.colors.text },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 62,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarLabelStyle: { fontWeight: '800', fontSize: 12 },
        tabBarIcon: ({ color, size }) => {
          const icon = route.name === 'Home'
            ? 'home'
            : route.name === 'Camera'
              ? 'camera'
              : 'bookmark';
          return <Ionicons name={icon} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Ricette GPT' }} />
      <Tab.Screen name="Camera" component={CameraScreen} options={{ title: 'Fotocamera' }} />
      <Tab.Screen name="MyRecipes" component={MyRecipesScreen} options={{ title: 'Salvate', tabBarLabel: 'Salvate' }} />
    </Tab.Navigator>
  );
}

function AppRouter() {
  const { userToken, isLoading } = useAuth();
  if (isLoading) return null;

  return (
    userToken == null ? (
      <AuthStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.card },
          headerTitleStyle: { fontWeight: '800', color: theme.colors.text },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: 'Accedi' }} />
        <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registrati' }} />
      </AuthStack.Navigator>
    ) : (
      <RootStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.card },
          headerTitleStyle: { fontWeight: '800', color: theme.colors.text },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <RootStack.Screen name="Tabs" component={AuthedTabs} options={{ headerShown: false }} />
        <RootStack.Screen name="RecipeList" component={RecipeListScreen} options={{ title: 'Suggerimenti' }} />
        <RootStack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: 'Ricetta' }} />
      </RootStack.Navigator>
    )
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer
        theme={{
          dark: false,
          colors: {
            primary: theme.colors.primary,
            background: theme.colors.bg,
            card: theme.colors.card,
            text: theme.colors.text,
            border: theme.colors.border,
            notification: theme.colors.primary,
          },
        }}
      >
        <StatusBar style="dark" />
        <AppRouter />
      </NavigationContainer>
    </AuthProvider>
  );
}
