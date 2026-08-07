import type { ReactNode } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
}

export function Screen({ children, scroll = false, className = '' }: ScreenProps) {
  const Container = scroll ? ScrollView : View;
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Container
        className={`flex-1 bg-background ${className}`}
        {...(scroll ? { contentContainerStyle: { flexGrow: 1 } } : {})}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}
