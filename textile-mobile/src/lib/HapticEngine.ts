import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * SOVEREIGN HAPTIC ENGINE v1.0
 * Unified tactile feedback for industrial operations.
 */
class HapticEngine {
  private static async trigger(type: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType) {
    if (Platform.OS === 'web') return;
    
    try {
      if (Object.values(Haptics.ImpactFeedbackStyle).includes(type as any)) {
        await Haptics.impactAsync(type as Haptics.ImpactFeedbackStyle);
      } else {
        await Haptics.notificationAsync(type as Haptics.NotificationFeedbackType);
      }
    } catch (e) {
      console.warn('HAPTIC_ENGINE_BUSY');
    }
  }

  /**
   * LIGHT_IMPACT: Used for rapid feedback like scanner detecting a prefix.
   */
  static light() {
    this.trigger(Haptics.ImpactFeedbackStyle.Light);
  }

  /**
   * MEDIUM_IMPACT: Used for UI interactions like button taps.
   */
  static medium() {
    this.trigger(Haptics.ImpactFeedbackStyle.Medium);
  }

  /**
   * HEAVY_IMPACT: Used for critical selections or stopping a process.
   */
  static heavy() {
    this.trigger(Haptics.ImpactFeedbackStyle.Heavy);
  }

  /**
   * NOTIFY_SUCCESS: Used when a sync or transaction is committed.
   */
  static success() {
    this.trigger(Haptics.NotificationFeedbackType.Success);
  }

  /**
   * NOTIFY_ERROR: Used when an operation fails or is unauthorized.
   */
  static error() {
    this.trigger(Haptics.NotificationFeedbackType.Error);
  }

  /**
   * NOTIFY_WARNING: Used for validation warnings.
   */
  static warning() {
    this.trigger(Haptics.NotificationFeedbackType.Warning);
  }
}

export default HapticEngine;
