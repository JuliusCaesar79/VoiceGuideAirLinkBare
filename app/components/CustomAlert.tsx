// app/components/CustomAlert.tsx
// Branded replacement for the native Alert.alert() popup: same
// title/message/buttons shape, styled with the app's yellow/black theme.

import React, { useEffect, useRef } from "react";
import { Modal, View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { colors, fontSize, fontWeight } from "../theme";
import type { AlertButton } from "./alertBridge";

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  onDismiss: () => void;
};

export default function CustomAlert({ visible, title, message, buttons, onDismiss }: Props) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.9);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scale, opacity]);

  const stacked = buttons.length > 2;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <View style={styles.accent} />

          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={stacked ? styles.buttonsColumn : styles.buttonsRow}>
            {buttons.map((btn, idx) => {
              const isDestructive = btn.style === "destructive";
              const isCancel = btn.style === "cancel";
              return (
                <Pressable
                  key={idx}
                  style={[
                    styles.button,
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive,
                    !stacked && styles.buttonFlex,
                    !stacked && idx > 0 && styles.buttonMarginLeft,
                    stacked && idx > 0 && styles.buttonMarginTop,
                  ]}
                  onPress={() => {
                    onDismiss();
                    btn.onPress?.();
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel && styles.buttonTextCancel,
                      isDestructive && styles.buttonTextDestructive,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 22,
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  accent: {
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.brandYellow,
    marginBottom: 14,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extraBold,
    color: colors.brandBlack,
    textAlign: "center",
  },
  message: {
    marginTop: 10,
    fontSize: fontSize.md,
    color: colors.gray500,
    textAlign: "center",
    lineHeight: 20,
  },
  buttonsRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 20,
  },
  buttonsColumn: {
    width: "100%",
    marginTop: 20,
  },
  button: {
    backgroundColor: colors.brandYellow,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonFlex: {
    flex: 1,
  },
  buttonMarginLeft: {
    marginLeft: 10,
  },
  buttonMarginTop: {
    marginTop: 10,
  },
  buttonCancel: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray100,
  },
  buttonDestructive: {
    backgroundColor: colors.danger,
  },
  buttonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extraBold,
    color: colors.brandBlack,
  },
  buttonTextCancel: {
    color: colors.gray500,
  },
  buttonTextDestructive: {
    color: colors.white,
  },
});
