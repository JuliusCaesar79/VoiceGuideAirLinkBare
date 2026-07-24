// app/components/SlideToConfirm.tsx
// "Slide to confirm" control (iPhone-style "slide to power off") used for
// destructive actions where an accidental tap must not trigger them.

import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, PanResponder } from "react-native";

import { colors, fontSize, fontWeight } from "../theme";

type Props = {
  label: string;
  hint: string;
  onConfirm: () => void;
  trackColor?: string;
};

const THUMB_SIZE = 52;
const THUMB_MARGIN = 4;
const CONFIRM_THRESHOLD = 0.82; // fraction of the track the thumb must cross

export default function SlideToConfirm({
  label,
  hint,
  onConfirm,
  trackColor = colors.danger,
}: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const pan = useRef(new Animated.Value(0)).current;
  const maxTravel = Math.max(trackWidth - THUMB_SIZE - THUMB_MARGIN * 2, 1);

  // PanResponder.create runs once (captured in a ref), so its handlers would
  // otherwise close over maxTravel from the very first render — when the
  // track's real width isn't known yet and maxTravel falls back to 1. That
  // made a single touch (a few px of jitter) instantly cross the 82%
  // threshold. Routing through a ref that's refreshed every render keeps
  // the handlers reading the current, real value instead of a stale one.
  const maxTravelRef = useRef(maxTravel);
  maxTravelRef.current = maxTravel;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        pan.setValue(Math.min(Math.max(gesture.dx, 0), maxTravelRef.current));
      },
      onPanResponderRelease: (_, gesture) => {
        const travel = maxTravelRef.current;
        const traveled = Math.min(Math.max(gesture.dx, 0), travel);
        if (travel > 0 && traveled / travel >= CONFIRM_THRESHOLD) {
          Animated.timing(pan, {
            toValue: travel,
            duration: 120,
            useNativeDriver: false,
          }).start(() => {
            onConfirm();
            setTimeout(() => pan.setValue(0), 400);
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
            speed: 20,
            bounciness: 8,
          }).start();
        }
      },
    })
  ).current;

  const labelOpacity = pan.interpolate({
    inputRange: [0, maxTravel],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View
      style={[styles.track, { backgroundColor: trackColor }]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <Animated.Text style={[styles.hint, { opacity: labelOpacity }]} numberOfLines={1}>
        {hint}
      </Animated.Text>

      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.thumb, { transform: [{ translateX: pan }] }]}
      >
        <View style={styles.chevronRow}>
          <View style={[styles.chevron, { borderLeftColor: trackColor }]} />
          <View style={[styles.chevron, styles.chevronSecond, { borderLeftColor: trackColor }]} />
        </View>
      </Animated.View>

      {/* Off-screen for accessibility tools / screen readers */}
      <Text style={styles.srOnlyLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  hint: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.4,
  },
  thumb: {
    position: "absolute",
    left: THUMB_MARGIN,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  // Two CSS-border triangles instead of a text glyph — a font's ">>"
  // character has uneven left/right bearing that never sits dead-center
  // in the circle; a drawn triangle is pure geometry, so it always does.
  chevronRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  chevron: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 14,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  chevronSecond: {
    marginLeft: 4,
  },
  srOnlyLabel: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});
