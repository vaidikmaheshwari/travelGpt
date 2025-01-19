import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
// Use any suitable icon library

export const GreetingTextComponent = () => {
  return (
    <View style={styles.container}>
      {/* Greeting Text */}
      <Text style={styles.greetingText}>
        Hi there! <Text style={styles.waveEmoji}>👋</Text> My name is Tratoli.
        How can I assist you today?
      </Text>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {[
          {label: 'Holiday', icon: 'airplane'},
          {label: 'Flight', icon: 'paper-plane'},
          {label: 'Transfer', icon: 'car'},
          {label: 'Activity', icon: 'bicycle'},
          {label: 'Hotel', icon: 'bed'},
        ].map((item, index) => (
          <TouchableOpacity key={index} style={styles.option}>
            <Text style={styles.optionText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  greetingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginBottom: 24,
    lineHeight: 24,
  },
  waveEmoji: {
    fontSize: 18,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16, // Use gap for spacing (if using React Native Web)
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginHorizontal: 8,
    marginVertical: 8,
    flexDirection: 'row',
  },
  optionText: {
    fontSize: 14,
    color: '#6e6e6e',
    marginLeft: 8,
  },
});
