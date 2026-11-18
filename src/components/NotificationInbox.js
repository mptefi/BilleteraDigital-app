import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import AppModal from "./AppModal";
import { FeatureStatus } from "./FeatureScreen";
import { activityCategories, notificationActivity } from "../services/notificationActivity";
import { sendActivityNotification } from "../services/reminders";
import { COLORS } from "../theme/colors";

const filters = [["all", "Todas"], ...Object.entries(activityCategories).map(([key, value]) => [key, value.label])];

export function NotificationCategories() {
  return (
    <View style={styles.permissionCategories}>
      {Object.entries(activityCategories).map(([category, { label, icon, color, background }]) => (
        <View key={category} style={[styles.permissionTag, { backgroundColor: background }]}>
          <Feather name={icon} size={15} color={color} />
          <Text style={[styles.permissionTagText, { color }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function NotificationInbox({ uid, transactions, onOpenHistory }) {
  const items = useMemo(() => notificationActivity(transactions), [transactions]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const visibleItems = filter === "all" ? items : items.filter((item) => item.category === filter);
  const isMovement = selected && !selected.example;
  const selectedCategory = selected && activityCategories[selected.category];

  const handleAction = async () => {
    const item = selected;
    setSelected(null);
    if (isMovement) {
      onOpenHistory();
      return;
    }
    try {
      const sent = await sendActivityNotification(uid, item);
      setNotice(sent ? "Aviso de prueba enviado." : "Activa las notificaciones para enviar el aviso.");
    } catch {
      setNotice("No pudimos mostrar el aviso. Intenta nuevamente.");
    }
  };

  return (
    <>
      <View style={styles.filters}>
        {filters.map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === key }}
            onPress={() => { setFilter(key); setNotice(""); }}
            style={[styles.filter, filter === key && styles.selectedFilter]}
          >
            <Text style={styles.filterText}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <Text accessibilityRole="header" style={styles.sectionTitle}>Actividad</Text>
      {!!notice && <FeatureStatus icon="bell" message={notice} />}
      <View style={styles.list}>
        {visibleItems.map((item) => {
          const category = activityCategories[item.category];
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => { setSelected(item); setNotice(""); }}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={[styles.icon, { backgroundColor: category.background }]}>
                <Feather name={category.icon} size={21} color={category.color} />
              </View>
              <View style={styles.cardCopy}>
                <Text style={[styles.category, { color: category.color }]}>{category.label}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMessage}>{item.message}</Text>
                <Text style={styles.metadata}>{item.example ? "Ejemplo" : `Simulado · ${item.date}`}</Text>
              </View>
              <Feather name="chevron-right" size={17} color={COLORS.textSecondary} />
            </Pressable>
          );
        })}
      </View>
      <AppModal
        visible={Boolean(selected)}
        icon={selectedCategory?.icon || "bell"}
        iconTone={selectedCategory}
        title={selected?.title}
        message={selected?.message}
        primaryLabel={isMovement ? "Ver movimientos" : "Probar aviso"}
        onPrimary={handleAction}
        secondaryLabel="Cerrar"
        onSecondary={() => setSelected(null)}
        onClose={() => setSelected(null)}
      >
        {selectedCategory && (
          <View style={[styles.permissionTag, { backgroundColor: selectedCategory.background }]}>
            <Text style={[styles.permissionTagText, { color: selectedCategory.color }]}>
              {selectedCategory.label} · {isMovement ? "Simulado" : "Ejemplo"}
            </Text>
          </View>
        )}
      </AppModal>
    </>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filter: {
    minHeight: 44, justifyContent: "center", paddingHorizontal: 13,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 22, backgroundColor: COLORS.white,
  },
  selectedFilter: { borderColor: "#F6BC85", backgroundColor: "#FFE6CE" },
  filterText: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  sectionTitle: { fontSize: 19, fontWeight: "700", color: COLORS.textPrimary, marginTop: 6 },
  list: { gap: 10 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.white,
    padding: 14, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border,
  },
  pressed: { backgroundColor: COLORS.primaryLight },
  icon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  cardCopy: { flex: 1, gap: 3 },
  category: { fontSize: 12, fontWeight: "700" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  cardMessage: { fontSize: 14, lineHeight: 19, color: COLORS.textSecondary },
  metadata: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  permissionCategories: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginVertical: 4 },
  permissionTag: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 12 },
  permissionTagText: { fontSize: 13, fontWeight: "700" },
});
