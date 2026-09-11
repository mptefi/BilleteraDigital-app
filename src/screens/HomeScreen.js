import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

export default function HomeScreen() {
  const {
    setCurrentScreen,
    userName,
    balance,
    showBalance,
    toggleBalanceVisibility,
    transactions,
  } = useAuth();
  const [activeTab, setActiveTab] = useState("inicio");

  const formattedBalance = showBalance
    ? `S/ ${balance.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
    : "S/ ••••••";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cabecera Superior: Usuario, Ayuda, Notificaciones */}
        <View style={styles.topHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
              </View>
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.greetingText}>¡Hola, buenas tardes!</Text>
              <Text style={styles.userNameText}>{userName}</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBadgeBtn}
              onPress={() => setCurrentScreen("SUPPORT")}
              activeOpacity={0.7}
            >
              <Image
                source={require("../../mockups/auriculares.png")}
                style={styles.headerIconImg}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBadgeBtn}
              onPress={() => Alert.alert("Notificaciones", "No tienes notificaciones pendientes.")}
              activeOpacity={0.7}
            >
              <Feather name="bell" size={20} color={COLORS.textPrimary} />
              <View style={styles.redDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tarjeta de Saldo Naranja */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <TouchableOpacity style={styles.saldoToggleRow} onPress={toggleBalanceVisibility}>
              <Text style={styles.saldoLabel}>Saldo disponible</Text>
              <Feather
                name={showBalance ? "eye" : "eye-off"}
                size={18}
                color={COLORS.white}
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>

            <View style={styles.billeteraBadge}>
              <Feather name="mail" size={14} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.billeteraBadgeText}>Billetera</Text>
            </View>
          </View>

          <Text style={styles.balanceAmountText}>{formattedBalance}</Text>
        </View>

        {/* Acciones Rápidas (4 Botones Circulares) con promociones.png */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => Alert.alert("Transferir", "Módulo de transferencia rápida.")}
          >
            <View style={styles.actionCircle}>
              <Feather name="arrow-up-right" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>Transferir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => Alert.alert("Promos", "Revisa tus promociones exclusivas.")}
          >
            <View style={styles.actionCircle}>
              <Image
                source={require("../../mockups/promociones.png")}
                style={styles.promoIconImg}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.actionLabel}>Promos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => Alert.alert("Aprobar compras", "Aprobación de compras pendientes.")}
          >
            <View style={styles.actionCircle}>
              <Feather name="shield" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>Aprobar compras</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => Alert.alert("Servicios", "Pago de luz, agua y servicios.")}
          >
            <View style={styles.actionCircle}>
              <Feather name="file-text" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>Servicios</Text>
          </TouchableOpacity>
        </View>

        {/* Banner Exclusivo Cashback */}
        <View style={styles.promoBannerCard}>
          <View style={styles.promoIndicator} />
          <View style={styles.promoBody}>
            <Text style={styles.promoTag}>EXCLUSIVO</Text>
            <Text style={styles.promoTitle}>¡Gana hasta 15% cashback!</Text>
            <Text style={styles.promoSub}>Comprando los viernes en locales seleccionados.</Text>
            <TouchableOpacity onPress={() => Alert.alert("Cashback", "Términos y condiciones del cashback.")}>
              <Text style={styles.promoLink}>Ver más</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.promoCoinBadge}>
            <Ionicons name="gift-outline" size={32} color={COLORS.primary} />
          </View>
        </View>

        {/* Sección Últimos Movimientos */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimos movimientos</Text>
          <TouchableOpacity onPress={() => setActiveTab("movimientos")}>
            <Text style={styles.verTodoText}>Ver todo →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsCard}>
          {transactions.map((item, index) => {
            const isIncome = item.type === "income";
            return (
              <View key={item.id}>
                <View style={styles.transactionRow}>
                  <View style={styles.txIconCircle}>
                    {item.icon === "user" && <Feather name="user" size={20} color={COLORS.textSecondary} />}
                    {item.icon === "signal" && <Feather name="bar-chart-2" size={20} color={COLORS.textSecondary} />}
                    {item.icon === "download" && <Feather name="download" size={20} color={COLORS.success} />}
                    {item.icon === "coffee" && <Feather name="coffee" size={20} color={COLORS.textSecondary} />}
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

                {index < transactions.length - 1 && <View style={styles.txDivider} />}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Barra de Navegación Inferior */}
      <View style={styles.tabBarContainer}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("inicio")}
        >
          <Feather
            name="home"
            size={24}
            color={activeTab === "inicio" ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === "inicio" && styles.tabLabelActive,
            ]}
          >
            Inicio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("movimientos")}
        >
          <Feather
            name="list"
            size={24}
            color={activeTab === "movimientos" ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === "movimientos" && styles.tabLabelActive,
            ]}
          >
            Movimientos
          </Text>
        </TouchableOpacity>

        {/* Botón Flotante Central QR */}
        <TouchableOpacity
          style={styles.qrButtonFab}
          onPress={() => Alert.alert("Escáner QR Al Toque", "Escanea un código QR para pagar o cobras al instante.")}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={26} color={COLORS.white} />
          <Text style={styles.qrFabLabel}>QR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("tarjetas")}
        >
          <Feather
            name="credit-card"
            size={24}
            color={activeTab === "tarjetas" ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === "tarjetas" && styles.tabLabelActive,
            ]}
          >
            Tarjetas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentScreen("LOGIN")}
        >
          <Feather name="grid" size={24} color={COLORS.textMuted} />
          <Text style={styles.tabLabel}>Salir</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBFBFB",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#00C853",
    borderWidth: 2,
    borderColor: COLORS.white,
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  greetingText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  iconBadgeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    position: "relative",
  },
  headerIconImg: {
    width: 22,
    height: 22,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    position: "absolute",
    top: 8,
    right: 8,
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  saldoToggleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  saldoLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  billeteraBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  billeteraBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
  },
  balanceAmountText: {
    fontSize: 34,
    fontWeight: "bold",
    color: COLORS.white,
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 26,
  },
  actionItem: {
    alignItems: "center",
    width: 72,
  },
  actionCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F2F2F2",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  promoIconImg: {
    width: 28,
    height: 28,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
    lineHeight: 14,
  },
  promoBannerCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    position: "relative",
    overflow: "hidden",
  },
  promoIndicator: {
    width: 4,
    height: "100%",
    backgroundColor: "#FFB800",
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  promoBody: {
    flex: 1,
    paddingLeft: 10,
  },
  promoTag: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#B38B00",
    backgroundColor: "#FFF8D6",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  promoSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  promoLink: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  promoCoinBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  verTodoText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  transactionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
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
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EFEFEF",
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  qrButtonFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -28,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  qrFabLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.white,
    marginTop: -2,
  },
});
