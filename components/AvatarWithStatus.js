import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function AvatarWithStatus({ uri, size = 52, online, showStatus = true, style }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const dotSize = Math.max(10, size * 0.24);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLORS.card,
        }}
      />
      {showStatus && (
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: online ? COLORS.online : COLORS.offline,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    dot: {
      position: 'absolute',
      borderWidth: 2,
      borderColor: COLORS.white,
    },
  });
