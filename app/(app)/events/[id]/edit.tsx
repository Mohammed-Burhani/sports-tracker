import { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  Switch,
  StyleSheet,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react-native";
import { useEvent, useUpdateEvent } from "@/hooks/useEvents";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SPORTS, FORMATS } from "@/constants/sports";
import { EventStatus, PlayerType } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { colors, spacing, typography, radius } from "@/constants/theme";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

const schema = z.object({
  name: z.string().min(2, "Event name required"),
  venue: z.string().optional(),
  start_date: z.string().min(4, "Start date required"),
  end_date: z.string().optional(),
  status: z.enum(["draft", "published", "ongoing", "completed", "cancelled"]),
  description: z.string().optional(),
  max_participants: z.coerce.number().min(2).max(1000),
  num_teams: z.coerce.number().min(1).max(100).optional(),
  players_per_team: z.coerce.number().min(1).max(50).optional(),
  player_type: z.enum(["individual", "team"]),
});

type FormData = z.infer<typeof schema>;

export default function EditEvent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: event, isLoading } = useEvent(id);
  const updateEvent = useUpdateEvent();
  const [multiDay, setMultiDay] = useState(!!event?.end_date);

  const { control, handleSubmit, setValue, watch, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    values: event
      ? {
          name: event.name,
          venue: event.venue ?? "",
          start_date: event.start_date,
          end_date: event.end_date ?? "",
          status: event.status as any,
          description: event.description ?? "",
          max_participants: event.max_participants,
          num_teams: 2,
          players_per_team: Math.floor(event.max_participants / 2),
          player_type: event.player_type,
        }
      : undefined,
  });

  const values = watch();

  // Update max_participants when team settings change
  useEffect(() => {
    if (values.player_type === "team" && values.num_teams && values.players_per_team) {
      setValue("max_participants", values.num_teams * values.players_per_team);
    }
  }, [values.player_type, values.num_teams, values.players_per_team, setValue]);

  async function onSubmit(data: FormData) {
    try {
      await updateEvent.mutateAsync({
        id,
        payload: {
          name: data.name,
          venue: data.venue || null,
          start_date: data.start_date,
          end_date: multiDay ? (data.end_date || null) : null,
          status: data.status,
          description: data.description || null,
          max_participants: data.max_participants,
          player_type: data.player_type,
        },
      });
      showSuccessToast("Event updated successfully!");
      router.back();
    } catch (error) {
      console.error("Error updating event:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update event";
      showErrorToast(errorMessage);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Skeleton height={20} width="60%" />
          <Skeleton height={44} />
          <Skeleton height={44} />
          <Skeleton height={44} />
        </View>
      </SafeAreaView>
    );
  }

  const selectedSport = SPORTS.find((s) => s.sport === event?.sport);
  const selectedFormat = FORMATS.find((f) => f.format === event?.format);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <ChevronLeft color={colors.textSecondary} size={20} strokeWidth={2.5} />
          <Text style={styles.backText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Edit Event</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sport badge (read-only) */}
        {selectedSport && (
          <View
            style={[
              styles.sportBadge,
              { backgroundColor: `${selectedSport.accent}20`, borderColor: `${selectedSport.accent}40` },
            ]}
          >
            <Text style={styles.sportEmoji}>{selectedSport.emoji}</Text>
            <Text style={[styles.sportLabel, { color: selectedSport.accent }]}>
              {selectedSport.label}
            </Text>
            <Text style={styles.sportFormat}>· {selectedFormat?.label}</Text>
          </View>
        )}

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Event Name"
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
            />
          )}
        />

        {selectedSport && selectedSport.supportsIndividual && selectedSport.supportsTeam && (
          <>
            <Text style={styles.sectionLabel}>Player Type</Text>
            <View style={styles.playerTypeRow}>
              {(["individual", "team"] as PlayerType[]).map((pt) => (
                <Pressable
                  key={pt}
                  onPress={() => {
                    setValue("player_type", pt);
                    if (pt === "team") {
                      setValue("num_teams", 2);
                      setValue("players_per_team", 11);
                      setValue("max_participants", 22);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: values.player_type === pt }}
                  style={({ pressed }) => [
                    styles.playerTypeButton,
                    values.player_type === pt && styles.playerTypeButtonSelected,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.playerTypeLabel,
                      values.player_type === pt && styles.playerTypeLabelSelected,
                    ]}
                  >
                    {pt === "individual" ? "Individual" : "Team"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {values.player_type === "individual" ? (
          <Controller
            control={control}
            name="max_participants"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Max Participants"
                value={String(value)}
                onChangeText={onChange}
                keyboardType="numeric"
                error={errors.max_participants?.message}
              />
            )}
          />
        ) : (
          <>
            <Controller
              control={control}
              name="num_teams"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Number of Teams"
                  value={String(value || "")}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  error={errors.num_teams?.message}
                  hint="How many teams will compete"
                />
              )}
            />

            <Controller
              control={control}
              name="players_per_team"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Players per Team"
                  value={String(value || "")}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  error={errors.players_per_team?.message}
                  hint="Number of players in each team"
                />
              )}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Total participants: {values.max_participants || 0}
              </Text>
              <Text style={styles.infoSubtext}>
                ({values.num_teams || 0} teams × {values.players_per_team || 0} players)
              </Text>
            </View>
          </>
        )}

        <Controller
          control={control}
          name="venue"
          render={({ field: { onChange, value } }) => (
            <Input label="Venue (optional)" value={value} onChangeText={onChange} />
          )}
        />

        <Controller
          control={control}
          name="start_date"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Start Date (YYYY-MM-DD)"
              value={value}
              onChangeText={onChange}
              error={errors.start_date?.message}
            />
          )}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Multi-day event?</Text>
          <Switch
            value={multiDay}
            onValueChange={setMultiDay}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor={colors.cardSurface}
          />
        </View>

        {multiDay && (
          <Controller
            control={control}
            name="end_date"
            render={({ field: { onChange, value } }) => (
              <Input
                label="End Date (YYYY-MM-DD)"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        )}

        <Text style={styles.sectionLabel}>Status</Text>
        <View style={styles.statusRow}>
          {(["draft", "published", "ongoing", "completed", "cancelled"] as EventStatus[]).map(
            (s) => (
              <Pressable
                key={s}
                onPress={() => setValue("status", s)}
                accessibilityRole="button"
                accessibilityState={{ selected: values.status === s }}
                style={({ pressed }) => [
                  styles.statusChip,
                  values.status === s && styles.statusChipSelected,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text
                  style={[
                    styles.statusLabel,
                    values.status === s && styles.statusLabelSelected,
                  ]}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </Pressable>
            )
          )}
        </View>

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Description (optional)"
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={4}
            />
          )}
        />

        <Button
          label="Save Changes"
          onPress={async () => {
            const isValid = await trigger();
            if (!isValid) {
              const firstError = Object.values(errors)
                .map((error) => error?.message)
                .find((msg) => msg);
              if (firstError) {
                showErrorToast(firstError);
              } else {
                showErrorToast("Please check all fields");
              }
              return;
            }
            handleSubmit(onSubmit)();
          }}
          loading={updateEvent.isPending}
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.base,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardSurface,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: 80,
  },
  backText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  headerTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  loadingContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  sportBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  sportEmoji: {
    fontSize: 20,
  },
  sportLabel: {
    ...typography.bodyBold,
  },
  sportFormat: {
    ...typography.small,
    color: colors.textTertiary,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  playerTypeRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  playerTypeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
    backgroundColor: colors.cardSurface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  playerTypeButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  playerTypeLabel: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  playerTypeLabelSelected: {
    color: colors.accentInk,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  switchLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusChipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  statusLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  statusLabelSelected: {
    color: colors.accentInk,
  },
  infoBox: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + "40",
  },
  infoText: {
    ...typography.bodyBold,
    color: colors.accentInk,
    marginBottom: 2,
  },
  infoSubtext: {
    ...typography.small,
    color: colors.accentInk,
    opacity: 0.8,
  },
});
