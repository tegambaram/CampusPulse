import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import CustomInput from '../components/CustomInput';
import SelectField from '../components/SelectField';
import CustomButton from '../components/CustomButton';
import { FONT, SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import categoryService from '../services/categoryService';
import postService from '../services/postService';
import uploadService from '../services/uploadService';

const COMPENSATIONS = [
  { key: 'free', label: 'Free', icon: 'gift-outline' },
  { key: 'paid', label: 'Paid', icon: 'cash-outline' },
  { key: 'rent', label: 'Rent', icon: 'time-outline' },
  { key: 'exchange', label: 'Exchange', icon: 'swap-horizontal-outline' },
];

export default function CreatePostScreen({ navigation, route }) {
  const editPost = route?.params?.editPost || null;
  const isEditMode = Boolean(editPost);
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const [categories, setCategories] = useState([]);
  const [postType, setPostType] = useState(editPost?.type || 'need');
  const [title, setTitle] = useState(editPost?.title || '');
  const [description, setDescription] = useState(editPost?.description || '');
  const [category, setCategory] = useState(editPost?.category || '');
  const [compensationType, setCompensationType] = useState(editPost?.compensationType || 'free');
  const [compensationAmount, setCompensationAmount] = useState(editPost?.compensationAmount ? String(editPost.compensationAmount) : '');
  const [location, setLocation] = useState(editPost?.location || '');
  const [image, setImage] = useState(editPost?.image ? { uri: editPost.image } : null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => {});
  }, []);

  const resetForm = () => {
    setPostType('need');
    setTitle('');
    setDescription('');
    setCategory('');
    setCompensationType('free');
    setCompensationAmount('');
    setLocation('');
    setImage(null);
  };

  const handleUploadImage = async () => {
    if (image) {
      setImage(null);
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach an image to your post.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets?.length > 0) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !category) {
      Alert.alert('Incomplete post', 'Please fill in the title, description and category.');
      return;
    }

    setSubmitting(true);
    try {
      // image.uri is a local file:// path from the picker until we upload it — an already-
      // remote https:// URL means this is an untouched image from edit mode, so skip re-uploading it.
      let imageUri = image ? image.uri : null;
      if (imageUri && !imageUri.startsWith('http')) {
        imageUri = await uploadService.uploadImage(imageUri);
      }

      const payload = {
        type: postType,
        title,
        description,
        category,
        compensationType,
        compensationAmount: compensationAmount || undefined,
        location,
        imageUri,
      };

      if (isEditMode) {
        await postService.updatePost(editPost._id || editPost.id, payload);
        Alert.alert('Post updated!', 'Your changes are now live.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await postService.createPost(payload);
        Alert.alert('Post created!', 'Your post is now live for the campus to see.', [
          { text: 'OK', onPress: () => { resetForm(); navigation.navigate('Home'); } },
        ]);
      }
    } catch (error) {
      Alert.alert(isEditMode ? 'Could not save changes' : 'Could not create post', error.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{isEditMode ? 'Edit Post' : 'Create Post'}</Text>
        <Text style={styles.subtitle}>
          {isEditMode ? 'Update the details of your post' : 'Ask for help or offer your skills to campus'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleBtn, postType === 'need' && styles.toggleBtnActive]}
            onPress={() => setPostType('need')}
          >
            <Ionicons name="hand-left-outline" size={16} color={postType === 'need' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.toggleText, postType === 'need' && styles.toggleTextActive]}>Need Help</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, postType === 'offer' && styles.toggleBtnActive]}
            onPress={() => setPostType('offer')}
          >
            <Ionicons name="sparkles-outline" size={16} color={postType === 'offer' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.toggleText, postType === 'offer' && styles.toggleTextActive]}>Offer Help</Text>
          </Pressable>
        </View>

        <CustomInput
          label="Title"
          icon="text-outline"
          placeholder={postType === 'need' ? 'e.g. Need Scientific Calculator' : 'e.g. Offering Guitar Classes'}
          value={title}
          onChangeText={setTitle}
        />
        <CustomInput
          label="Description"
          icon="document-text-outline"
          placeholder="Describe what you need or what you're offering..."
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <SelectField
          label="Category"
          icon="grid-outline"
          placeholder="Select a category"
          value={category}
          options={categories.map((c) => c.name)}
          onSelect={setCategory}
        />
        <CustomInput label="Location" icon="location-outline" placeholder="e.g. Central Library" value={location} onChangeText={setLocation} />

        <Text style={styles.label}>Compensation</Text>
        <View style={styles.compRow}>
          {COMPENSATIONS.map((c) => {
            const active = compensationType === c.key;
            return (
              <Pressable
                key={c.key}
                style={[styles.compBtn, active && styles.compBtnActive]}
                onPress={() => setCompensationType(c.key)}
              >
                <Ionicons name={c.icon} size={17} color={active ? COLORS.white : COLORS.primary} />
                <Text style={[styles.compText, active && { color: COLORS.white }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {compensationType !== 'free' && (
          <CustomInput
            label="Amount (₹)"
            icon="cash-outline"
            placeholder="e.g. 200"
            value={compensationAmount}
            onChangeText={setCompensationAmount}
            keyboardType="numeric"
          />
        )}

        <Text style={styles.label}>Photo</Text>
        {image ? (
          <View style={styles.imagePreviewWrap}>
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
            <Pressable style={styles.removeImageBtn} onPress={handleUploadImage}>
              <Ionicons name="close" size={16} color={COLORS.white} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.uploadBtn} onPress={handleUploadImage}>
            <Ionicons name="cloud-upload-outline" size={26} color={COLORS.primary} />
            <Text style={styles.uploadText}>Upload Image</Text>
            <Text style={styles.uploadSubtext}>PNG or JPG, up to 5MB</Text>
          </Pressable>
        )}

        <CustomButton
          title={isEditMode ? 'Save Changes' : 'Submit Post'}
          onPress={handleSubmit}
          loading={submitting}
          style={{ marginTop: SPACING.xl }}
        />
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
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT.h1,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  scroll: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: RADIUS.sm + 2,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  label: {
    fontSize: FONT.small,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  compRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
  },
  compBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.round,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  compBtnActive: {
    backgroundColor: COLORS.primary,
  },
  compText: {
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
  },
  uploadBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  uploadText: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: FONT.tiny,
    color: COLORS.textLight,
    marginTop: 2,
  },
  imagePreviewWrap: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
