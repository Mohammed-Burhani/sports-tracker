import React, { useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Edit2, Trash2 } from "lucide-react-native";
import { Team } from "@/types";
import { useCreateTeam, useUpdateTeam, useDeleteTeam } from "@/hooks/useTeams";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";

const PRESET_COLOURS = [
  "#EF4444", "#F97316", "#F59E0B", "#22C55E",
  "#06B6D4", "#6366F1", "#8B5CF6", "#EC4899",
  "#14B8A6", "#84CC16", "#F43F5E", "#A855F7",
];

const schema = z.object({
  name: z.string().min(1, "Team name required"),
  colour_hex: z.string().min(4, "Pick a colour"),
  captain_name: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface TeamModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  teams: Team[];
  editTeam?: Team;
  onEditTeam: (t: Team | undefined) => void;
}

export default function TeamModal({ visible, onClose, eventId, teams, editTeam, onEditTeam }: TeamModalProps) {
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", colour_hex: PRESET_COLOURS[0], captain_name: "", notes: "" },
  });

  useEffect(() => {
    if (editTeam) {
      reset({
        name: editTeam.name,
        colour_hex: editTeam.colour_hex,
        captain_name: editTeam.captain_name ?? "",
        notes: editTeam.notes ?? "",
      });
    } else {
      reset({ name: "", colour_hex: PRESET_COLOURS[0], captain_name: "", notes: "" });
    }
  }, [editTeam]);

  const selectedColour = watch("colour_hex");

  async function onSubmit(data: FormData) {
    // Check unique name
    const existing = teams.find(
      (t) => t.name.toLowerCase() === data.name.toLowerCase() && t.id !== editTeam?.id
    );
    if (existing) { Alert.alert("Duplicate", "A team with that name already exists."); return; }
    if (!editTeam && teams.length >= 10) { Alert.alert("Limit reached", "Maximum 10 teams per event."); return; }

    if (editTeam) {
      await updateTeam.mutateAsync({ id: editTeam.id, payload: { ...data, captain_name: data.captain_name || null, notes: data.notes || null } });
    } else {
      await createTeam.mutateAsync({ event_id: eventId, ...data, captain_name: data.captain_name || null, notes: data.notes || null, logo_url: null });
    }
    onEditTeam(undefined);
    reset({ name: "", colour_hex: PRESET_COLOURS[0], captain_name: "", notes: "" });
  }

  async function handleDelete(team: Team) {
    Alert.alert("Remove Team", `Remove "${team.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await deleteTeam.mutateAsync({ id: team.id, eventId });
          if (editTeam?.id === team.id) onEditTeam(undefined);
        },
      },
    ]);
  }

  const isLoading = createTeam.isPending || updateTeam.isPending;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Teams</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <X size={24} color={colors.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Existing teams */}
            {teams.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  Registered Teams ({teams.length}/10)
                </Text>
                {teams.map((team) => (
                  <View
                    key={team.id}
                    style={[styles.teamCard, shadows.card]}
                  >
                    <View style={[styles.teamColorBar, { backgroundColor: team.colour_hex }]} />
                    <View style={styles.teamContent}>
                      <View style={styles.teamInfo}>
                        <Text style={styles.teamName}>{team.name}</Text>
                        {team.captain_name && (
                          <Text style={styles.teamCaptain}>Captain: {team.captain_name}</Text>
                        )}
                      </View>
                      <View style={styles.teamActions}>
                        <TouchableOpacity
                          onPress={() => onEditTeam(team)}
                          style={styles.teamActionButton}
                          activeOpacity={0.7}
                        >
                          <Edit2 size={16} color={colors.primaryAccent} strokeWidth={2.5} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(team)}
                          style={styles.teamActionButton}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={16} color={colors.danger} strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Add / Edit form */}
            <View style={styles.section}>
              <Text style={styles.formTitle}>
                {editTeam ? `Edit "${editTeam.name}"` : "Add Team"}
              </Text>

              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <Input label="Team Name" value={value} onChangeText={onChange} error={errors.name?.message} />
                )}
              />

              <Text style={styles.label}>Colour</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLOURS.map((c) => {
                  const isSelected = selectedColour === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setValue("colour_hex", c)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c },
                        isSelected && styles.colorSwatchSelected
                      ]}
                      activeOpacity={0.8}
                    >
                      {isSelected && (
                        <View style={styles.colorCheck}>
                          <Text style={styles.colorCheckText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Controller
                control={control}
                name="captain_name"
                render={({ field: { onChange, value } }) => (
                  <Input label="Captain Name (optional)" value={value} onChangeText={onChange} />
                )}
              />
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, value } }) => (
                  <Input label="Notes (optional)" value={value} onChangeText={onChange} multiline numberOfLines={2} />
                )}
              />

              <View style={styles.formActions}>
                {editTeam && (
                  <Button
                    label="Cancel"
                    variant="secondary"
                    onPress={() => { onEditTeam(undefined); reset(); }}
                    size="md"
                  />
                )}
                <Button
                  label={editTeam ? "Save Changes" : (teams.length >= 10 ? "Limit Reached" : "Add Team")}
                  onPress={handleSubmit(onSubmit)}
                  loading={isLoading}
                  disabled={!editTeam && teams.length >= 10}
                  color={colors.primaryAccent}
                  fullWidth={!editTeam}
                />
              </View>
            </View>

            {/* Bottom padding */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardSurface,
  },
  headerTitle: {
    ...typography.title,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.small,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  teamCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  teamColorBar: {
    height: 4,
  },
  teamContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  teamCaptain: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  teamActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  teamActionButton: {
    padding: spacing.sm,
  },
  formTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: colors.textPrimary,
  },
  colorCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCheckText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
