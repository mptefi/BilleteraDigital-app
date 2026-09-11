import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView,
  Image,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

export default function SupportScreen() {
  const { setCurrentScreen } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqs = [
    {
      question: "¿Olvidé mi clave de acceso, cómo la recupero?",
      answer:
        "Para recuperar tu clave, en la pantalla de inicio de sesión selecciona '¿Olvidaste tu clave?', ingresa tu correo registrado y sigue el flujo para validar tu identidad.",
    },
    {
      question: "¿Qué hago si envié dinero al número equivocado?",
      answer:
        "Comunícate inmediatamente con nuestro centro de atención por WhatsApp o soporte para bloquear la transacción si aún no ha sido cobrada.",
    },
    {
      question: "¿Cuáles son los límites diarios de envío?",
      answer:
        "El límite estándar por operación es de S/ 500.00 y el acumulado diario máximo es de S/ 2,000.00 por seguridad.",
    },
    {
      question: "¿Cómo actualizar mis datos registrados?",
      answer:
        "Ingresa a la sección 'Más' o 'Perfil' dentro del menú principal para modificar tu teléfono, correo o dirección registrada.",
    },
  ];

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAccordion = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleWhatsApp = () => {
    Linking.openURL("https://wa.me/51999999999?text=Hola,%20necesito%20ayuda%20con%20Al%20Toque");
  };

  const handleReportEmail = () => {
    Linking.openURL("mailto:soporte@altoque.pe?subject=Reporte%20de%20Problema");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Botón Atrás */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentScreen("LOGIN")}
        activeOpacity={0.7}
      >
        <Image
          source={require("../../mockups/atras.png")}
          style={[styles.backIconImg, { tintColor: COLORS.textPrimary }]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Título */}
        <Text style={styles.title}>Centro de Ayuda</Text>

        {/* Barra de Búsqueda */}
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color={COLORS.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="¿En qué podemos ayudarte?"
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 2 Tarjetas de Contacto con Iconos Naranja Corporativo */}
        <View style={styles.contactCardsRow}>
          <TouchableOpacity style={styles.contactCard} onPress={handleWhatsApp} activeOpacity={0.7}>
            <View style={styles.contactIconBadge}>
              <Image
                source={require("../../mockups/auriculares.png")}
                style={[styles.contactIconImg, { tintColor: COLORS.primary }]}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.contactCardTitle}>Atención WhatsApp</Text>
            <Text style={styles.contactCardSub}>Respuesta inmediata</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleReportEmail} activeOpacity={0.7}>
            <View style={styles.contactIconBadge}>
              <Image
                source={require("../../mockups/correo-electronico.png")}
                style={[styles.contactIconImg, { tintColor: COLORS.primary }]}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.contactCardTitle}>Reportar problema</Text>
            <Text style={styles.contactCardSub}>Envíanos un correo</Text>
          </TouchableOpacity>
        </View>

        {/* Sección Preguntas Frecuentes */}
        <Text style={sectionStyles.sectionTitle}>Preguntas Frecuentes</Text>

        <View style={styles.faqList}>
          {filteredFaqs.map((faq, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <View key={index} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleAccordion(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Feather
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={22}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.faqBody}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Banner de Atención 24/7 */}
        <View style={styles.securityBanner}>
          <Feather name="lock" size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
          <Text style={styles.securityText}>
            Horario de atención: Lun a Dom 24/7 · Al Toque Seguridad
          </Text>
        </View>

        {/* Logo Footer */}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const sectionStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
});

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
  faqList: {
    gap: 12,
    marginBottom: 24,
  },
  faqCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECECEC",
    overflow: "hidden",
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
  securityBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F6F6",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  securityText: {
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
