import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import AppHeader from "../../components/ui/AppHeader";
import { auth, db } from "../../src/config/firebase";
import { ALL_TIPS } from "../../src/data/tipsData";
import { COLORS } from "../../styles/colors";

const { width } = Dimensions.get("window");

// ── Componente de tarjeta de tip animada ──
function TipCard({ tip, index }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 120,
      useNativeDriver: true,
    }).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.tipCard, { backgroundColor: tip.color + "12" }]}
      >
        <View style={[styles.tipIconContainer, { backgroundColor: tip.color + "18" }]}>
          <Ionicons name={tip.icon} size={22} color={tip.color} />
        </View>
        <View style={styles.tipTextContainer}>
          <Text style={styles.tipTitle}>{tip.title}</Text>
          <Text style={styles.tipDescription}>{tip.text}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Componente de tarjeta de sugerencia animada ──
function SuggestionCard({ item, index }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 150,
      useNativeDriver: true,
    }).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.suggestedCard}
      >
        <Image source={{ uri: item.image }} style={styles.suggestedImage} />
        <View style={styles.suggestedGradient}>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{item.difficulty}</Text>
          </View>
          <Text style={styles.suggestedName}>{item.name}</Text>
          <Text style={styles.suggestedScientific}>{item.scientific}</Text>
          <View style={styles.lightRow}>
            <Ionicons name="sunny-outline" size={11} color="rgba(255,255,255,0.85)" />
            <Text style={styles.lightText}>{item.light}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Home() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const [plants, setPlants] = useState([]);
  const [userName, setUserName] = useState("");
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const name = user.displayName || "Usuario";
    setUserName(name);

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "plants"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPlants(data);
      },
    );

    return unsubscribe;
  }, []);

  const dailyTips = useMemo(() => {
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);

    // Agrupar tips por categoría
    const groups = ALL_TIPS.reduce((acc, t) => {
      acc[t.category] = acc[t.category] || [];
      acc[t.category].push(t);
      return acc;
    }, {});

    const categories = Object.keys(groups);
    if (categories.length === 0) return [];

    // Elegir 4 categorías distintas rotando según el día
    const startCatIndex = dayOfYear % categories.length;
    const selected = [];
    for (let i = 0; i < 4; i++) {
      const cat = categories[(startCatIndex + i) % categories.length];
      const tipsForCat = groups[cat];
      const tipIndex = (dayOfYear + i) % tipsForCat.length;
      selected.push(tipsForCat[tipIndex]);
    }
    return selected;
  }, []);

  // Saludo dinámico según hora
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  // Calcular cuántas horas faltan para los nuevos tips diarios
  const hoursUntilNewTips = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const diffMs = tomorrow - now;
    const hours = Math.floor(diffMs / 3600000);
    if (hours < 1) return "menos de 1 hora";
    if (hours === 1) return "1 hora";
    return `${hours} horas`;
  }, []);

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Saludo */}
        <View style={styles.greeting}>
          <Text style={styles.welcome}>Bienvenido otra vez</Text>
          <Text style={styles.name}>{greetingText}, {userName} 👋</Text>
        </View>

        <View style={styles.introCard}>
          <Text style={styles.introTitle}>!Manos a la tierra!</Text>
          <Text style={styles.introText}>
            Gestiona el cuidado de tus plantas de forma simple. Identifícalas, organízalas en tu jardín y sigue su crecimiento con calendario, métricas y tips diseñados para ayudarte cada día.
          </Text>
        </View>

        {/* ACTIVIDADES DE CUIDADO */}
        <View style={[styles.section, { paddingRight: 20, marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Actividades de Cuidado</Text>
          <View style={styles.activitiesInfoCard}>
            <View style={styles.activitiesLeft}>
              <Text style={styles.activitiesCardTitle}>¿Cómo debo realizar correctamente las actividades del calendario?</Text>
              <Text style={styles.activitiesCardDesc}>Aprende técnicas específicas para riego, fertilización, poda y control de plagas. Cada acción cuenta para mantener tus plantas saludables y hermosas.</Text>
              <TouchableOpacity 
                style={styles.learnMoreBtn}
                onPress={() => setShowActivitiesModal(true)}
              >
                <Text style={styles.learnMoreBtnText}>Conocer más</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.activitiesIconsContainer}>
              <View style={styles.activitiesIconsGrid}>
                {[
                  { icon: 'water', color: '#4FC3F7' },
                  { icon: 'leaf', color: '#8BC34A' },
                  { icon: 'cut', color: '#81C784' },
                  { icon: 'bug', color: '#FF7043' },
                ].map((item, i) => (
                  <View key={i} style={[styles.activitiesIconBox, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon} size={22} color={item.color} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* MODAL DE ACTIVIDADES */}
        <Modal
          visible={showActivitiesModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowActivitiesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowActivitiesModal(false)}
              >
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Actividades de Cuidado</Text>
                {[
                  {
                    icon: 'water',
                    title: 'Riego profundo',
                    desc: 'Humedece el sustrato de forma uniforme hasta que el agua salga por los orificios de drenaje. Espera a que la capa superior se seque antes del siguiente riego para evitar pudrición radicular.',
                    color: '#4FC3F7',
                  },
                  {
                    icon: 'leaf',
                    title: 'Fertilización ligera',
                    desc: 'Aplica un fertilizante balanceado diluido según la etiqueta, evitando sobredosificar. Mejora la absorción con riego previo y no fertilices en etapas de reposo vegetativo.',
                    color: '#8BC34A',
                  },
                  {
                    icon: 'cut',
                    title: 'Poda selectiva',
                    desc: 'Retira hojas y brotes secos o dañados con herramientas limpias. Haz cortes limpios cerca del nodo y evita eliminar más del 25% de la masa foliar en una sola sesión.',
                    color: '#81C784',
                  },
                  {
                    icon: 'bug',
                    title: 'Control de plagas',
                    desc: 'Inspecciona hojas y tallos buscando signos de plagas. Usa métodos físicos primero (eliminación manual, jabón potásico) y aplica tratamientos dirigidos si la infestación lo requiere.',
                    color: '#FF7043',
                  },
                ].map((act, i) => (
                  <View key={i} style={styles.modalActivityCard}>
                    <View style={[styles.modalActivityIcon, { backgroundColor: act.color + '18' }]}>
                      <Ionicons name={act.icon} size={22} color={act.color} />
                    </View>
                    <View style={styles.modalActivityText}>
                      <Text style={styles.modalActivityTitle}>{act.title}</Text>
                      <Text style={styles.modalActivityDesc}>{act.desc}</Text>
                    </View>
                  </View>
                ))}
                <View style={{ height: 30 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* MI JARDÍN */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>MI JARDÍN</Text>
            <TouchableOpacity
              onPress={() => router.push("/plant/add")}
              style={styles.identifyBtn}
            >
              <Ionicons name="scan-outline" size={16} color="white" />
              <Text style={styles.identifyBtnText}>Identificar planta</Text>
            </TouchableOpacity>
          </View>

          {plants.length === 0 ? (
             <TouchableOpacity style={styles.emptyGarden} onPress={() => router.push("/plant/add")}>
                <Ionicons name="add-circle-outline" size={40} color="#ccc" />
                <Text style={styles.emptyText}>Agrega tu primera planta</Text>
             </TouchableOpacity>
          ) : (
            <FlatList
              data={plants}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.plantCard}
                  onPress={() => router.push(`/plant/${item.id}`)}
                >
                  <Image
                    source={{
                      uri: item.imageUrl || "https://via.placeholder.com/150",
                    }}
                    style={styles.plantImage}
                  />
                  <Text style={styles.plantName} numberOfLines={1}>
                    {item.commonNames?.[0] || item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* TIPS DEL DÍA */}
        <View style={[styles.section, { paddingRight: 20 }]}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.sectionTitle}>TIPS DEL DÍA</Text>
              <Text style={styles.tipsSubtitle}>
                Nuevos tips en {hoursUntilNewTips}
              </Text>
            </View>
            <View style={styles.tipsBadge}>
              <Ionicons name="bulb" size={14} color="#FF9800" />
              <Text style={styles.tipsBadgeText}>Diario</Text>
            </View>
          </View>
          {dailyTips.map((tip, index) => (
            <TipCard key={tip.id} tip={tip} index={index} />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7f2",
  },
  content: {
    paddingBottom: 20,
  },
  greeting: { padding: 20, paddingTop: 10 },
  welcome: { color: "#888", fontSize: 14 },
  name: { fontSize: 20, fontWeight: "800", color: "#1b1b1b" },
  introCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    borderRadius: 22,
    padding: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "white",
    marginBottom: 8,
  },
  introText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.95)",
    lineHeight: 20,
  },

  // Clima
  weatherCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 4,
  },
  weatherInfo: { flex: 1 },
  weatherLocation: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  weatherTemp: { color: "white", fontSize: 32, fontWeight: "bold" },
  weatherStatus: { color: "white", fontSize: 14, opacity: 0.9 },

  // Stats
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 18,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1b1b1b",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: "600",
    marginTop: 2,
  },

  // Secciones
  section: {
    paddingLeft: 20,
    marginTop: 28,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontWeight: "800",
    color: "#2e7d32",
    fontSize: 14,
    letterSpacing: 1,
  },

  // Botones
  addBtn: {
    backgroundColor: "#2e7d32",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  identifyBtn: {
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    elevation: 2,
  },
  identifyBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryLight + "60",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // Plantas del jardín
  plantCard: {
    marginRight: 15,
  },
  plantImage: {
    width: 140,
    height: 140,
    borderRadius: 20,
  },
  plantName: {
    marginTop: 8,
    fontWeight: "600",
    fontSize: 14,
    width: 140,
    color: "#333",
  },
  emptyGarden: {
    height: 140,
    width: width - 40,
    backgroundColor: "white",
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#aaa",
    marginTop: 8,
  },

  // Sugerencias
  suggestedCard: {
    marginRight: 15,
    borderRadius: 20,
    overflow: "hidden",
    width: 180,
    height: 220,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  suggestedImage: {
    width: "100%",
    height: "100%",
  },
  suggestedGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingTop: 30,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  suggestedName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  suggestedScientific: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontStyle: "italic",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
  },
  difficultyText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  lightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  lightText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "600",
  },

  // Tips
  tipsSubtitle: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  tipsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tipsBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E65100",
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: "white",
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    elevation: 0,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  tipIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#333",
  },
  tipDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 3,
    lineHeight: 18,
  },
  activitiesGrid: {
    marginTop: 8,
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 10,
  },
  activityIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16321a',
    marginBottom: 6,
  },
  activityDesc: {
    fontSize: 13,
    color: '#586358',
    lineHeight: 18,
  },
  // Nueva sección Actividades de Cuidado
  activitiesInfoCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 18,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    alignItems: 'center',
  },
  activitiesLeft: {
    flex: 1,
    marginRight: 16,
    alignItems: 'center',
  },
  activitiesCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16321a',
    marginBottom: 10,
    lineHeight: 22,
    textAlign: 'center',
  },
  activitiesCardDesc: {
    fontSize: 13,
    color: '#586358',
    lineHeight: 18,
    marginBottom: 14,
    textAlign: 'center',
  },
  learnMoreBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    gap: 6,
  },
  learnMoreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
  },
  activitiesIconsContainer: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activitiesIconsGrid: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  activitiesIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    maxHeight: '85%',
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  modalCloseBtn: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16321a',
    marginBottom: 16,
    marginTop: 4,
  },
  modalActivityCard: {
    flexDirection: 'row',
    backgroundColor: '#f9faf8',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  modalActivityIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalActivityText: {
    flex: 1,
  },
  modalActivityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16321a',
    marginBottom: 6,
  },
  modalActivityDesc: {
    fontSize: 13,
    color: '#586358',
    lineHeight: 18,
  },

});
