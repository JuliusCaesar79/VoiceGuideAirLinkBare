// app/screens/TutorialScreen.tsx
// First-launch onboarding (also reachable later from Home's "?" icon).
// Uses the same brand yellow/black as the rest of the app (a separate
// teal accent was tried and dropped — the user wanted it to look
// consistent with the app, not stand apart from it).
// No animation library added: transitions use React Native's built-in
// Animated + LayoutAnimation, same tools already used across the app.

import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  PanResponder,
  Platform,
  UIManager,
  LayoutAnimation,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { fontSize, fontWeight, useTheme, type ThemeColors } from "../theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  onFinish: () => void;
};

const STEPS = [
  { icon: "👋", titleKey: "tutorial.step1Title", bodyKey: "tutorial.step1Body" },
  { icon: "🎙️", titleKey: "tutorial.step2Title", bodyKey: "tutorial.step2Body" },
  { icon: "🎧", titleKey: "tutorial.step3Title", bodyKey: "tutorial.step3Body" },
  { icon: "✅", titleKey: "tutorial.step4Title", bodyKey: "tutorial.step4Body" },
] as const;

function useSpring() {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.timing(scale, { toValue: 0.93, duration: 90, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 9 }).start();
  return { scale, onPressIn, onPressOut };
}

export default function TutorialScreen({ onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const nextSpring = useSpring();

  const [stepIndex, setStepIndex] = useState(0);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateX = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(1)).current;
  const animatingRef = useRef(false);

  const transitionTo = (nextIndex: number, direction: 1 | -1) => {
    if (animatingRef.current) return;
    if (nextIndex < 0 || nextIndex > STEPS.length - 1) return;
    animatingRef.current = true;

    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(contentTranslateX, {
        toValue: direction * -30,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStepIndex(nextIndex);
      contentTranslateX.setValue(direction * 30);
      contentScale.setValue(0.95);

      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(contentTranslateX, {
          toValue: 0,
          useNativeDriver: true,
          speed: 16,
          bounciness: 8,
        }),
        Animated.spring(contentScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 16,
          bounciness: 8,
        }),
      ]).start(() => {
        animatingRef.current = false;
      });
    });
  };

  const goNext = () => {
    if (isLast) {
      onFinish();
      return;
    }
    transitionTo(stepIndex + 1, 1);
  };

  const goBack = () => {
    if (isFirst) return;
    transitionTo(stepIndex - 1, -1);
  };

  // PanResponder.create runs once (captured in a ref) — its handlers must
  // not close over goNext/goBack directly, or they'd keep reading the
  // stepIndex from the very first render forever (same stale-closure
  // pitfall fixed in SlideToConfirm.tsx). Routing through refs reassigned
  // every render keeps them reading the live functions.
  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;
  const goBackRef = useRef(goBack);
  goBackRef.current = goBack;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 14 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -50) {
          goNextRef.current();
        } else if (gesture.dx > 50) {
          goBackRef.current();
        }
      },
    })
  ).current;

  const step = STEPS[stepIndex];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.topRow}>
        {!isLast && (
          <Pressable
            onPress={onFinish}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>{t("tutorial.skip")}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.content} {...panResponder.panHandlers}>
        <Animated.View
          style={{
            alignItems: "center",
            opacity: contentOpacity,
            transform: [{ translateX: contentTranslateX }, { scale: contentScale }],
          }}
        >
          <View style={styles.iconBadge}>
            <Text style={styles.iconEmoji}>{step.icon}</Text>
          </View>
          <Text
            style={styles.title}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {t(step.titleKey)}
          </Text>
          <Text style={styles.body}>{t(step.bodyKey)}</Text>
        </Animated.View>
      </View>

      <View style={styles.dotsRow}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === stepIndex && styles.dotActive]} />
        ))}
      </View>

      <View
        style={[
          styles.buttonRow,
          { paddingBottom: Math.max(16, insets.bottom + 16) },
        ]}
      >
        <Pressable
          onPress={goBack}
          disabled={isFirst}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[styles.backBtn, isFirst && styles.backBtnHidden]}
        >
          <Text style={styles.backBtnText}>{t("tutorial.back")}</Text>
        </Pressable>

        <Animated.View style={{ transform: [{ scale: nextSpring.scale }] }}>
          <View style={styles.shadowStack}>
            <View style={styles.fakeShadow} />
            <Pressable
              style={styles.nextBtn}
              onPress={goNext}
              onPressIn={nextSpring.onPressIn}
              onPressOut={nextSpring.onPressOut}
            >
              <Text style={styles.nextBtnText}>
                {isLast ? t("tutorial.start") : t("tutorial.next")}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.white,
    },

    topRow: {
      minHeight: 44,
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: 24,
      paddingTop: 4,
    },
    skipBtn: {
      paddingVertical: 8,
      paddingHorizontal: 6,
    },
    skipText: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.bold,
      color: colors.gray500,
    },

    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 36,
    },
    iconBadge: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.highlightYellow,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    iconEmoji: {
      fontSize: 44,
    },
    title: {
      fontSize: fontSize.hero,
      fontWeight: fontWeight.extraBold,
      color: colors.textPrimary,
      textAlign: "center",
      marginBottom: 12,
    },
    body: {
      fontSize: fontSize.md,
      color: colors.gray500,
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: 8,
    },

    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
      backgroundColor: colors.gray100,
    },
    dotActive: {
      width: 24,
      backgroundColor: colors.brandYellow,
    },

    buttonRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 32,
      paddingTop: 12,
    },
    backBtn: {
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    backBtnHidden: {
      opacity: 0,
    },
    backBtnText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: colors.textPrimary,
    },

    // Flat offset "fake shadow" instead of native elevation/shadow* —
    // Android's native drop shadow rendered an unreliable corner glitch
    // on this project (see HomeScreen).
    shadowStack: {
      position: "relative",
    },
    fakeShadow: {
      position: "absolute",
      top: 5,
      left: 0,
      right: 0,
      bottom: -5,
      borderRadius: 16,
      backgroundColor: "rgba(0,0,0,0.16)",
    },
    nextBtn: {
      minWidth: 140,
      backgroundColor: colors.brandYellow,
      paddingVertical: 16,
      paddingHorizontal: 28,
      borderRadius: 16,
      alignItems: "center",
    },
    nextBtnText: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.extraBold,
      color: colors.brandBlack,
    },
  });
}
