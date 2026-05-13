import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BottomSheetAction, BottomSheetProps } from '@/components/bottom-sheet/types';

const OFFSCREEN_SLIDE = 420;
const OPEN_MS = 280;
const CLOSE_MS = 220;

export function BottomSheet({
  open,
  onOpenChange,
  title,
  message,
  children,
  actions,
  closeOnAction = true,
  closeOnBackdropPress = true,
}: BottomSheetProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [modalVisible, setModalVisible] = useState(open);
  const progress = useRef(new Animated.Value(0)).current;
  const prevOpen = useRef(false);

  const palette = useMemo(
    () =>
      isDark
        ? {
            sheet: '#2C2C2E',
            border: '#48484A',
            title: '#F2F2F7',
            message: '#AEAEB2',
            backdrop: 'rgba(0,0,0,0.55)',
            hairline: '#48484A',
            defaultLabel: '#0A84FF',
            cancelBg: '#3A3A3C',
            cancelLabel: '#F2F2F7',
            destructive: '#FF453A',
          }
        : {
            sheet: '#F2F2F7',
            border: '#C6C6C8',
            title: '#1A1A1A',
            message: '#636366',
            backdrop: 'rgba(0,0,0,0.35)',
            hairline: '#C6C6C8',
            defaultLabel: '#007AFF',
            cancelBg: '#FFFFFF',
            cancelLabel: '#1A1A1A',
            destructive: '#D70015',
          },
    [isDark],
  );

  const maxSheetHeight = useMemo(
    () => Math.min(windowHeight * 0.88, windowHeight - insets.top - 24),
    [windowHeight, insets.top],
  );

  useEffect(() => {
    if (open && !prevOpen.current) {
      setModalVisible(true);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: OPEN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (!open && prevOpen.current) {
      Animated.timing(progress, {
        toValue: 0,
        duration: CLOSE_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setModalVisible(false);
        }
      });
    }
    prevOpen.current = open;
  }, [open, progress]);

  useEffect(() => {
    if (!open || !modalVisible) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onOpenChange(false);
      return true;
    });
    return () => sub.remove();
  }, [open, modalVisible, onOpenChange]);

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const sheetTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [OFFSCREEN_SLIDE, 0],
  });

  const requestClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const onBackdropPress = useCallback(() => {
    if (closeOnBackdropPress) {
      requestClose();
    }
  }, [closeOnBackdropPress, requestClose]);

  const handleActionPress = useCallback(
    (action: BottomSheetAction) => {
      action.onPress?.();
      if (closeOnAction) {
        requestClose();
      }
    },
    [closeOnAction, requestClose],
  );

  const actionLabelStyle = useCallback(
    (variant: BottomSheetAction['variant']) => {
      if (variant === 'destructive') {
        return { color: palette.destructive };
      }
      return { color: palette.defaultLabel };
    },
    [palette.cancelLabel, palette.defaultLabel, palette.destructive],
  );

  return (
    <Modal
      transparent
      animationType="none"
      visible={modalVisible}
      onRequestClose={requestClose}
      statusBarTranslucent>
      <View style={styles.root} pointerEvents="box-none">
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity, backgroundColor: palette.backdrop }]}
          pointerEvents={open ? 'auto' : 'none'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onBackdropPress} accessibilityRole="button" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetWrap,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
          pointerEvents="box-none">
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: palette.sheet,
                borderColor: palette.border,
                maxHeight: maxSheetHeight,
              },
            ]}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}>
              {title ? (
                <Text style={[styles.title, { color: palette.title }]} accessibilityRole="header">
                  {title}
                </Text>
              ) : null}
              {message ? <Text style={[styles.message, { color: palette.message }]}>{message}</Text> : null}
              {children}
            </ScrollView>
            {actions?.length ? (
              <View style={[styles.actions, { borderTopColor: palette.hairline }]}>
                {actions.map((action, index) => {
                  const variant = action.variant ?? 'default';
                  const isLast = index === actions.length - 1;
                  const showDivider = !isLast;
                  return (
                    <Pressable
                      key={`${action.label}-${index}`}
                      accessibilityRole="button"
                      onPress={() => handleActionPress(action)}
                      style={({ pressed }) => [
                        styles.actionRow,
                        {
                          backgroundColor: 'transparent',
                          opacity: pressed ? 0.82 : 1,
                        },
                        showDivider
                          ? {
                              borderBottomWidth: StyleSheet.hairlineWidth,
                              borderBottomColor: palette.hairline,
                            }
                          : {},
                      ]}>
                      <Text style={[styles.actionLabel, actionLabelStyle(variant)]}>{action.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetWrap: {
    paddingHorizontal: 10,
    ...Platform.select({
      ios: { paddingBottom: 2 },
      default: {},
    }),
  },
  sheet: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 4,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 8,
  },
  actions: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
});
