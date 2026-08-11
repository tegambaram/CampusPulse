import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainTabNavigator from './MainTabNavigator';
import ChatScreen from '../screens/ChatScreen';
import PostDetailsScreen from '../screens/PostDetailsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import BookingScreen from '../screens/BookingScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { colors: COLORS } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="PostDetails" component={PostDetailsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
