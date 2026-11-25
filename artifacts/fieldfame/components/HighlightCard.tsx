import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as Haptics from 'expo-haptics';
import type { HighlightPost } from '@/constants/demo-data';
import { Avatar } from '@/components/Avatar';
import { useColors } from '@/hooks/useColors';

type HighlightCardProps = {
  post: HighlightPost;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  onAthletePress?: () => void;
  onComments?: () => void;
};

function ImagePreview({ post }: { post: HighlightPost }) {
  const colors = useColors();
  return (
    <ImageBackground
      source={post.image!}
      resizeMode="cover"
      style={styles.media}
      imageStyle={styles.mediaImage}
    >
      <LinearGradient
        colors={[colors.foreground, 'transparent', colors.foreground]}
        locations={[0, 0.42, 1]}
        style={[StyleSheet.absoluteFill, styles.imageShade]}
      />
      <View style={styles.mediaTop}>
        <View style={[styles.categoryPill, { backgroundColor: colors.primary }]}>
          <Text style={[styles.categoryText, { color: colors.primaryForeground }]}>
            {post.category.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.durationPill, { backgroundColor: colors.foreground }]}>
          <Feather name="play" size={11} color={colors.card} />
          <Text style={[styles.durationText, { color: colors.card }]}>
            {post.duration ? `0:${String(post.duration).padStart(2, '0')}` : 'HIGHLIGHT'}
          </Text>
        </View>
      </View>
      <View style={styles.mediaBottom}>
        <Text style={[styles.mediaHeadline, { color: colors.card }]}>
          {['Gol', 'Canestro', 'Attacco', 'Punto'].includes(post.category)
            ? 'L’AZIONE DELLA SETTIMANA'
            : 'OCCHI SUL CAMPO'}
        </Text>
        <Text style={[styles.mediaLocation, { color: colors.card }]}>
          {post.city} · {post.sport}
        </Text>
      </View>
    </ImageBackground>
  );
}

