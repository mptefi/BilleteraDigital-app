import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";

function FaqItem({ item, isExpanded, onToggle }) {
  return (
    <View style={styles.faqCard}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => onToggle(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Feather
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={22}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.faqBody}>
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
}

export default React.memo(FaqItem);

const styles = StyleSheet.create({
  faqCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECECEC",
    overflow: "hidden",
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    paddingRight: 10,
    lineHeight: 18,
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
    paddingTop: 12,
  },
  faqAnswer: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
