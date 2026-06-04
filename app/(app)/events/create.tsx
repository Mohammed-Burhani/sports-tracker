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
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react-native";
import { Plus, Trash2 } from "lucide-react-native";
import { useCreateEvent } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { useGenerateSchedule } from "@/hooks/useSchedule";
import { ScheduleGenerationModal } from "@/components/ScheduleGenerationModal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SPORTS, FORMATS } from "@/constants/sports";
import { Sport, EventFormat, PlayerType, EventStatus } from "@/types";
import { colors, spacing, typography, radius } from "@/constants/theme";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

const schema = z.object({
  name: z.string().min(2, "Event name required"),
  sport: z.string().min(1, "Select a sport"),
  format: z.string().min(1, "Select a format"),
  player_type: z.enum(["individual", "team"]),
  max_participants: z.coerce.number().min(2).max(1000),
  num_teams: z.coerce.number().min(2).max(10).optional(),
  players_per_team: z.coerce.number().min(1).max(50).optional(),
  rounds_per_match: z.coerce.number().min(1).max(10).optional(),
  groups_count: z.coerce.number().min(2).max(8).optional(),
  venue: z.string().optional(),
  start_date: z.string().min(4, "Start date required"),
  end_date: z.string().optional(),
  duration_hours: z.coerce.number().min(0.5).max(24).optional(),
  status: z.enum(["draft", "published", "ongoing", "completed", "cancelled"]),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = ["Sport & Format", "Details", "Review"];

interface CourtInput {
  id: string;
  name: string;
}

export default function CreateEvent() {
  const router = useRouter();
  const { profile } = useAuth();
  const createEvent = useCreateEvent();
  const generateSchedule = useGenerateSchedule();
  const [step, setStep] = useState(0);
  const [multiDay, setMultiDay] = useState(false);
  const [courts, setCourts] = useState<CourtInput[]>([{ id: "1", name: "" }]);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("CreateEvent mounted");
    console.log("Profile:", profile);
    console.log("CreateEvent mutation state:", {
      isPending: createEvent.isPending,
      isError: createEvent.isError,
      error: createEvent.error,
    });
  }, [profile, createEvent.isPending, createEvent.isError, createEvent.error]);

  const { control, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      sport: "",
      format: "",
      player_type: "individual",
      max_participants: 32,
      num_teams: 2,
      players_per_team: 11,
      rounds_per_match: 1,
      venue: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      duration_hours: 2,
      status: "draft",
      description: "",
      groups_count: 2,
    },
  });

  const values = watch();

  // Update max_participants when team settings change
  useEffect(() => {
    if (values.player_type === "team" && values.num_teams && values.players_per_team) {
      setValue("max_participants", values.num_teams * values.players_per_team);
    }
  }, [values.player_type, values.num_teams, values.players_per_team, setValue]);

  // Reset courts when switching to individual
  useEffect(() => {
    if (values.player_type === "individual") {
      setCourts([{ id: "1", name: "" }]);
    }
  }, [values.player_type]);

  function addCourt() {
    const newId = String(Date.now());
    setCourts([...courts, { id: newId, name: "" }]);
  }

  function removeCourt(id: string) {
    if (courts.length > 1) {
      setCourts(courts.filter((c) => c.id !== id));
    }
  }

  function updateCourtName(id: string, name: string) {
    setCourts(courts.map((c) => (c.id === id ? { ...c, name } : c)));
  }

  async function nextStep() {
    let fields: (keyof FormData)[] = [];
    if (step === 0) fields = ["name", "sport", "format"];
    if (step === 1) {
      if (values.player_type === "individual") {
        fields = ["max_participants", "start_date", "status"];
      } else {
        fields = ["num_teams", "players_per_team", "start_date", "status"];
      }
    }
    
    const valid = await trigger(fields);
    
    if (!valid) {
      // Get the first error message
      const firstError = fields
        .map((field) => errors[field]?.message)
        .find((msg) => msg);
      
      if (firstError) {
        showErrorToast(firstError);
      } else {
        showErrorToast("Please fill in all required fields");
      }
      return;
    }
    
    setStep((s) => Math.min(s + 1, 2));
  }

  async function onSubmit(data: FormData) {
    console.log("onSubmit called with data:", data);
    
    if (!profile?.organization_id) { 
      console.error("No organization_id found in profile:", profile);
      showErrorToast("No organisation found");
      return; 
    }
    
    console.log("Creating event with organization_id:", profile.organization_id);
    
    try {
      // Validate courts for team events
      if (data.player_type === "team") {
        const validCourts = courts.filter(c => c.name.trim());
        if (validCourts.length === 0) {
          showErrorToast("At least one court is required");
          return;
        }
      }

      const payload = {
        organization_id: profile.organization_id,
        name: data.name,
        sport: data.sport as Sport,
        format: data.format as EventFormat,
        player_type: data.player_type,
        max_participants: data.max_participants,
        venue: data.venue || null,
        start_date: data.start_date,
        end_date: multiDay ? (data.end_date || null) : null,
        duration_hours: data.duration_hours || null,
        status: data.status as EventStatus,
        description: data.description || null,
        teams_count: data.player_type === "team" ? (data.num_teams || 2) : 0,
        players_per_team: data.player_type === "team" ? (data.players_per_team || 11) : null,
        rounds_per_match: data.rounds_per_match || 1,
        courts_count: data.player_type === "team" ? courts.filter(c => c.name.trim()).length : 0,
        court_names: data.player_type === "team" ? courts.filter(c => c.name.trim()).map(c => c.name.trim()) : null,
        groups_count: data.format === "championship" ? (data.groups_count || 2) : null,
      };
      
      console.log("Event payload:", payload);
      
      const result = await createEvent.mutateAsync(payload);
      console.log("Event created successfully:", result);
      
      setCreatedEventId(result.id);
      
      // For team events, trigger schedule generation
      if (data.player_type === "team") {
        setShowScheduleModal(true);
        
        try {
          await generateSchedule.mutateAsync(result.id);
          
          // Show success state briefly, then navigate
          setTimeout(() => {
            setShowScheduleModal(false);
            showSuccessToast("Event and schedule created!");
            router.replace(`/(app)/events/${result.id}`);
          }, 1500);
        } catch (scheduleError) {
          console.error("Schedule generation failed:", scheduleError);
          // Modal will show error state with retry option
        }
      } else {
        // Individual events don't need schedule generation
        showSuccessToast("Event created successfully!");
        router.replace("/(app)/(tabs)/events");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create event";
      showErrorToast(errorMessage);
    }
  }

  function handleScheduleRetry() {
    if (createdEventId) {
      generateSchedule.mutate(createdEventId);
    }
  }

  function handleScheduleClose() {
    setShowScheduleModal(false);
    if (createdEventId) {
      router.replace(`/(app)/events/${createdEventId}`);
    }
  }

  const selectedSport = SPORTS.find((s) => s.sport === values.sport);
  const selectedFormat = FORMATS.find((f) => f.format === values.format);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => (step === 0 ? router.back() : setStep((s) => s - 1))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <ChevronLeft color={colors.textSecondary} size={20} strokeWidth={2.5} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>New Event</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Step progress */}
      <View style={styles.progressContainer}>
        {STEPS.map((label, i) => (
          <View key={i} style={styles.progressStep}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: i <= step ? colors.accent : colors.border },
              ]}
            />
            <Text
              style={[
                styles.progressLabel,
                { color: i === step ? colors.accent : colors.textTertiary },
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Step 0: Sport & Format */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Event Name"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Summer Tournament 2026"
                  error={errors.name?.message}
                />
              )}
            />

            <Text style={styles.sectionLabel}>Sport</Text>
            <View style={styles.sportGrid}>
              {SPORTS.map((s) => (
                <Pressable
                  key={s.sport}
                  onPress={() => {
                    setValue("sport", s.sport);
                    setValue("max_participants", s.maxParticipants);
                    if (!s.supportsIndividual) setValue("player_type", "team");
                    if (!s.supportsTeam) setValue("player_type", "individual");
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: values.sport === s.sport }}
                  style={({ pressed }) => [
                    styles.sportCard,
                    values.sport === s.sport && [
                      styles.sportCardSelected,
                      { borderColor: s.accent, backgroundColor: `${s.accent}15` },
                    ],
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text style={styles.sportEmoji}>{s.emoji}</Text>
                  <Text
                    style={[
                      styles.sportLabel,
                      values.sport === s.sport && { color: s.accent },
                    ]}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.sport && <Text style={styles.errorText}>{errors.sport.message}</Text>}

            <Text style={styles.sectionLabel}>Format</Text>
            <View style={styles.formatList}>
              {FORMATS.filter(
                (f) =>
                  !values.sport ||
                  (SPORTS.find((s) => s.sport === values.sport)?.formats ?? []).includes(
                    f.format
                  )
              ).map((f) => (
                <Pressable
                  key={f.format}
                  onPress={() => setValue("format", f.format)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: values.format === f.format }}
                  style={({ pressed }) => [
                    styles.formatCard,
                    values.format === f.format && styles.formatCardSelected,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text style={styles.formatLabel}>{f.label}</Text>
                  <Text style={styles.formatDescription}>{f.description}</Text>
                </Pressable>
              ))}
            </View>
            {errors.format && <Text style={styles.errorText}>{errors.format.message}</Text>}

            <Button label="Next →" onPress={nextStep} fullWidth />
          </View>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            {/* Player type */}
            {selectedSport &&
              selectedSport.supportsIndividual &&
              selectedSport.supportsTeam && (
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

                <Controller
                  control={control}
                  name="rounds_per_match"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Rounds per Match"
                      value={String(value || "")}
                      onChangeText={onChange}
                      keyboardType="numeric"
                      error={errors.rounds_per_match?.message}
                      hint="Number of rounds/games in each match (1-10)"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="rounds_per_match"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Rounds per Match"
                      value={String(value || "")}
                      onChangeText={onChange}
                      keyboardType="numeric"
                      error={errors.rounds_per_match?.message}
                      hint="How many rounds/games in each match (e.g., 3 for best of 3)"
                    />
                  )}
                />

                {/* Championship groups */}
                {values.format === "championship" && (
                  <Controller
                    control={control}
                    name="groups_count"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Number of Groups"
                        value={String(value || "")}
                        onChangeText={onChange}
                        keyboardType="numeric"
                        error={errors.groups_count?.message}
                        hint="Teams will be divided into groups for group stage"
                      />
                    )}
                  />
                )}

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Total participants: {values.max_participants || 0}
                  </Text>
                  <Text style={styles.infoSubtext}>
                    ({values.num_teams || 0} teams × {values.players_per_team || 0} players)
                  </Text>
                </View>

                {/* Courts */}
                <Text style={styles.sectionLabel}>Courts / Venues</Text>
                <Text style={styles.hint}>Add the courts or playing areas for this event</Text>
                {courts.map((court, index) => (
                  <View key={court.id} style={styles.courtRow}>
                    <View style={styles.courtInputContainer}>
                      <Input
                        label={`Court ${index + 1}`}
                        value={court.name}
                        onChangeText={(text) => updateCourtName(court.id, text)}
                        placeholder={`e.g., Court ${String.fromCharCode(65 + index)}`}
                      />
                    </View>
                    {courts.length > 1 && (
                      <Pressable
                        onPress={() => removeCourt(court.id)}
                        style={({ pressed }) => [
                          styles.removeCourtButton,
                          { opacity: pressed ? 0.6 : 1 },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Remove court"
                      >
                        <Trash2 size={18} color={colors.danger} strokeWidth={2.5} />
                      </Pressable>
                    )}
                  </View>
                ))}
                <Pressable
                  onPress={addCourt}
                  style={({ pressed }) => [
                    styles.addCourtButton,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Add another court"
                >
                  <Plus size={16} color={colors.accent} strokeWidth={2.5} />
                  <Text style={styles.addCourtText}>Add Court</Text>
                </Pressable>
              </>
            )}

            <Controller
              control={control}
              name="venue"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Venue (optional)"
                  value={value}
                  onChangeText={onChange}
                  placeholder="City Sports Centre"
                />
              )}
            />

            <Controller
              control={control}
              name="duration_hours"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Duration (hours per match)"
                  value={value ? String(value) : ""}
                  onChangeText={onChange}
                  keyboardType="decimal-pad"
                  placeholder="2"
                  error={errors.duration_hours?.message}
                />
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
                  placeholder="2026-06-01"
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
                    placeholder="2026-06-03"
                  />
                )}
              />
            )}

            {/* Status */}
            <Text style={styles.sectionLabel}>Status</Text>
            <View style={styles.statusRow}>
              {(["draft", "published"] as EventStatus[]).map((s) => (
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
                    {s === "draft" ? "Draft" : "Published"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Button label="Next →" onPress={nextStep} fullWidth />
          </View>
        )}

        {/* Step 2: Review & Submit */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Description (optional)"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Brief description of the event..."
                  multiline
                  numberOfLines={4}
                />
              )}
            />

            {/* Summary */}
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>Review</Text>
              {[
                ["Name", values.name],
                [
                  "Sport",
                  selectedSport ? `${selectedSport.emoji} ${selectedSport.label}` : "—",
                ],
                ["Format", selectedFormat?.label ?? "—"],
                ["Player Type", values.player_type === "individual" ? "Individual" : "Team"],
                ["Max Participants", String(values.max_participants)],
                ...(values.player_type === "team" && courts.some((c) => c.name)
                  ? [["Courts", courts.filter((c) => c.name).map((c) => c.name).join(", ")]]
                  : []),
                ["Venue", values.venue || "—"],
                ["Duration (hours)", values.duration_hours ? String(values.duration_hours) : "—"],
                ...(values.player_type === "team" 
                  ? [["Rounds per Match", String(values.rounds_per_match || 1)]] 
                  : []),
                ["Start Date", values.start_date],
                ...(multiDay ? [["End Date", values.end_date || "—"]] : []),
                ["Status", values.status === "draft" ? "Draft" : "Published"],
              ].map(([k, v]) => (
                <View key={k} style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>{k}</Text>
                  <Text style={styles.reviewValue}>{v}</Text>
                </View>
              ))}
            </View>

            <Button
              label="Create Event"
              onPress={async () => {
                console.log("Create Event button pressed");
                console.log("Form values:", watch());
                console.log("Form errors:", errors);
                
                // Validate all fields before submitting
                const isValid = await trigger();
                
                if (!isValid) {
                  // Get the first error message
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
              loading={createEvent.isPending}
              fullWidth
            />
          </View>
        )}
      </ScrollView>

      {/* Schedule Generation Modal */}
      <ScheduleGenerationModal
        visible={showScheduleModal}
        sportEmoji={selectedSport?.emoji || "🏆"}
        isLoading={generateSchedule.isPending}
        isSuccess={generateSchedule.isSuccess}
        isError={generateSchedule.isError}
        error={generateSchedule.error?.message}
        result={generateSchedule.data}
        onRetry={handleScheduleRetry}
        onClose={handleScheduleClose}
      />
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
    width: 60,
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
  progressContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.cardSurface,
  },
  progressStep: {
    flex: 1,
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 3,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.small,
    fontSize: 10,
    fontWeight: "600",
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  stepContainer: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sportGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sportCard: {
    width: "31%",
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  sportCardSelected: {
    borderWidth: 2,
  },
  sportEmoji: {
    fontSize: 28,
  },
  sportLabel: {
    ...typography.small,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    color: colors.textSecondary,
  },
  formatList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  formatCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
  },
  formatCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  formatLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  formatDescription: {
    ...typography.small,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.small,
    color: colors.danger,
    marginBottom: spacing.md,
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
  reviewCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  reviewTitle: {
    ...typography.small,
    color: colors.textTertiary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  reviewLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  reviewValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "700",
    textAlign: "right",
    flex: 1,
    marginLeft: spacing.md,
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
  hint: {
    ...typography.small,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    marginTop: -spacing.xs,
  },
  courtRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  courtInputContainer: {
    flex: 1,
  },
  removeCourtButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.status.cancelled.bg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  addCourtButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent + "40",
    marginBottom: spacing.lg,
  },
  addCourtText: {
    ...typography.bodyBold,
    color: colors.accentInk,
  },
});
