import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
  Linking,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import FaqItem from "../components/FaqItem";
import EmptyState from "../components/EmptyState";

const faqs = [
  {
    id: "recover-pin",
    question: "Olvide mi clave de acceso, como la recupero?",
    answer:
      "En la pantalla de inicio selecciona 'Olvidaste tu clave?', ingresa tu correo registrado y sigue el flujo para validar tu identidad.",
  },
  {
    id: "wrong-number",
    question: "Que hago si envie dinero al numero equivocado?",
    answer:
      "Comunicate inmediatamente con soporte por WhatsApp o correo para revisar si la transaccion aun puede ser bloqueada.",
  },
  {
    id: "limits",
    question: "Cuales son los limites diarios de envio?",
    answer:
      "El limite estandar por operacion es de S/ 500.00 y el acumulado diario maximo es de S/ 2,000.00 por seguridad.",
  },
  {
    id: "profile",
    question: "Como actualizo mis datos registrados?",
    answer:
      "Ingresa a la seccion Perfil o Mas dentro del menu principal para modificar telefono, correo o direccion registrada.",
  },
];

export default function SupportScreen() {
  const { setCurrentScreen, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const searchInputRef = useRef(null);

  const filteredFaqs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return faqs;
    }

    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(normalizedQuery) ||
        faq.answer.toLowerCase().includes(normalizedQuery)
    );
  }, [searchQuery]);

  const toggleAccordion = useCallback((id) => {
    setExpandedId((currentId) => (currentId === id ? null : id));
  }, []);

  const handleWhatsApp = useCallback(() => {
    Linking.openURL(
      "https://wa.me/51999999999?text=Hola,%20necesito%20ayuda%20con%20Al%20Toque"
    );
  }, []);

  const handleReportEmail = useCallback(() => {
    Linking.openURL(
      "mailto:soporte@altoque.pe?subject=Reporte%20de%20Problema"
    );
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  const renderFaq = useCallback(
    ({ item }) => (
      <FaqItem
        item={item}
        isExpanded={expandedId === item.id}
        onToggle={toggleAccordion}
      />
    ),
    [expandedId, toggleAccordion]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  const ListHeader = useMemo(
    () => (
      <View>
        <Text style={styles.title}>Centro de Ayuda</Text>

        <View style={styles.searchBar}>
          <Feather
            name="search"
            size={20}
            color={COLORS.textMuted}
            style={{ marginRight: 10 }}
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="En que podemos ayudarte?"
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={clearSearch} activeOpacity={0.7}>
              <Feather name="x" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.contactCardsRow}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleWhatsApp}
            activeOpacity={0.7}
          >
            <View style={styles.contactIconBadge}>
              <Image
                source={require("../../mockups/auriculares.png")}
                style={[styles.contactIconImg, { tintColor: COLORS.primary }]}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.contactCardTitle}>Atencion WhatsApp</Text>
            <Text style={styles.contactCardSub}>Respuesta inmediata</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleReportEmail}
            activeOpacity={0.7}
          >
            <View style={styles.contactIconBadge}>
              <Image
                source={require("../../mockups/correo-electronico.png")}
                style={[styles.contactIconImg, { tintColor: COLORS.primary }]}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.contactCardTitle}>Reportar problema</Text>
            <Text style={styles.contactCardSub}>Envianos un correo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
      </View>
    ),
    [clearSearch, handleReportEmail, handleWhatsApp, searchQuery]
  );

  const ListEmpty = useMemo(
    () => (
      <EmptyState
        icon="search"
        title="Sin resultados"
        message="Intenta con otra palabra o limpia la busqueda."
      />
    ),
    []
  );

  const ListFooter = useMemo(
    () => (
      <View>
        <View style={styles.securityBanner}>
          <Feather
            name="lock"
            size={16}
            color={COLORS.textSecondary}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.securityText}>
            Horario de atencion: Lun a Dom 24/7 - Al Toque Seguridad
          </Text>
        </View>

        <View style={styles.footerLogoContainer}>
          <Image
            source={require("../../mockups/logo-AT-sinfondo.png")}
            style={styles.footerWalletLogo}
            resizeMode="contain"
          />
          <Image
            source={require("../../mockups/AT-SF.png")}
            style={styles.footerTextLogo}
            resizeMode="contain"
          />
        </View>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentScreen(user ? "HOME" : "LOGIN")}
        activeOpacity={0.7}
      >
        <Image
          source={require("../../mockups/atras.png")}
          style={[styles.backIconImg, { tintColor: COLORS.textPrimary }]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <FlatList
        data={filteredFaqs}
        keyExtractor={keyExtractor}
        renderItem={renderFaq}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backIconImg: {
    width: 24,
    height: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primaryLight,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  contactCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 28,
  },
  contactCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  contactIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  contactIconImg: {
    width: 26,
    height: 26,
  },
  contactCardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  contactCardSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  securityBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F6F6",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 24,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  footerLogoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  footerWalletLogo: {
    width: 46,
    height: 46,
    marginBottom: 2,
  },
  footerTextLogo: {
    width: 100,
    height: 30,
  },
});
