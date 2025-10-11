import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EventCreationScreen from '../screens/EventCreationScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import GameCatalogScreen from '../screens/GameCatalogScreen';
import GameDetailScreen from '../screens/GameDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Store
import {usePartyStore} from '../../shared/store/usePartyStore';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#6b7280',
      }}>
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Events" 
        component={EventCreationScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Games" 
        component={GameCatalogScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="gamepad2" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const user = usePartyStore(state => state.user);
  const isFirstLaunch = usePartyStore(state => state.isFirstLaunch);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
          }}>
          {!user ? (
            <>
              {isFirstLaunch && (
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              )}
              <Stack.Screen name="Auth" component={AuthScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabNavigator} />
              <Stack.Screen 
                name="EventDetail" 
                component={EventDetailScreen}
                options={{
                  headerShown: true,
                  headerTitle: 'Event Details',
                  gestureEnabled: true,
                }}
              />
              <Stack.Screen 
                name="GameDetail" 
                component={GameDetailScreen}
                options={{
                  headerShown: true,
                  headerTitle: 'Game Details',
                  gestureEnabled: true,
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default AppNavigator;