import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Screen } from '@/components/Screen';
import { SPORT_CATEGORIES } from '@/constants/demo-data';
import type { HighlightCategory } from '@/constants/demo-data';
import { useAppStore } from '@/context/AppStore';
import { useCommunity } from '@/context/CommunityContext';
import { useColors } from '@/hooks/useColors';

const CATEGORY_ICONS: Record<HighlightCategory, keyof typeof Feather.glyphMap> = {
  Gol: 'target',
  Assist: 'corner-up-right',
  Dribbling: 'zap',
  Parata: 'shield',
  Canestro: 'circle',
  Schiacciata: 'activity',
  Recupero: 'refresh-cw',
  Attacco: 'arrow-up-right',
  Ace: 'zap',
  Muro: 'shield',
  Difesa: 'shield',
  Punto: 'target',
  Smash: 'zap',
  Bandeja: 'corner-up-right',
  Scambio: 'repeat',
};

function SelectedVideo({ uri }: { uri: string }) {
  const colors = useColors();
  const [playing, setPlaying] = useState(false);
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  function togglePlayback() {
    if (playing) player.pause();
    else player.play();
    setPlaying((value) => !value);
  }

  return (
    <View style={styles.videoPreview}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Metti in pausa il video' : 'Riproduci il video'}
        onPress={togglePlayback}
        style={styles.videoOverlay}
      >
        <View style={styles.playCircle}>
          <Feather
            name={playing ? 'pause' : 'play'}
            size={22}
            color={colors.card}
          />
        </View>
      </Pressable>
      <View style={[styles.videoBadge, { backgroundColor: colors.foreground }]}>
        <Feather name="video" size={13} color={colors.card} />
        <Text style={[styles.videoBadgeText, { color: colors.card }]}>
          VIDEO SELEZIONATO
        </Text>
      </View>
    </View>
  );
}

