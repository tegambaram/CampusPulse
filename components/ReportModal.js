import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, FONT, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const REASONS = [
  { key: 'spam', label: 'Spam' },
  { key: 'harassment', label: 'Harassment or bullying' },
  { key: 'scam', label: 'Scam or fraud' },
  { key: 'inappropriate_content', label: 'Inappropriate content' },
  { key: 'fake_profile', label: 'Fake profile' },
  { key: 'other', label: 'Other' },
];

// Bottom-sheet form for reporting a user (reason + optional details), used from both
// PostDetailsScreen (reporting a post's owner) and ChatScreen (reporting who you're chatting
// with). Matches SelectField's bottom-sheet look so it reads as the same design language.
export default function ReportModal({ visible, onClose, onSubmit, submitting }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState('');

  const handleClose = () => {
    setReason(null);
    setDetails('');
    onClose();
  };

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit({ reason, details }, handleClose);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Report this user</Text>
          <Text style={styles.sheetSubtitle}>Your report is confidential and helps keep campus safe.</Text>

          {REASONS.map((r) => (
            <Pressable key={r.key} style={styles.option} onPress={() => setReason(r.key)}>
              <Text style={[styles.optionText, reason === r.key && styles.optionTextActive]}>{r.label}</Text>
              {reason === r.key && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
            </Pressable>
          ))}

          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Add more details (optional)"
            placeholderTextColor={COLORS.textLight}
            style={styles.input}
            multiline
          />

          <Pressable
            style={[styles.submitBtn, !reason && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!reason || submitting}
          >
            {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>Submit Report</Text>}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: COLORS.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: COLORS.surface,
      borderTopLeftRadius: RADIUS.xxl,
      borderTopRightRadius: RADIUS.xxl,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xxxl,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: COLORS.border,
      alignSelf: 'center',
      marginBottom: SPACING.md,
    },
    sheetTitle: {
      fontSize: FONT.h4,
      fontWeight: '700',
      color: COLORS.text,
    },
    sheetSubtitle: {
      fontSize: FONT.tiny,
      color: COLORS.textLight,
      marginTop: 4,
      marginBottom: SPACING.md,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.card,
    },
    optionText: {
      fontSize: FONT.body,
      color: COLORS.text,
    },
    optionTextActive: {
      color: COLORS.primary,
      fontWeight: '700',
    },
    input: {
      backgroundColor: COLORS.card,
      borderRadius: RADIUS.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: FONT.small,
      color: COLORS.text,
      minHeight: 70,
      textAlignVertical: 'top',
      marginTop: SPACING.md,
    },
    submitBtn: {
      backgroundColor: COLORS.error,
      borderRadius: RADIUS.md,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: SPACING.lg,
    },
    submitBtnDisabled: {
      opacity: 0.5,
    },
    submitText: {
      color: COLORS.white,
      fontWeight: '700',
      fontSize: FONT.small,
    },
  });
