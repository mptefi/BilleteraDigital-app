import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";

function TransactionRow({ item, isLast }) {
  const isIncome = item.type === "income";

  return (
    <View>
      <View style={styles.transactionRow}>
        <View style={styles.txIconCircle}>
          {item.icon === "user" && (
            <Feather name="user" size={20} color={COLORS.textSecondary} />
          )}
          {item.icon === "signal" && (
            <Feather name="bar-chart-2" size={20} color={COLORS.textSecondary} />
          )}
          {item.icon === "download" && (
            <Feather name="download" size={20} color={COLORS.success} />
          )}
          {item.icon === "coffee" && (
            <Feather name="coffee" size={20} color={COLORS.textSecondary} />
          )}
          {item.icon === "file" && (
            <Feather name="file-text" size={20} color={COLORS.textSecondary} />
          )}
        </View>

        <View style={styles.txDetails}>
          <Text style={styles.txTitle}>{item.title}</Text>
          <Text style={styles.txDate}>{item.date}</Text>
        </View>

        <Text
          style={[
            styles.txAmount,
            isIncome ? styles.txAmountIncome : styles.txAmountExpense,
          ]}
        >
          {item.amount}
        </Text>
      </View>

      {!isLast && <View style={styles.txDivider} />}
    </View>
  );
}

export default React.memo(TransactionRow);

const styles = StyleSheet.create({
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  txIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F6F6F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "bold",
  },
  txAmountExpense: {
    color: COLORS.textPrimary,
  },
  txAmountIncome: {
    color: COLORS.success,
  },
  txDivider: {
    height: 1,
    backgroundColor: "#F2F2F2",
  },
});