function VideoPreview({ post }: { post: HighlightPost }) {
  const colors = useColors();
  const [playing, setPlaying] = useState(false);
  const player = useVideoPlayer(post.videoUri ?? '', (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  useEffect(() => {
    if (playing) player.play();
    else player.pause();
  }, [playing, player]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={playing ? 'Metti in pausa il video' : 'Riproduci il video'}
      onPress={() => setPlaying((value) => !value)}
      style={[styles.media, { backgroundColor: colors.foreground }]}
    >
      {post.videoUri ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      ) : null}
      <LinearGradient
        colors={[colors.foreground, 'transparent', colors.foreground]}
        style={[StyleSheet.absoluteFill, styles.videoShade]}
      />
      <View style={styles.mediaTop}>
        <View style={[styles.categoryPill, { backgroundColor: colors.primary }]}>
          <Text style={[styles.categoryText, { color: colors.primaryForeground }]}>
            {post.category.toUpperCase()}
          </Text>
        </View>
        <View style={styles.durationPill}>
          <Feather name="play" size={11} color={colors.card} />
          <Text style={styles.durationText}>
            {post.duration
              ? `0:${String(Math.floor(post.duration / 1000)).padStart(2, '0')}`
              : 'HIGHLIGHT'}
          </Text>
        </View>
      </View>
      {!playing ? (
        <View style={styles.centerPlay}>
          <Feather name="play" size={25} color={colors.card} />
        </View>
      ) : null}
      <View style={styles.mediaBottom}>
        <Text style={[styles.mediaHeadline, { color: colors.card }]}>IL TUO HIGHLIGHT</Text>
        <Text style={[styles.mediaLocation, { color: colors.card }]}>
            {post.city} · {post.sport}
        </Text>
      </View>
    </Pressable>
  );
}

function MediaPreview({ post }: { post: HighlightPost }) {
  return post.image ? <ImagePreview post={post} /> : <VideoPreview post={post} />;
}

export function HighlightCard({
  post,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onAthletePress,
  onComments,
}: HighlightCardProps) {
  const colors = useColors();

  async function sharePost() {
    try {
      const result = await Share.share({
        message: `${post.athleteName} su FieldFame: ${post.caption}`,
      });
      if (result.action === Share.sharedAction) {
        await Haptics.selectionAsync();
      }
    } catch {
      Alert.alert('Condivisione non disponibile', 'Riprova tra poco.');
    }
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.postHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Apri il profilo di ${post.athleteName}`}
          onPress={onAthletePress}
          style={styles.athleteInfo}
        >
          <Avatar
            initials={
              post.athleteName
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()
            }
            size={40}
          />
          <View style={styles.nameBlock}>
            <Text
              style={[styles.athleteName, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {post.athleteName}
            </Text>
            <Text style={[styles.postMeta, { color: colors.mutedForeground }]}>
              {post.sport} · {post.city} · {post.timeAgo}
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Altre opzioni"
          onPress={() => Alert.alert('Highlight FieldFame', post.caption)}
          style={styles.moreButton}
          hitSlop={8}
        >
          <Feather name="more-horizontal" size={22} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <MediaPreview post={post} />

      <View style={styles.actionRow}>
        <View style={styles.actionGroup}>
          <Pressable
            testID={`like-${post.id}`}
            accessibilityRole="button"
            accessibilityLabel={isLiked ? 'Rimuovi mi piace' : 'Metti mi piace'}
            onPress={onLike}
            style={styles.actionButton}
            hitSlop={8}
          >
            <Feather
              name="heart"
              size={20}
              color={isLiked ? colors.destructive : colors.foreground}
            />
            <Text style={[styles.actionCount, { color: colors.foreground }]}>
              {(post.isShared ? post.likes : post.likes + Number(isLiked)).toLocaleString('it-IT')}
            </Text>
          </Pressable>
          {onComments ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Apri ${post.comments ?? 0} commenti`}
              onPress={onComments}
              style={styles.actionButton}
              hitSlop={8}
            >
              <Feather name="message-circle" size={19} color={colors.foreground} />
              <Text style={[styles.actionCount, { color: colors.foreground }]}>
                {post.comments ?? 0}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Condividi highlight"
            onPress={() => void sharePost()}
            style={styles.iconButton}
            hitSlop={8}
          >
          <Feather name="send" size={19} color={colors.foreground} />
          </Pressable>
        </View>
        <Pressable
          testID={`save-${post.id}`}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? 'Rimuovi dai salvati' : 'Salva highlight'}
          onPress={onSave}
          style={styles.iconButton}
          hitSlop={8}
        >
          <Feather
            name="bookmark"
            size={20}
            color={isSaved ? colors.primaryForeground : colors.foreground}
            style={
              isSaved
                ? {
                    backgroundColor: colors.primary,
                    borderRadius: 6,
                    overflow: 'hidden',
                    paddingHorizontal: 4,
                    paddingVertical: 3,
                  }
                : undefined
            }
          />
        </Pressable>
      </View>
      <Text style={[styles.caption, { color: colors.foreground }]}>
        <Text style={styles.captionName}>{post.username}</Text> {post.caption}
      </Text>
      <View style={styles.postFooter}>
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.miniMark}
          resizeMode="contain"
        />
        <Text style={[styles.footerLabel, { color: colors.mutedForeground }]}>
          SOCIAL SCOUTING · {post.city.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 12,
    marginBottom: 18,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  athleteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  nameBlock: {
    flex: 1,
  },
  athleteName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    marginBottom: 3,
  },
  postMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  moreButton: {
    padding: 5,
  },
  media: {
    height: 340,
    justifyContent: 'space-between',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  imageShade: {
    opacity: 0.6,
  },
  videoShade: {
    opacity: 0.48,
  },
  mediaImage: {
    borderRadius: 18,
  },
  mediaTop: {
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },
  categoryText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15,22,18,0.68)',
  },
  durationText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  mediaBottom: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mediaHeadline: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.3,
    fontSize: 11,
    marginBottom: 5,
  },
  mediaLocation: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  centerPlay: {
    position: 'absolute',
    alignSelf: 'center',
    top: 140,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(15,22,18,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingHorizontal: 2,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  actionCount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  iconButton: {
    minWidth: 30,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 2,
    paddingTop: 8,
  },
  captionName: {
    fontFamily: 'Inter_700Bold',
  },
  postFooter: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 2,
  },
  miniMark: {
    width: 15,
    height: 15,
    borderRadius: 5,
  },
  footerLabel: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.9,
    fontSize: 8,
  },
});
