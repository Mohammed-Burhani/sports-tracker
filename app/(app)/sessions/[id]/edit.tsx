import React, { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession, useUpdateSession } from "@/hooks/useSessions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

const DURATION_PRESETS = [1, 1.5, 2, 2.5, 3, 4, 6, 8];

const schema = z.object({
  name: z.string().min(1),
  date: z.string().min(4),
  start_time: z.string().min(3),
  duration_hours: z.coerce.number().min(0.5),
  venue_area: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]),
});

type FormData = z.infer<typeof schema>;

export default function EditSession() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isLoading } = useSession(id);
  const updateSession = useUpdateSession();
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    values: session
      ? {
          name: session.name,
          date: session.date,
          start_time: session.start_time,
          duration_hours: session.duration_hours,
          venue_area: session.venue_area ?? "",
          notes: session.notes ?? "",
          status: session.status as any,
        }
      : undefined,
  });

  const values = watch();
  const activeDuration = selectedDuration ?? session?.duration_hours ?? 1;

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
        <View className="p-4 gap-3">
          <Skeleton height={20} width="60%" />
          <Skeleton height={44} />
          <Skeleton height={44} />
        </View>
      </SafeAreaView>
    );
  }

  async function onSubmit(data: FormData) {
    await updateSession.mutateAsync({ id, payload: { ...data, venue_area: data.venue_area || null, notes: data.notes || null } });
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <View className="flex-row items-center px-4 pt-2 pb-4 border-b" style={{ borderBottomColor: "#334155" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-slate-400 text-sm mr-4">← Cancel</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Edit Session</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
          <Input label="Session Name" value={value} onChangeText={onChange} error={errors.name?.message} />
        )} />

        <Controller control={control} name="date" render={({ field: { onChange, value } }) => (
          <Input label="Date (YYYY-MM-DD)" value={value} onChangeText={onChange} error={errors.date?.message} />
        )} />

        <Controller control={control} name="start_time" render={({ field: { onChange, value } }) => (
          <Input label="Start Time (HH:MM)" value={value} onChangeText={onChange} />
        )} />

        <Text className="text-slate-400 text-sm mb-2 font-medium">Duration</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {DURATION_PRESETS.map((d) => (
            <TouchableOpacity key={d} onPress={() => { setSelectedDuration(d); setValue("duration_hours", d); }}
              className="rounded-xl px-4 py-2"
              style={{ backgroundColor: activeDuration === d ? "#6366F133" : "#1E293B", borderWidth: 1.5, borderColor: activeDuration === d ? "#6366F1" : "#334155" }}>
              <Text style={{ color: activeDuration === d ? "#A5B4FC" : "#CBD5E1", fontWeight: "600", fontSize: 13 }}>
                {d === 8 ? "Full Day" : `${d}h`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Controller control={control} name="venue_area" render={({ field: { onChange, value } }) => (
          <Input label="Venue Area" value={value} onChangeText={onChange} />
        )} />

        <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
          <Input label="Notes" value={value} onChangeText={onChange} multiline numberOfLines={2} />
        )} />

        <Text className="text-slate-400 text-sm mb-2 font-medium">Status</Text>
        <View className="flex-row gap-2 mb-5 flex-wrap">
          {["scheduled", "ongoing", "completed", "cancelled"].map((s) => (
            <TouchableOpacity key={s} onPress={() => setValue("status", s as any)}
              className="rounded-full px-4 py-1.5"
              style={{ backgroundColor: values.status === s ? "#6366F133" : "#1E293B", borderWidth: 1, borderColor: values.status === s ? "#6366F1" : "#334155" }}>
              <Text className="text-white text-sm font-semibold capitalize">{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button label="Save Changes" onPress={handleSubmit(onSubmit)} loading={updateSession.isPending} color="#F59E0B" fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}
