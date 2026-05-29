import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react-native";
import { useCreateSession } from "@/hooks/useSessions";
import { useEvents } from "@/hooks/useEvents";
import { useTeams } from "@/hooks/useTeams";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getSportMeta } from "@/constants/sports";
import { Session } from "@/types";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";

const DURATION_PRESETS = [1, 1.5, 2, 2.5, 3, 4, 6, 8];

const schema = z.object({
  event_id: z.string().min(1, "Select an event"),
  name: z.string().min(1, "Session name required"),
  session_number: z.coerce.number().min(1),
  date: z.string().min(4),
  start_time: z.string().min(3),
  duration_hours: z.coerce.number().min(0.5),
  venue_area: z.string().optional(),
  expected_count: z.coerce.number().min(0),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]),
});

type FormData = z.infer<typeof schema>;

export default function CreateSession() {
  const { eventId: presetEventId } = useLocalSearchParams<{ eventId?: string }>();
  const router = useRouter();
  const createSession = useCreateSession();
  const { data: events } = useEvents();
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [selectedEventId, setSelectedEventId] = useState(presetEventId ?? "");

  const selectedEvent = events?.find((e) => e.id === selectedEventId);
  const { data: teams } = useTeams(selectedEventId);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      event_id: presetEventId ?? "",
      name: "",
      session_number: 1,
      date: new Date().toISOString().split("T")[0],
      start_time: "09:00",
      duration_hours: 1,
      venue_area: "",
      expected_count: 0,
      notes: "",
      status: "scheduled",
    },
  });

  const values = watch();

  async function onSubmit(data: FormData) {
    const sport = selectedEvent ? getSportMeta(selectedEvent.sport) : null;

    await createSession.mutateAsync({
      event_id: data.event_id,
      name: data.name,
      session_number: data.session_number,
      status: data.status,
      date: data.date,
      start_time: data.start_time,
      end_time: null,
      duration_hours: data.duration_hours,
      venue_area: data.venue_area || null,
      max_participants: selectedEvent?.max_participants ?? null,
      notes: data.notes || null,
      format_config: null,
    });
    router.back();
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={colors.textSecondary} strokeWidth={2.5} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Session</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Event picker */}
          {!presetEventId && (
            <>
              <Text style={styles.label}>Event</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventScroll}>
                <View style={styles.eventList}>
                  {events?.map((e) => {
                    const sport = getSportMeta(e.sport);
                    const isSelected = selectedEventId === e.id;
                    return (
                      <TouchableOpacity
                        key={e.id}
                        onPress={() => { setSelectedEventId(e.id); setValue("event_id", e.id); }}
                        style={[
                          styles.eventChip,
                          shadows.card,
                          isSelected && { backgroundColor: `${sport.accent}20`, borderColor: sport.accent }
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.eventEmoji}>{sport.emoji}</Text>
                        <Text
                          style={[
                            styles.eventName,
                            isSelected && { color: sport.accent }
                          ]}
                          numberOfLines={1}
                        >
                          {e.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
              {errors.event_id && <Text style={styles.errorText}>Select an event</Text>}
            </>
          )}

          {selectedEvent && (
            <View style={[styles.selectedEvent, shadows.card, { backgroundColor: `${getSportMeta(selectedEvent.sport).accent}15` }]}>
              <Text style={styles.selectedEventEmoji}>{getSportMeta(selectedEvent.sport).emoji}</Text>
              <Text style={[styles.selectedEventName, { color: getSportMeta(selectedEvent.sport).accent }]}>
                {selectedEvent.name}
              </Text>
            </View>
          )}

          <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
            <Input label="Session Name" value={value} onChangeText={onChange} placeholder="Morning Round 1" error={errors.name?.message} />
          )} />

          <Controller control={control} name="session_number" render={({ field: { onChange, value } }) => (
            <Input label="Session Number" value={String(value)} onChangeText={onChange} keyboardType="numeric" />
          )} />

          <Controller control={control} name="date" render={({ field: { onChange, value } }) => (
            <Input label="Date (YYYY-MM-DD)" value={value} onChangeText={onChange} error={errors.date?.message} />
          )} />

          <Controller control={control} name="start_time" render={({ field: { onChange, value } }) => (
            <Input label="Start Time (HH:MM)" value={value} onChangeText={onChange} placeholder="09:00" error={errors.start_time?.message} />
          )} />

          {/* Duration presets */}
          <Text style={styles.label}>Duration</Text>
          <View style={styles.durationGrid}>
            {DURATION_PRESETS.map((d) => {
              const isSelected = selectedDuration === d;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => { setSelectedDuration(d); setValue("duration_hours", d); }}
                  style={[
                    styles.durationChip,
                    shadows.card,
                    isSelected && styles.durationChipSelected
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.durationText, isSelected && styles.durationTextSelected]}>
                    {d === 8 ? "Full Day" : `${d}h`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Controller control={control} name="venue_area" render={({ field: { onChange, value } }) => (
            <Input label="Venue Area (e.g. Court 1)" value={value} onChangeText={onChange} placeholder="Court 1" />
          )} />

          <Controller control={control} name="expected_count" render={({ field: { onChange, value } }) => (
            <Input label="Expected Participant Count" value={String(value)} onChangeText={onChange} keyboardType="numeric" />
          )} />

          <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
            <Input label="Notes (optional)" value={value} onChangeText={onChange} multiline numberOfLines={2} />
          )} />

          <Text style={styles.label}>Status</Text>
          <View style={styles.statusGrid}>
            {(["scheduled", "ongoing", "completed", "cancelled"] as const).map((s) => {
              const isSelected = values.status === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setValue("status", s)}
                  style={[
                    styles.statusChip,
                    shadows.card,
                    isSelected && styles.statusChipSelected
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.statusText, isSelected && styles.statusTextSelected]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button
            label="Create Session"
            onPress={handleSubmit(onSubmit)}
            loading={createSession.isPending}
            color={colors.primaryAccent}
            fullWidth
          />

          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.base,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardSurface,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  backText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  headerTitle: {
    ...typography.title,
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  label: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  eventScroll: {
    marginBottom: spacing.md,
  },
  eventList: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  eventChip: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eventEmoji: {
    fontSize: 16,
  },
  eventName: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    fontSize: 13,
    maxWidth: 100,
  },
  errorText: {
    ...typography.small,
    color: colors.danger,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  selectedEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  selectedEventEmoji: {
    fontSize: 20,
  },
  selectedEventName: {
    ...typography.heading,
    fontSize: 16,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  durationChip: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  durationChipSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.primaryAccent,
  },
  durationText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    fontSize: 13,
  },
  durationTextSelected: {
    color: colors.accentInk,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statusChip: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  statusChipSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.primaryAccent,
  },
  statusText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    fontSize: 13,
  },
  statusTextSelected: {
    color: colors.accentInk,
  },
});
