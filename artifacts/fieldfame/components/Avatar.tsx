import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type AvatarProps = {
  initials: string;
  size?: number;
  highlighted?: boolean;
};

export function Avatar({
  initials,
  size = 42,
  highlighted = false,
}: AvatarProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.ring,
        {
          width: size + 4,
          height: size + 4,
          borderColor: highlighted ? colors.primary : colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            backgroundColor: highlighted ? colors.primary : colors.secondary,
          },
        ]}
      >
        <Text
          style={[
            styles.initials,
            {
              color: highlighted
                ? colors.primaryForeground
                : colors.secondaryForeground,
              fontSize: size * 0.32,
            },
          ]}
        >
          {initials}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 1.5,
    borderRadius: 999,
    padding: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
});
