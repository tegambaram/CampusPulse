import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import CustomInput from '../components/CustomInput';
import SelectField from '../components/SelectField';
import SkillChip from '../components/SkillChip';
import CustomButton from '../components/CustomButton';
import { FONT, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import userService from '../services/userService';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics & Comm.', 'Mechanical Engg.', 'Civil Engineering', 'Fine Arts', 'Music & Performing Arts', 'Business Administration'];
const SEMESTERS = ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'];
const AVAILABILITIES = ['Weekday Mornings', 'Weekday Evenings', 'Weekends', 'Flexible / Anytime'];

export default function EditProfileScreen({ navigation }) {
  const { user, updateLocalUser } = useAuth();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [avatar, setAvatar] = useState(user.profileImage);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [department, setDepartment] = useState(user.department);
  const [semester, setSemester] = useState(user.semester);
  const [availability, setAvailability] = useState((user.availability || [])[0] || '');
  const [skills, setSkills] = useState(user.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleChangePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to change your profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setAvatar(asset.uri);
    setUploadingAvatar(true);
    try {
      const res = await userService.uploadAvatar(asset.uri);
      setAvatar(res.profileImage);
      updateLocalUser({ profileImage: res.profileImage });
    } catch (error) {
      Alert.alert('Upload failed', error.message || 'Could not upload your photo.');
      setAvatar(user.profileImage);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed || skills.includes(trimmed)) {
      setNewSkill('');
      return;
    }
    setSkills((prev) => [...prev, trimmed]);
    setNewSkill('');
  };

  const removeSkill = (skill) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        name,
        bio,
        department,
        semester,
        skills,
        availability: availability ? [availability] : [],
      });
      updateLocalUser(updated);
      Alert.alert('Profile updated', 'Your changes have been saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Could not save changes', error.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <Pressable style={styles.cameraBtn} onPress={handleChangePhoto} disabled={uploadingAvatar}>
            <Ionicons name="camera" size={16} color={COLORS.white} />
          </Pressable>
          <Pressable onPress={handleChangePhoto} disabled={uploadingAvatar}>
            <Text style={styles.changePhotoText}>{uploadingAvatar ? 'Uploading...' : 'Change Photo'}</Text>
          </Pressable>
        </View>

        <CustomInput label="Full Name" icon="person-outline" value={name} onChangeText={setName} autoCapitalize="words" />
        <CustomInput label="Bio" icon="document-text-outline" value={bio} onChangeText={setBio} multiline />
        <SelectField label="Department" icon="school-outline" value={department} options={DEPARTMENTS} onSelect={setDepartment} placeholder="Select department" />
        <SelectField label="Semester" icon="calendar-outline" value={semester} options={SEMESTERS} onSelect={setSemester} placeholder="Select semester" />
        <SelectField label="Availability" icon="alarm-outline" value={availability} options={AVAILABILITIES} onSelect={setAvailability} placeholder="Select availability" />

        <Text style={styles.label}>Skills</Text>
        <View style={styles.skillsWrap}>
          {skills.map((skill) => (
            <SkillChip key={skill} label={skill} onRemove={() => removeSkill(skill)} />
          ))}
        </View>
        <View style={styles.addSkillRow}>
          <CustomInput
            placeholder="Add a skill (e.g. Excel)"
            icon="add-circle-outline"
            value={newSkill}
            onChangeText={setNewSkill}
            style={{ flex: 1, marginBottom: 0 }}
          />
          <Pressable style={styles.addSkillBtn} onPress={addSkill}>
            <Text style={styles.addSkillBtnText}>Add</Text>
          </Pressable>
        </View>

        <CustomButton title="Save Changes" onPress={handleSave} loading={saving} style={{ marginTop: SPACING.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT.h3,
    fontWeight: '800',
    color: COLORS.text,
  },
  scroll: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: COLORS.card,
  },
  cameraBtn: {
    position: 'absolute',
    top: 76,
    right: '38%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  changePhotoText: {
    fontSize: FONT.small,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  label: {
    fontSize: FONT.small,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  addSkillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  addSkillBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    marginLeft: SPACING.sm,
  },
  addSkillBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT.small,
  },
});
