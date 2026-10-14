import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { fetchExchangeRates } from "../services/api";
import {
  getStoredJson,
  setStoredJson,
  storageKeys,
} from "../services/storage";
import TransactionRow from "../components/TransactionRow";
import EmptyState from "../components/EmptyState";
import RetryState from "../components/RetryState";
import AppModal from "../components/AppModal";

const filterOptions = [
  { id: "all", label: "Todos" },
  { id: "income", label: "Ingresos" },
  { id: "expense", label: "Gastos" },
];

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [rates, setRates] = useState([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  const showInfoModal = useCallback((config) => {
    setModalConfig(config);
  }, []);

  const formattedBalance = useMemo(() => {
    if (!showBalance) {
      return "S/ ******";
    }

    return `S/ ${balance.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
    })}`;
  }, [balance, showBalance]);

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return transactions.filter((item) => {
      const matchesFilter =
        selectedFilter === "all" || item.type === selectedFilter;
      const matchesSearch =
        normalizedQuery.length === 0 ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.date.toLowerCase().includes(normalizedQuery) ||
        item.amount.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    });
  }, [searchQuery, selectedFilter, transactions]);

  const totals = useMemo(
    () =>
      transactions.reduce(
        (acc, item) => {
          if (item.type === "income") {
            acc.income += 1;
          } else {
            acc.expense += 1;
          }
          return acc;
        },
        { income: 0, expense: 0 }
      ),
    [transactions]
  );

  const loadRates = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setRatesLoading(true);
    }
    setRatesError("");

    try {
      const data = await fetchExchangeRates();
      setRates(data);
      setStoredJson(storageKeys.offers, data);
    } catch (error) {
      const cachedRates = await getStoredJson(storageKeys.offers, []);
      if (cachedRates.length > 0) {
        setRates(cachedRates);
      }
      setRatesError("No pudimos actualizar el tipo de cambio.");
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRates({ silent: true });
    setRefreshing(false);
  }, [loadRates]);

  const renderTransaction = useCallback(
    ({ item, index }) => (
      <View style={styles.transactionRowShell}>
        <TransactionRow
          item={item}
          isLast={index === filteredTransactions.length - 1}
        />
      </View>
    ),
    [filteredTransactions.length]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  const renderRateCard = useCallback(
    (item) => (
      <View key={item.id} style={styles.rateCard}>
        <View style={[styles.rateAccent, { backgroundColor: item.accent }]} />
        <View style={styles.rateIconCircle}>
          <Feather name={item.icon} size={18} color={COLORS.primary} />
        </View>
        <View style={styles.rateTextBox}>
          <Text style={styles.rateTitle}>{item.title}</Text>
          <Text style={styles.rateDescription}>{item.description}</Text>
        </View>
      </View>
    ),
    []
  );

  const ListHeader = useMemo(
    () => (
      <View>
        <View style={styles.topHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
              </View>
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.greetingText}>Hola, buenas tardes</Text>
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
              onPress={() =>
                showInfoModal({
                  icon: "bell",
                  title: "Notificaciones",
                  message: "No tienes notificaciones pendientes.",
                })
              }
              activeOpacity={0.7}
            >
              <Feather name="bell" size={20} color={COLORS.textPrimary} />
              <View style={styles.redDot} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <TouchableOpacity
              style={styles.saldoToggleRow}
              onPress={toggleBalanceVisibility}
            >
              <Text style={styles.saldoLabel}>Saldo disponible</Text>
              <Feather
                name={showBalance ? "eye" : "eye-off"}
                size={18}
                color={COLORS.white}
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>

            <View style={styles.billeteraBadge}>
              <Feather
                name="mail"
                size={14}
                color={COLORS.white}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.billeteraBadgeText}>Billetera</Text>
            </View>
          </View>

          <Text style={styles.balanceAmountText}>{formattedBalance}</Text>
        </View>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() =>
              showInfoModal({
                icon: "arrow-up-right",
                title: "Transferir",
                message: "Modulo de transferencia rapida.",
              })
            }
          >
            <View style={styles.actionCircle}>
              <Feather name="arrow-up-right" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>Transferir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() =>
              showInfoModal({
                icon: "gift",
                title: "Promos",
                message: "Revisa tus promociones exclusivas.",
              })
            }
          >
            <View style={styles.actionCircle}>
              <Image
                source={require("../../mockups/promociones.png")}
                style={[styles.promoIconImg, { tintColor: COLORS.primary }]}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.actionLabel}>Promos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() =>
              showInfoModal({
                icon: "shield",
                title: "Aprobar compras",
                message: "Aprobacion de compras pendientes.",
              })
            }
          >
            <View style={styles.actionCircle}>
              <Feather name="shield" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>Aprobar compras</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() =>
              showInfoModal({
                icon: "file-text",
                title: "Servicios",
                message: "Pago de luz, agua y servicios.",
              })
            }
          >
            <View style={styles.actionCircle}>
              <Feather name="file-text" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>Servicios</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.promoBannerCard}>
          <View style={styles.promoIndicator} />
          <View style={styles.promoBody}>
            <Text style={styles.promoTag}>EXCLUSIVO</Text>
            <Text style={styles.promoTitle}>Gana hasta 15% cashback</Text>
            <Text style={styles.promoSub}>
              Comprando los viernes en locales seleccionados.
            </Text>
            <TouchableOpacity
              onPress={() =>
                showInfoModal({
                  icon: "gift",
                  title: "Cashback",
                  message: "Terminos y condiciones del cashback.",
                })
              }
            >
              <Text style={styles.promoLink}>Ver mas</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.promoCoinBadge}>
            <Ionicons name="gift-outline" size={32} color={COLORS.primary} />
          </View>
        </View>

        <View style={styles.apiSectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Tipo de cambio</Text>
            <Text style={styles.sectionSubtitle}>
              Actualizado desde una API REST publica
            </Text>
          </View>
          {ratesLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : null}
        </View>

        {ratesError && rates.length === 0 ? (
          <RetryState
            message={ratesError}
            onRetry={() => loadRates()}
            loading={ratesLoading}
          />
        ) : (
          <View style={styles.ratesList}>{rates.map(renderRateCard)}</View>
        )}

        {ratesError && rates.length > 0 ? (
          <Text style={styles.cacheWarning}>
            Mostrando ultimo dato guardado. Desliza para reintentar.
          </Text>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Ultimos movimientos</Text>
            <Text style={styles.sectionSubtitle}>
              {transactions.length} total · {totals.income} ingresos ·{" "}
              {totals.expense} gastos
            </Text>
          </View>
          <TouchableOpacity onPress={() => setActiveTab("movimientos")}>
            <Text style={styles.verTodoText}>Ver todo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Feather
            name="search"
            size={18}
            color={COLORS.textMuted}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar movimientos"
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filterRow}>
          {filterOptions.map((option) => {
            const isActive = selectedFilter === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedFilter(option.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.transactionsCard}>
          {filteredTransactions.length === 0 ? (
            <EmptyState
              icon="search"
              title="Sin movimientos"
              message="Prueba otro texto o cambia el filtro seleccionado."
            />
          ) : null}
        </View>
      </View>
    ),
    [
      userName,
      setCurrentScreen,
      showInfoModal,
      toggleBalanceVisibility,
      showBalance,
      formattedBalance,
      ratesLoading,
      ratesError,
      rates,
      renderRateCard,
      loadRates,
      transactions.length,
      totals.income,
      totals.expense,
      searchQuery,
      selectedFilter,
      filteredTransactions.length,
    ]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <FlatList
        data={filteredTransactions}
        keyExtractor={keyExtractor}
        renderItem={renderTransaction}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        getItemLayout={(_, index) => ({
          length: 69,
          offset: 69 * index,
          index,
        })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListFooterComponent={<View style={styles.footerSpacer} />}
      />

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
            color={
              activeTab === "movimientos" ? COLORS.primary : COLORS.textMuted
            }
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

        <TouchableOpacity
          style={styles.qrButtonFab}
          onPress={() =>
            showInfoModal({
              icon: "camera",
              title: "Escaner QR Al Toque",
              message: "Escanea un codigo QR para pagar o cobrar al instante.",
            })
          }
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={26}
            color={COLORS.white}
          />
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

      <AppModal
        visible={Boolean(modalConfig)}
        icon={modalConfig?.icon}
        title={modalConfig?.title}
        message={modalConfig?.message}
        primaryLabel="Entendido"
        onPrimary={() => setModalConfig(null)}
        onClose={() => setModalConfig(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBFBFB",
  },
  listContent: {
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
    marginBottom: 24,
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
  apiSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ratesList: {
    gap: 10,
    marginBottom: 24,
  },
  rateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    padding: 14,
    overflow: "hidden",
  },
  rateAccent: {
    width: 4,
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  rateIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rateTextBox: {
    flex: 1,
  },
  rateTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  rateDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cacheWarning: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: -14,
    marginBottom: 20,
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
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  verTodoText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: COLORS.primaryLight,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  transactionsCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "#EFEFEF",
    paddingHorizontal: 16,
  },
  transactionRowShell: {
    backgroundColor: COLORS.white,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#EFEFEF",
    paddingHorizontal: 16,
  },
  footerSpacer: {
    height: 12,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EFEFEF",
    marginBottom: 20,
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
