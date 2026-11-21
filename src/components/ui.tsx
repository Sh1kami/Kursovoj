import type { ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type TextProps } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { usePalette } from '../theme';
import { photoUri } from '../photos';
import type { Item } from '../types';

export function Label({ style, ...props }: TextProps) {
  const p = usePalette();
  return <Text {...props} style={[styles.label, { color: p.text }, style]} />;
}

export function Muted({ style, ...props }: TextProps) {
  const p = usePalette();
  return <Text {...props} style={[styles.muted, { color: p.muted }, style]} />;
}

export function Heading({ children }: { children: ReactNode }) {
  return <Label accessibilityRole="header" style={styles.heading}>{children}</Label>;
}

export function Icon({ name, size = 19, color }: { name: SymbolViewProps['name']; size?: number; color?: string }) {
  const palette = usePalette();
  return <SymbolView name={name} tintColor={color ?? palette.accent} size={size} accessible={false} />;
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.page}>
      {children}
    </ScrollView>
  );
}

export function Group({ children }: { children: ReactNode }) {
  const p = usePalette();
  return <View style={[styles.group, { backgroundColor: p.surface, borderColor: p.line }]}>{children}</View>;
}

type ActionTone = 'primary' | 'text' | 'danger';

export function Action({ title, action, tone = 'text', disabled = false, icon }: {
  title: string;
  action: () => void;
  tone?: ActionTone;
  disabled?: boolean;
  icon?: SymbolViewProps['name'];
}) {
  const p = usePalette();
  const filled = tone === 'primary';
  const color = filled ? p.onAccent : tone === 'danger' ? p.danger : p.accent;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
      onPress={action} style={({ pressed }) => [
        styles.action, { backgroundColor: filled ? p.accent : 'transparent' },
        { opacity: disabled ? 0.47 : pressed ? 0.70 : 1 },
      ]}>
      {icon && <Icon name={icon} color={color} />}
      <Label style={{ color, fontWeight: '600', textAlign: 'center' }}>{title}</Label>
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  const p = usePalette();
  return (
    <View style={styles.field}>
      <Label style={styles.fieldLabel}>{label}</Label>
      <TextInput {...props} accessibilityLabel={label} accessibilityHint={hint}
        placeholderTextColor={p.muted} selectionColor={p.accent}
        style={[styles.input, props.multiline && styles.multiline,
          { color: p.text, backgroundColor: p.surface, borderColor: p.line }, props.style]} />
    </View>
  );
}

export function Chip({ title, selected, onPress }: { title: string; selected: boolean; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={({ pressed }) => [styles.chip,
        { backgroundColor: selected ? p.tint : p.surface, borderColor: selected ? p.accent : p.line },
        pressed && styles.pressed]}>
      {selected && <Icon name="checkmark" size={13} />}
      <Muted style={{ color: selected ? p.accent : p.text, fontWeight: selected ? '600' : '500' }}>{title}</Muted>
    </Pressable>
  );
}

export function Empty({ title, detail, icon, children }: {
  title: string; detail: string; icon: SymbolViewProps['name']; children?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={30} />
      <Label style={{ fontWeight: '600', textAlign: 'center' }}>{title}</Label>
      <Muted style={{ textAlign: 'center' }}>{detail}</Muted>
      {children}
    </View>
  );
}

export function InlineError({ message }: { message: string }) {
  const p = usePalette();
  return <Label accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: p.danger }}>{message}</Label>;
}

export function Loading() {
  const p = usePalette();
  return (
    <View style={styles.center} accessible accessibilityLabel="Відкриваємо каталог" accessibilityState={{ busy: true }}>
      <ActivityIndicator color={p.accent} size="large" />
      <Muted>Відкриваємо каталог…</Muted>
    </View>
  );
}

export function ItemRow({ item, onPress, divided }: { item: Item; onPress: () => void; divided: boolean }) {
  const p = usePalette();
  const uri = photoUri(item.photoName);
  const secondary = item.location ? item.categoryName + ' · ' + item.location : item.categoryName;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={item.name + ', ' + secondary}
      onPress={onPress} style={({ pressed }) => [
        styles.row, { borderBottomWidth: divided ? StyleSheet.hairlineWidth : 0, borderColor: p.line },
        pressed && { backgroundColor: p.tint },
      ]}>
      <View style={[styles.thumbnail, { backgroundColor: p.tint }]}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} /> : <Icon name="archivebox" />}
      </View>
      <View style={styles.rowCopy}>
        <Label style={{ fontWeight: '600' }}>{item.name}</Label>
        <Muted>{secondary}</Muted>
      </View>
      <Icon name="chevron.right" color={p.muted} size={12} />
    </Pressable>
  );
}

export const layout = StyleSheet.create({
  stack: { gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grow: { flex: 1, flexShrink: 1, minWidth: 0 },
  centered: { flex: 1, justifyContent: 'center', padding: 20 },
});

const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, gap: 24, width: '100%', maxWidth: 640, alignSelf: 'center' },
  label: { fontSize: 17 },
  muted: { fontSize: 15 },
  heading: { fontSize: 21, fontWeight: '700', letterSpacing: -0.28 },
  group: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  action: {
    minHeight: 46, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 11,
    justifyContent: 'center', alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  field: { gap: 7 },
  fieldLabel: { fontSize: 15, fontWeight: '600' },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 13, fontSize: 17 },
  multiline: { minHeight: 104, textAlignVertical: 'top' },
  chip: {
    minHeight: 44, borderWidth: 1, borderRadius: 22, maxWidth: '100%',
    paddingHorizontal: 13, paddingVertical: 8, gap: 6, flexDirection: 'row', alignItems: 'center',
  },
  pressed: { opacity: 0.65 },
  empty: { gap: 9, paddingHorizontal: 20, paddingVertical: 26, alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 16 },
  row: { minHeight: 73, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' },
  rowCopy: { flex: 1, flexShrink: 1, gap: 3 },
  thumbnail: { width: 47, height: 47, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
