import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppStore } from '@/context/AppStore';
import { useColors } from '@/hooks/useColors';

export function StorageNotice() {
  const colors = useColors();
  const { persistenceError } = useAppStore();
  if (!persistenceError) return null;

  return (
    <View
      accessibilityRole="alert"
      style={[styles.notice, { backgroundColor: colors.accent }]}
    >
      <Feather name="alert-circle" size={16} color={colors.accentForeground} />
      <Text style={[styles.text, { color: colors.accentForeground }]}>
        {persistenceError}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderRadius: 14,
    padding: 12,
    gap: 9,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  text: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 17,
  },
});
