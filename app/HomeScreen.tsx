// app/HomeScreen.tsx

import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  onGuidePress: () => void;
  onGuestPress: () => void;
};

// Make sure this file exists:
// /assets/images/logo-voiceguide-airlink.png
const logo = require("../assets/images/logo-voiceguide-airlink.png");

const BRAND_YELLOW = "#FFC226";
const BRAND_BLACK = "#000000";

export default function HomeScreen({ onGuidePress, onGuestPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* MAIN */}
        <View style={styles.main}>
          {/* TOP: Logo + Title */}
          <View style={styles.topSection}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.appName}>Voice Guide AirLink</Text>
            <Text style={styles.tagline}>
              Wireless audio for professional guided tours.
            </Text>
          </View>

          {/* MIDDLE: Role selection */}
          <View style={styles.middleSection}>
            <Text style={styles.subtitle}>Choose your role</Text>

            <Pressable
              style={[styles.buttonBase, styles.buttonGuide]}
              onPress={onGuidePress}
            >
              <Text style={styles.buttonGuideText}>I am a Guide</Text>
              <Text style={styles.buttonHelper}>
                Start a new tour and broadcast your voice.
              </Text>
            </Pressable>

            <Pressable
              style={[styles.buttonBase, styles.buttonGuest]}
              onPress={onGuestPress}
            >
              <Text style={styles.buttonGuestText}>I am a Guest</Text>
              <Text style={styles.buttonHelperLight}>
                Join a tour using the PIN from your guide.
              </Text>
            </Pressable>
          </View>
        </View>

        {/* FOOTER */}
        <View
          style={[
            styles.footerSection,
            // ✅ ensures footer sits ABOVE Android gesture/3-button nav bar
            { paddingBottom: Math.max(10, insets.bottom + 10) },
          ]}
        >
          <Text style={styles.footerText}>Powered by Virgilius Labs</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 32,
    paddingTop: 18, // slightly less: gives a more balanced vertical rhythm
  },

  // Keeps content compact while footer stays at bottom.
  main: {
    flex: 1,
    justifyContent: "center",
  },

  topSection: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: 18,
  },
  logo: {
    width: 170, // slightly reduced for less "crowding" feeling
    height: 170,
  },
  appName: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "700",
    color: BRAND_BLACK,
    textAlign: "center",
  },
  tagline: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },

  middleSection: {
    alignItems: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#444444",
    marginBottom: 14, // a touch more breathing room
  },

  buttonBase: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 7,
  },
  buttonGuide: {
    backgroundColor: BRAND_YELLOW,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonGuest: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: BRAND_YELLOW,
  },

  buttonGuideText: {
    color: BRAND_BLACK,
    fontSize: 18,
    fontWeight: "700",
  },
  buttonGuestText: {
    color: BRAND_YELLOW,
    fontSize: 18,
    fontWeight: "700",
  },
  buttonHelper: {
    marginTop: 4,
    fontSize: 12,
    color: "#111827",
    textAlign: "center",
  },
  buttonHelperLight: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },

  footerSection: {
    alignItems: "center",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