export default function CreateHighlightScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state } = useAppStore();
  const community = useCommunity();
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<HighlightCategory>(
    SPORT_CATEGORIES[state.profile.sport][0],
  );
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoFileName, setVideoFileName] = useState('fieldfame-video.mp4');
  const [videoFileSize, setVideoFileSize] = useState<number | undefined>();
  const [videoContentType, setVideoContentType] = useState('video/mp4');
  const [isPublishing, setIsPublishing] = useState(false);
  const currentProfile = community.profile
    ? {
        ...state.profile,
        name: community.profile.displayName,
        username: community.profile.username,
        sport: community.profile.sport,
        city: community.profile.city,
        position: community.profile.position,
        number: community.profile.number,
      }
    : state.profile;
  const categories = SPORT_CATEGORIES[currentProfile.sport];

  useEffect(() => {
    setCategory(SPORT_CATEGORIES[currentProfile.sport][0]);
  }, [currentProfile.sport]);

  async function chooseVideo() {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Accesso ai video',
            permission.canAskAgain
              ? 'Consenti l’accesso alla libreria per scegliere un highlight.'
              : 'Abilita l’accesso ai video nelle impostazioni del dispositivo.',
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset || !asset.uri) {
        Alert.alert('Video non disponibile', 'Scegli un altro video dalla libreria.');
        return;
      }
      setVideoUri(asset.uri);
      setVideoFileName(asset.fileName || 'fieldfame-video.mp4');
      setVideoFileSize(asset.fileSize);
      setVideoContentType(asset.mimeType || 'video/mp4');
      setVideoDuration(
        asset.duration ? Math.round(asset.duration / 1000) : null,
      );
      void Haptics.selectionAsync();
    } catch {
      Alert.alert(
        'Impossibile aprire i video',
        'Controlla i permessi della libreria e riprova.',
      );
    }
  }

  async function publish() {
    if (!videoUri) {
      Alert.alert('Scegli un video', 'Aggiungi un highlight dalla libreria per pubblicare.');
      return;
    }
    if (!caption.trim()) {
      Alert.alert('Aggiungi una descrizione', 'Racconta in una frase la tua azione.');
      return;
    }
    if (!community.isSignedIn) {
      router.push('/(auth)/sign-in');
      return;
    }

    setIsPublishing(true);
    try {
      await community.publishPost({
        caption,
        category,
        sport: currentProfile.sport,
        videoUri,
        fileName: videoFileName,
        fileSize: videoFileSize,
        contentType: videoContentType,
        duration: videoDuration,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Pubblicazione non riuscita',
        error instanceof Error ? error.message : 'Riprova tra poco.',
      );
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <Screen>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          testID="close-create"
          accessibilityRole="button"
          accessibilityLabel="Chiudi pubblicazione"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Feather name="x" size={21} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Nuovo highlight
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            Il tuo momento, la tua occasione
          </Text>
        </View>
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.headerLogo}
        />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.profileLine, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.profileInitials, { color: colors.primaryForeground }]}>
              {currentProfile.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>
              {currentProfile.name}
            </Text>
            <Text style={[styles.profileMeta, { color: colors.mutedForeground }]}>
              {currentProfile.sport} · {currentProfile.position} · {currentProfile.city}
            </Text>
          </View>
          <View style={[styles.localTag, { backgroundColor: colors.accent }]}>
            <Feather name="map-pin" size={11} color={colors.accentForeground} />
            <Text style={[styles.localText, { color: colors.accentForeground }]}>
              {currentProfile.city.toUpperCase() || 'COMMUNITY'}
            </Text>
          </View>
        </View>

        <Text style={[styles.label, { color: colors.foreground }]}>La tua azione</Text>
        {videoUri ? (
          <View>
            <SelectedVideo uri={videoUri} />
            <Pressable
              accessibilityRole="button"
              onPress={() => void chooseVideo()}
              style={styles.changeVideo}
            >
              <Feather name="refresh-cw" size={13} color={colors.mutedForeground} />
              <Text style={[styles.changeText, { color: colors.mutedForeground }]}>
                Scegli un altro video
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            testID="choose-video"
            accessibilityRole="button"
            accessibilityLabel="Scegli un video dalla libreria"
            onPress={() => void chooseVideo()}
            style={[
              styles.videoPicker,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.uploadIcon, { backgroundColor: colors.accent }]}>
              <Feather name="upload" size={21} color={colors.accentForeground} />
            </View>
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
              Seleziona il tuo video
            </Text>
            <Text style={[styles.pickerCopy, { color: colors.mutedForeground }]}>
              Un highlight breve, ripreso dal tuo smartphone.
            </Text>
            <View style={[styles.pickerCta, { backgroundColor: colors.foreground }]}>
              <Feather name="film" size={14} color={colors.card} />
              <Text style={[styles.pickerCtaText, { color: colors.card }]}>
                Apri libreria video
              </Text>
            </View>
          </Pressable>
        )}

        <Text style={[styles.label, { color: colors.foreground }]}>
          Che tipo di azione?
        </Text>
        <View style={styles.categoryGrid}>
          {categories.map((item) => {
            const selected = item === category;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setCategory(item)}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather
                  name={CATEGORY_ICONS[item]}
                  size={17}
                  color={selected ? colors.primaryForeground : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    {
                      color: selected ? colors.primaryForeground : colors.foreground,
                    },
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.foreground }]}>La didascalia</Text>
        <View
          style={[
            styles.captionBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TextInput
            testID="highlight-caption"
            value={caption}
            onChangeText={setCaption}
            placeholder="Com’è nata questa giocata?"
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={140}
            textAlignVertical="top"
            style={[styles.captionInput, { color: colors.foreground }]}
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
            {caption.length}/140
          </Text>
        </View>

        <View style={[styles.tip, { backgroundColor: colors.accent }]}>
          <Feather name="eye" size={15} color={colors.accentForeground} />
          <Text style={[styles.tipText, { color: colors.accentForeground }]}>
            Un’inquadratura stabile e il campo ben visibile aiutano scout e community a seguire l’azione.
          </Text>
        </View>

        <Pressable
          testID="publish-highlight"
          accessibilityRole="button"
          disabled={isPublishing}
          onPress={publish}
          style={[
            styles.publishButton,
            { backgroundColor: colors.foreground, opacity: isPublishing ? 0.65 : 1 },
          ]}
        >
          <Text style={[styles.publishText, { color: colors.card }]}>
            Pubblica highlight
          </Text>
          <Feather name="arrow-up-right" size={17} color={colors.card} />
        </Pressable>
        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Per questa anteprima, il video resta sul dispositivo e non viene caricato su un server.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 63,
    paddingHorizontal: 17,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  headerButton: {
    width: 34,
    height: 38,
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: 3,
  },
  headerLogo: {
    width: 30,
    height: 30,
    borderRadius: 9,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 35,
  },
  profileLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 19,
  },
  profileAvatar: {
    width: 39,
    height: 39,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  profileName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  profileMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: 3,
  },
  localTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  localText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 8,
    letterSpacing: 0.5,
  },
  label: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    marginBottom: 9,
  },
  videoPicker: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 18,
    marginBottom: 19,
  },
  uploadIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pickerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  pickerCopy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 5,
  },
  pickerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginTop: 13,
  },
  pickerCtaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  videoPreview: {
    height: 245,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    marginBottom: 5,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  playCircle: {
    width: 51,
    height: 51,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  videoBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15,22,18,0.72)',
  },
  videoBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 8,
    letterSpacing: 0.7,
  },
  changeVideo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    marginBottom: 10,
  },
  changeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  categoryCard: {
    flex: 1,
    minWidth: '46%',
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  captionBox: {
    minHeight: 93,
    borderWidth: 1,
    borderRadius: 14,
    padding: 11,
    marginBottom: 16,
  },
  captionInput: {
    minHeight: 56,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  charCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 9,
    textAlign: 'right',
    marginTop: 3,
  },
  tip: {
    borderRadius: 13,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 17,
  },
  tipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 15,
    flex: 1,
  },
  publishButton: {
    minHeight: 49,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  publishText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  disclaimer: {
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 10,
    paddingHorizontal: 12,
  },
});
