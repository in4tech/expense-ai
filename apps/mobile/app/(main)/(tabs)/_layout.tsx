import { Tabs } from 'expo-router';
import React from 'react';

import { FloatingTabBar } from '@/src/components/floating-tab-bar';
import { useLanguage } from '@/src/i18n';
import { isAndroid } from '@/src/config/dev-mode';

export default function TabLayout() {
  const { dictionary } = useLanguage();

  return (
    <Tabs
      initialRouteName="home"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { paddingBottom: isAndroid ? 120 : 85 },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: dictionary.tabs.home,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: dictionary.tabs.chat,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: dictionary.tabs.settings,
        }}
      />
    </Tabs>
  );
}
