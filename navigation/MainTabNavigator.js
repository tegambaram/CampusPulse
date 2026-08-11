import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { SHADOW } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const guardGuest = (isGuest, navigation) => (e) => {
  if (!isGuest) return;
  e.preventDefault();
  Alert.alert('Login required', 'Create an account or log in to use this feature.', [
    { text: 'Not now', style: 'cancel' },
    { text: 'Login', onPress: () => navigation.navigate('Login') },
  ]);
};

const Tab = createBottomTabNavigator();

function CreateTabButton({ children, onPress, COLORS, styles }) {
  return (
    <Pressable onPress={onPress} style={styles.fabWrap}>
      <LinearGradient
        colors={[COLORS.primaryLight, COLORS.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fab}
      >
        {children}
      </LinearGradient>
    </Pressable>
  );
}

export default function MainTabNavigator({ navigation }) {
  const { isGuest } = useAuth();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Search: focused ? 'search' : 'search-outline',
            Messages: focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="Create"
        component={CreatePostScreen}
        listeners={({ navigation: tabNavigation }) => ({
          tabPress: (e) => {
            guardGuest(isGuest, navigation)(e);
            // Tapping the tab button directly (as opposed to being routed here with an
            // editPost param from PostDetailsScreen) always means "start a new post".
            tabNavigation.setParams({ editPost: undefined });
          },
        })}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => <Ionicons name="add" size={28} color={COLORS.white} />,
          tabBarButton: (props) => <CreateTabButton {...props} COLORS={COLORS} styles={styles} />,
        }}
      />
      <Tab.Screen name="Messages" component={MessagesScreen} listeners={{ tabPress: guardGuest(isGuest, navigation) }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    tabBar: {
      height: 66,
      paddingBottom: 10,
      paddingTop: 8,
      backgroundColor: COLORS.surface,
      borderTopWidth: 0,
      ...SHADOW.medium,
    },
    tabBarLabel: {
      fontSize: 11,
      fontWeight: '600',
    },
    fabWrap: {
      top: -22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOW.strong,
      shadowColor: COLORS.primary,
      borderWidth: 4,
      borderColor: COLORS.white,
    },
  });
