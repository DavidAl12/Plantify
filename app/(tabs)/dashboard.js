import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { collection, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppHeader from "../../components/ui/AppHeader";
import { auth, db } from "../../src/config/firebase";
import { generateFullSchedule } from "../../src/utils/calendarUtils";
import { getAppNow, getAppTodayString, parseLocalDate } from "../../src/utils/dateUtils";
import { getPlantStatus as getSharedPlantStatus } from "../../src/utils/plantStatusUtils";

const { width } = Dimensions.get("window");
const DONUT_SEGMENTS = 60;
const DONUT_COLORS = {
  healthy: "#a7c957",
  stable: "#ffb703",
  risk: "#f44336",
  empty: "#edf1e7",
};

const getPercentage = (value, total) => {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
};

const buildDonutSegments = (numHealthy, numStable, numAtRisk, totalPlants) => {
  if (totalPlants <= 0) {
    return Array.from({ length: DONUT_SEGMENTS }, () => DONUT_COLORS.empty);
  }

  const statuses = [
    { color: DONUT_COLORS.healthy, count: numHealthy },
    { color: DONUT_COLORS.stable, count: numStable },
    { color: DONUT_COLORS.risk, count: numAtRisk },
  ].map((item) => ({
    ...item,
    exact: (item.count / totalPlants) * DONUT_SEGMENTS,
  }));

  let used = 0;
  const roundedStatuses = statuses.map((item) => {
    const segments = item.count > 0 ? Math.max(1, Math.round(item.exact)) : 0;
    used += segments;
    return { ...item, segments };
  });

  while (used !== DONUT_SEGMENTS) {
    const direction = used > DONUT_SEGMENTS ? -1 : 1;
    const candidate = roundedStatuses
      .filter((item) => item.count > 0 && (direction > 0 || item.segments > 1))
      .sort((a, b) => {
        const aDiff = Math.abs((a.segments + direction) - a.exact);
        const bDiff = Math.abs((b.segments + direction) - b.exact);
        return aDiff - bDiff;
      })[0];

    if (!candidate) break;
    candidate.segments += direction;
    used += direction;
  }

  return roundedStatuses.flatMap((item) =>
    Array.from({ length: item.segments }, () => item.color),
  );
};

function SegmentedDonut({ numHealthy, numStable, numAtRisk, totalPlants }) {
  const size = 116;
  const tickWidth = 5;
  const tickHeight = 14;
  const radius = 47;
  const segmentColors = buildDonutSegments(numHealthy, numStable, numAtRisk, totalPlants);

  return (
    <View style={[styles.segmentedDonut, { width: size, height: size }]}>
      {segmentColors.map((color, index) => {
        const angle = (360 / DONUT_SEGMENTS) * index;
        return (
          <View
            key={`${color}-${index}`}
            style={[
              styles.donutSegment,
              {
                backgroundColor: color,
                width: tickWidth,
                height: tickHeight,
                left: size / 2 - tickWidth / 2,
                top: size / 2 - tickHeight / 2,
                transform: [{ rotate: `${angle}deg` }, { translateY: -radius }],
              },
            ]}
          />
        );
      })}
      <View style={styles.pieInnerCircle}>
        <Text style={styles.donutNumberText}>{totalPlants}</Text>
        <Text style={styles.donutLabelText}>TOTAL</Text>
      </View>
    </View>
  );
}

// Helpers for plant status calculations (single source of truth)
const getLatestActivityDate = (plantId, type, completedTasks, plantCreatedAt) => {
  const plantTasks = completedTasks.filter(
    (t) => t.plantId === plantId && t.type === type && t.completed
  );
  if (plantTasks.length === 0) {
    return plantCreatedAt;
  }
  plantTasks.sort((a, b) => {
    if (a.date === b.date) {
      const timeA = a.completedAt?.toDate ? a.completedAt.toDate().getTime() : (a.completedAt ? new Date(a.completedAt).getTime() : 0);
      const timeB = b.completedAt?.toDate ? b.completedAt.toDate().getTime() : (b.completedAt ? new Date(b.completedAt).getTime() : 0);
      return timeB - timeA;
    }
    return b.date.localeCompare(a.date);
  });
  return plantTasks[0].date;
};

const diasDesdeStr = (dateVal) => {
  if (!dateVal) return null;
  let dateObj;
  if (typeof dateVal === "string") {
    dateObj = parseLocalDate(dateVal);
  } else {
    dateObj = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
  }
  const today = getAppNow();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffTime / 86400000);
  return diffDays >= 0 ? diffDays : 0;
};

const getActivityStatus = (lastDate, frequency) => {
  if (!lastDate || !frequency) return "gray";
  const days = diasDesdeStr(lastDate);
  const warningThreshold = Math.floor(frequency * 0.75);
  const overdueThreshold = frequency;

  if (days <= warningThreshold) return "#a7c957"; // Lighter Green (Verde Principal)
  if (days < overdueThreshold) return "#FFC107"; // Yellow
  return "#F44336"; // Red
};

const getPlantStatus = (item, completedTasks) => {
  if (item) return getSharedPlantStatus(item, completedTasks);

  const latestWateredDate = getLatestActivityDate(item.id, "watering", completedTasks, item.lastWatered || item.createdAt);
  const wateringStatus = getActivityStatus(latestWateredDate, item.wateringFrequencyDays);

  const latestFertDate = getLatestActivityDate(item.id, "fertilizing", completedTasks, item.carePlan?.fertilizing?.lastDate || item.createdAt);
  const fertStatus = getActivityStatus(latestFertDate, item.carePlan?.fertilizing?.frequencyDays);

  const latestPruningDate = getLatestActivityDate(item.id, "pruning", completedTasks, item.carePlan?.pruning?.lastDate || item.createdAt);
  const pruningStatus = getActivityStatus(latestPruningDate, item.carePlan?.pruning?.frequencyDays);

  const latestPestDate = getLatestActivityDate(item.id, "pest_control", completedTasks, item.carePlan?.pest_control?.lastDate || item.createdAt);
  const pestStatus = getActivityStatus(latestPestDate, item.carePlan?.pest_control?.frequencyDays);

  const statuses = [wateringStatus, fertStatus, pruningStatus, pestStatus].filter(s => s !== "gray");

  if (statuses.includes("#F44336")) return { status: "Descuidada", color: "#ffebee", textColor: "#c62828" };
  if (statuses.includes("#FFC107")) return { status: "Atención", color: "#fff3e0", textColor: "#f57c00" };
  return { status: "Sana", color: "#e8f5e9", textColor: "#2e7d32" };
};

export default function Dashboard() {
  const scrollRef = useRef(null);
  const [plants, setPlants] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const todayStr = useMemo(() => getAppTodayString(), []);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Real-time listener for plants
    const plantsRef = collection(db, "users", user.uid, "plants");
    const unsubPlants = onSnapshot(plantsRef, (snapshot) => {
      setPlants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Real-time listener for tasks history
    const tasksRef = collection(db, "users", user.uid, "tasks");
    const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
      setCompletedTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubPlants();
      unsubTasks();
    };
  }, []);

  // Generate full calendar schedule dynamically
  const schedule = useMemo(() => {
    return generateFullSchedule(plants, completedTasks);
  }, [plants, completedTasks]);

  // Compute stats
  const stats = useMemo(() => {
    const totalPlants = plants.length;

    let numHealthy = 0;
    let numStable = 0;
    let numAtRisk = 0;

    plants.forEach((p) => {
      const statusObj = getPlantStatus(p, completedTasks);
      if (statusObj.status === "Sana") numHealthy++;
      else if (statusObj.status === "Atención") numStable++;
      else if (statusObj.status === "Descuidada") numAtRisk++;
    });

    const healthPercentage = totalPlants > 0
      ? Math.round(((numHealthy * 1.0 + numStable * 0.5) / totalPlants) * 100)
      : 100;

    // Constancia & Riego
    let totalCompleted = 0;
    let totalProgrammed = 0;
    let totalWateringExpected = 0;
    let totalWateringCompleted = 0;

    let activitiesRealizadas = 0;
    let activitiesPendientes = 0;
    let activitiesOlvidadas = 0;

    Object.keys(schedule).forEach((date) => {
      const dayTasks = schedule[date];
      dayTasks.forEach((t) => {
        if (date <= todayStr) {
          totalProgrammed++;
          if (t.completed) {
            totalCompleted++;
            activitiesRealizadas++;
          } else {
            if (date < todayStr) {
              activitiesOlvidadas++;
            } else {
              activitiesPendientes++;
            }
          }

          if (t.type === "watering") {
            totalWateringExpected++;
            if (t.completed) {
              totalWateringCompleted++;
            }
          }
        }
      });
    });

    const constancia = totalProgrammed > 0 ? Math.round((totalCompleted / totalProgrammed) * 100) : 100;
    const riegoIdeal = totalWateringExpected > 0 ? Math.round((totalWateringCompleted / totalWateringExpected) * 100) : 100;

    // Planta más consentida (most completed in current month)
    const statusByPlantId = {};
    plants.forEach((p) => {
      statusByPlantId[p.id] = getPlantStatus(p, completedTasks).status;
    });

    const consentidaCounts = {};
    completedTasks.forEach(t => {
      if (statusByPlantId[t.plantId] !== "Sana") return;
      consentidaCounts[t.plantId] = (consentidaCounts[t.plantId] || 0) + 1;
    });

    let consentidaId = null;
    let maxConsentida = 0;
    Object.keys(consentidaCounts).forEach(id => {
      if (consentidaCounts[id] > maxConsentida) {
        maxConsentida = consentidaCounts[id];
        consentidaId = id;
      }
    });
    const consentidaPlant = plants.find(p => p.id === consentidaId);

    // Planta en más riesgo (most overdue tasks)
    const pendingCounts = {};
    let pendingTasksUntilToday = 0;
    Object.keys(schedule).forEach((date) => {
      if (date <= todayStr) {
        const dayTasks = schedule[date];
        dayTasks.forEach((t) => {
          if (!t.completed) {
            pendingTasksUntilToday++;
            if (statusByPlantId[t.plantId] === "Descuidada") {
              pendingCounts[t.plantId] = (pendingCounts[t.plantId] || 0) + 1;
            }
          }
        });
      }
    });

    let enRiesgoId = null;
    let maxPendingRisk = 0;
    Object.keys(pendingCounts).forEach(id => {
      if (pendingCounts[id] > maxPendingRisk) {
        maxPendingRisk = pendingCounts[id];
        enRiesgoId = id;
      }
    });
    const enRiesgoPlant = plants.find(p => p.id === enRiesgoId);

    const todayCompletedTasks = completedTasks.filter(t => t.date === todayStr && t.completed);
    const streakActive = pendingTasksUntilToday === 0 && todayCompletedTasks.length > 0;

    // Racha actual (Streak)
    let streak = 0;
    if (streakActive) {
      for (let k = 0; k < 365; k++) {
        const checkDate = getAppNow();
        checkDate.setDate(checkDate.getDate() - k);
        const y = checkDate.getFullYear();
        const m = String(checkDate.getMonth() + 1).padStart(2, "0");
        const d = String(checkDate.getDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${d}`;

        const dayTasks = schedule[dateStr] || [];
        if (dayTasks.length === 0) continue;

        const allDone = dayTasks.every(t => t.completed);
        if (allDone) {
          streak++;
        } else {
          break;
        }
      }
    }

    return {
      totalPlants,
      numHealthy,
      numStable,
      numAtRisk,
      healthPercentage,
      constancia,
      riegoIdeal,
      streak,
      streakActive,
      consentidaPlant,
      consentidaCount: maxConsentida,
      enRiesgoPlant,
      overdueCount: maxPendingRisk,
      activitiesRealizadas,
      activitiesPendientes,
      activitiesOlvidadas,
      totalProgrammed,
    };
  }, [plants, completedTasks, schedule, todayStr]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1a3c2a" />
      </View>
    );
  }

  const {
    totalPlants,
    numHealthy,
    numStable,
    numAtRisk,
    healthPercentage,
    constancia,
    riegoIdeal,
    streak,
    streakActive,
    consentidaPlant,
    consentidaCount,
    enRiesgoPlant,
    overdueCount,
    activitiesRealizadas,
    activitiesPendientes,
    activitiesOlvidadas,
  } = stats;

  const totalActivities = activitiesRealizadas + activitiesPendientes + activitiesOlvidadas;
  const completedPercentage = getPercentage(activitiesRealizadas, totalActivities);
  const pendingPercentage = getPercentage(activitiesPendientes, totalActivities);
  const missedPercentage = getPercentage(activitiesOlvidadas, totalActivities);
  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* BEGIN: MainHeader (Salud del Jardín) */}
        <View style={styles.headerWrapper}>
          <View style={styles.mainHeaderCard}>
            <View style={styles.headerLeft}>
              <View style={styles.headerLabelContainer}>
                <Text style={styles.headerLabelText}>Salud del Jardín</Text>
                <Ionicons name="leaf-outline" size={14} color="rgba(255,255,255,0.9)" />
              </View>
              <View style={styles.headerScoreRow}>
                <Text style={styles.headerScoreText}>{healthPercentage}%</Text>
                <Text style={styles.headerStatusText}>
                  {healthPercentage >= 90 ? "¡Excelente!" : healthPercentage >= 60 ? "¡Estable!" : "¡En Riesgo!"}
                </Text>
              </View>
              <Text style={styles.headerDesc}>
                {healthPercentage >= 90
                  ? "Tu jardín está prosperando excepcionalmente."
                  : healthPercentage >= 60
                  ? "Tu jardín se mantiene en buen estado."
                  : "¡Atención! Algunas plantas necesitan cuidado inmediato."}
              </Text>
            </View>

            {/* Circular Graphic with double green ring */}
            <View style={styles.headerRight}>
              <View style={styles.progressRingOuter}>
                <View style={styles.progressRingInner}>
                  <Ionicons name="rose" size={40} color="#a7c957" />
                </View>
              </View>
            </View>
          </View>

          {/* Health Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.headerProgressBarBg}>
              <View style={[styles.headerProgressBarFill, { width: `${healthPercentage}%` }]} />
            </View>
            <View style={styles.progressBarMarks}>
              <Text style={styles.progressMarkText}>0%</Text>
              <Text style={styles.progressMarkText}>50%</Text>
              <Text style={styles.progressMarkText}>100%</Text>
            </View>
          </View>
        </View>
        {/* END: MainHeader */}

        {/* BEGIN: StatsHeader (Active Plants & Care Consistency side-by-side in large clean cards) */}
        <View style={styles.statsGrid}>
          {/* Stat: Active Plants */}
          <View style={styles.statCard}>
            <View style={styles.statMetricRow}>
              <View style={[styles.statIconWrapper, { backgroundColor: "#f1f5eb" }]}>
                <Ionicons name="book-outline" size={22} color="#1a3c2a" />
              </View>
              <Text style={styles.statValue}>{totalPlants}</Text>
            </View>
            <Text style={styles.statLabel}>Plantas activas</Text>
          </View>

          {/* Stat: Care Consistency */}
          <View style={styles.statCard}>
            <View style={styles.statMetricRow}>
              <View style={[styles.statIconWrapper, { backgroundColor: "#fff5e6" }]}>
                <Ionicons name="calendar-outline" size={22} color="#fb8500" />
              </View>
              <Text style={styles.statValue}>{constancia}%</Text>
            </View>
            <Text style={styles.statLabel}>Constancia de cuidado</Text>
          </View>
        </View>

        {/* BEGIN: 2x2 Square Grid Matrix (Riego Ideal, Consentida, Riesgo, Racha) */}
        <View style={styles.matrix2x2Grid}>
          
          {/* Card 1: Frecuencia de Riego Ideal */}
          <View style={[styles.matrixSquareCard, { backgroundColor: "#eef7ff" }]}>
            <View style={styles.matrixInfoRow}>
              <View style={styles.matrixTextSide}>
                <Text style={[styles.matrixCardKicker, { color: "#1d4ed8" }]}>Frecuencia de riego ideal</Text>
                <Text style={styles.matrixCardValue}>{riegoIdeal}%</Text>
                <Text style={styles.matrixCardLabel}>Riego Ideal</Text>
              </View>
              <View style={styles.statIconWrapperSquare}>
                <Ionicons name="flask-outline" size={24} color="#3b82f6" />
              </View>
            </View>
          </View>

          {/* Card 2: Planta más Consentida */}
          <View style={[styles.matrixSquareCard, { backgroundColor: "#f0f9f1" }]}>
            <View style={styles.matrixInfoRow}>
              <View style={styles.matrixTextSide}>
                <Text style={[styles.matrixCardKicker, { color: "#14532d" }]}>Planta más consentida</Text>
                <Text style={styles.matrixCardName} numberOfLines={2}>
                  {consentidaPlant ? (consentidaPlant.commonNames?.[0] || consentidaPlant.name) : "Sin datos"}
                </Text>
                <Text style={[styles.matrixCardLabel, { color: "#16a34a" }]}>{consentidaCount} tareas realizadas</Text>
              </View>
              <View style={[styles.avatarDashedBorderSquare, styles.matrixSideVisual]}>
                {consentidaPlant?.imageUrl ? (
                  <Image source={{ uri: consentidaPlant.imageUrl }} style={styles.avatarImageSquare} />
                ) : (
                  <Ionicons name="flower-outline" size={20} color="#a7c957" />
                )}
              </View>
            </View>
          </View>

          {/* Card 3: Planta con más Riesgo */}
          <View style={[styles.matrixSquareCard, { backgroundColor: numAtRisk > 0 ? "#fff1f1" : "#f1fdf3" }]}>
            <View style={styles.matrixInfoRow}>
              <View style={styles.matrixTextSide}>
                <Text style={[styles.matrixCardKicker, { color: numAtRisk > 0 ? "#dc2626" : "#14532d" }]}>En más riesgo</Text>
                {numAtRisk > 0 && enRiesgoPlant ? (
                  <>
                    <Text style={[styles.matrixCardName, { color: "#c62828" }]} numberOfLines={2}>
                      {enRiesgoPlant.commonNames?.[0] || enRiesgoPlant.name}
                    </Text>
                    <Text style={[styles.matrixCardLabel, { color: "#dc2626" }]}>{overdueCount} tareas pendientes</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.matrixCardName, { color: "#2e7d32" }]} numberOfLines={2}>¡Fiu! Todo Sano</Text>
                    <Text style={[styles.matrixCardLabel, { color: "#16a34a" }]}>Más Riesgo (0)</Text>
                  </>
                )}
              </View>
              <View style={[styles.avatarDashedBorderSquare, styles.matrixSideVisual, { borderColor: numAtRisk > 0 ? "#f44336" : "#2e7d32" }]}>
                {numAtRisk > 0 && enRiesgoPlant ? (
                  <>
                  {enRiesgoPlant.imageUrl ? (
                    <Image source={{ uri: enRiesgoPlant.imageUrl }} style={styles.avatarImageSquare} />
                  ) : (
                    <Ionicons name="alert-outline" size={20} color="#f44336" />
                  )}
                  </>
                ) : (
                  <Ionicons name="happy-outline" size={22} color="#2e7d32" />
                )}
              </View>
            </View>
          </View>

          {/* Card 4: Racha de cumplimiento */}
          <View style={[styles.matrixSquareCard, { backgroundColor: streakActive ? "#fff8f0" : "#f3f4f4" }]}>
            <View style={styles.matrixInfoRow}>
              <View style={styles.matrixTextSide}>
                <Text style={[styles.matrixCardKicker, { color: streakActive ? "#9a3412" : "#6b7280" }]}>Racha de cumplimiento</Text>
                <Text style={[styles.matrixCardValue, !streakActive && styles.streakInactiveText]}>{streak}</Text>
                <Text style={[styles.matrixCardLabel, !streakActive && styles.streakInactiveText]}>días de racha</Text>
              </View>
              <View style={[styles.streakCircleContainerSquare, styles.matrixSideVisual, !streakActive && styles.streakInactiveCircle]}>
                <Ionicons name="flame" size={22} color={streakActive ? "#fb8500" : "#9aa0a6"} />
              </View>
            </View>
          </View>

        </View>
        {/* END: 2x2 Square Grid Matrix */}

        {/* BEGIN: Distribution Card (Pie Chart - segmented borders with #a7c957 (lighter green) for healthy) */}
        <View style={styles.fullWidthCard}>
          <View style={styles.cardHeaderGroup}>
            <View style={styles.pillIndicator} />
            <Text style={styles.cardTitleText}>DISTRIBUCIÓN DE SALUD</Text>
          </View>
          
          <View style={styles.distributionContainer}>
            <View style={styles.donutGraphicBox}>
              <SegmentedDonut
                numHealthy={numHealthy}
                numStable={numStable}
                numAtRisk={numAtRisk}
                totalPlants={totalPlants}
              />
            </View>

            {/* Right side: Legend displaying only EXACT counts (no percentages) */}
            <View style={styles.distributionLegendGroup}>
              <View style={styles.legendRowItem}>
                <View style={styles.legendLabelGroup}>
                  <View style={[styles.legendIndicatorDot, { backgroundColor: "#a7c957" }]} />
                  <Text style={styles.legendLabelTextLarge}>Saludables</Text>
                </View>
                <Text style={styles.legendValueTextLarge}>{numHealthy}</Text>
              </View>

              <View style={styles.legendRowItem}>
                <View style={styles.legendLabelGroup}>
                  <View style={[styles.legendIndicatorDot, { backgroundColor: "#ffb703" }]} />
                  <Text style={styles.legendLabelTextLarge}>Atención</Text>
                </View>
                <Text style={styles.legendValueTextLarge}>{numStable}</Text>
              </View>

              <View style={styles.legendRowItem}>
                <View style={styles.legendLabelGroup}>
                  <View style={[styles.legendIndicatorDot, { backgroundColor: "#f44336" }]} />
                  <Text style={styles.legendLabelTextLarge}>Riesgo</Text>
                </View>
                <Text style={styles.legendValueTextLarge}>{numAtRisk}</Text>
              </View>
            </View>
          </View>
        </View>
        {/* END: Distribution Card */}

        {/* BEGIN: Activities Card */}
        <View style={styles.activitySummaryCard}>
          <View style={styles.cardHeaderGroup}>
            <View style={styles.pillIndicator} />
            <Text style={styles.cardTitleText}>ACTIVIDADES</Text>
          </View>

          <View style={styles.activitiesList}>
            <View>
              <View style={styles.activityRowHeader}>
                <View style={styles.activityLabelGroup}>
                  <View style={[styles.activityTinyIcon, { backgroundColor: "#dcfce7" }]}>
                    <Ionicons name="checkmark" size={12} color="#15803d" />
                  </View>
                  <Text style={styles.activityLabel}>Realizadas</Text>
                </View>
                <Text style={styles.activityValue}>{activitiesRealizadas}</Text>
              </View>
              <View style={styles.activityProgressRow}>
                <View style={styles.activityProgressTrack}>
                  <View style={[styles.activityProgressFill, { width: `${completedPercentage}%`, backgroundColor: "#16a34a" }]} />
                </View>
                <Text style={[styles.activityPercent, { color: "#16a34a" }]}>{completedPercentage}%</Text>
              </View>
            </View>

            <View>
              <View style={styles.activityRowHeader}>
                <View style={styles.activityLabelGroup}>
                  <View style={[styles.activityTinyIcon, { backgroundColor: "#fef3c7" }]}>
                    <Ionicons name="time-outline" size={12} color="#ca8a04" />
                  </View>
                  <Text style={styles.activityLabel}>Pendientes</Text>
                </View>
                <Text style={styles.activityValue}>{activitiesPendientes}</Text>
              </View>
              <View style={styles.activityProgressRow}>
                <View style={styles.activityProgressTrack}>
                  <View style={[styles.activityProgressFill, { width: `${pendingPercentage}%`, backgroundColor: "#facc15" }]} />
                </View>
                <Text style={[styles.activityPercent, { color: "#eab308" }]}>{pendingPercentage}%</Text>
              </View>
            </View>

            <View>
              <View style={styles.activityRowHeader}>
                <View style={styles.activityLabelGroup}>
                  <View style={[styles.activityTinyIcon, { backgroundColor: "#fee2e2" }]}>
                    <Ionicons name="close" size={12} color="#ef4444" />
                  </View>
                  <Text style={styles.activityLabel}>Olvidadas</Text>
                </View>
                <Text style={styles.activityValue}>{activitiesOlvidadas}</Text>
              </View>
              <View style={styles.activityProgressRow}>
                <View style={styles.activityProgressTrack}>
                  <View style={[styles.activityProgressFill, { width: `${missedPercentage}%`, backgroundColor: "#f87171" }]} />
                </View>
                <Text style={[styles.activityPercent, { color: "#f87171" }]}>{missedPercentage}%</Text>
              </View>
            </View>
          </View>
        </View>
        {/* END: Activities Card */}

        {/* BEGIN: EncouragementBanner */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerContentRow}>
            <View style={styles.bannerIconBox}>
              <Ionicons name="book" size={28} color="#1a3c2a" />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitleText}>¡Sigue así!</Text>
              <Text style={styles.bannerDescText}>Tu constancia está haciendo que tus plantas estén más felices que nunca.</Text>
            </View>
          </View>

          {/* Symmetrical botanical bonsai tree illustration */}
          <View style={styles.bannerIllustration}>
            {/* Symmetrical Pine/Bonsai Leaf Circles */}
            <View style={[styles.leafCircle, { backgroundColor: "#1a3c2a", width: 28, height: 28, borderRadius: 14, top: 4, left: 16 }]} />
            <View style={[styles.leafCircle, { backgroundColor: "#2e7d32", width: 22, height: 22, borderRadius: 11, top: 12, left: 6 }]} />
            <View style={[styles.leafCircle, { backgroundColor: "#a7c957", width: 22, height: 22, borderRadius: 11, top: 12, left: 28 }]} />
            
            {/* Trunk */}
            <View style={styles.treeTrunk} />

            {/* Orange Terracota Pot */}
            <View style={styles.terracottaPot} />

            {/* Heart */}
            <View style={styles.illustrationHeart}>
              <Ionicons name="heart" size={14} color="#f44336" />
            </View>
          </View>
        </View>
        {/* END: EncouragementBanner */}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9f4", // Light botanical beige
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
  },
  headerWrapper: {
    backgroundColor: "#1a3c2a", // Deep botanical green
    borderRadius: 36,
    padding: 24,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  mainHeaderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  headerLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    opacity: 0.9,
    marginBottom: 6,
  },
  headerLabelText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  headerScoreRow: {
    alignItems: "flex-start",
  },
  headerScoreText: {
    color: "white",
    fontSize: 58,
    fontWeight: "bold",
  },
  headerStatusText: {
    color: "#a7c957", // Light accent green
    fontSize: 20,
    fontWeight: "bold",
    marginTop: -4,
  },
  headerDesc: {
    color: "white",
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 18,
    marginTop: 6,
  },
  headerRight: {
    justifyContent: "center",
    alignItems: "center",
  },
  progressRingOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressRingInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressSection: {
    marginTop: 24,
  },
  headerProgressBarBg: {
    height: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 5,
    overflow: "hidden",
  },
  headerProgressBarFill: {
    height: "100%",
    backgroundColor: "#a7c957",
    borderRadius: 5,
  },
  progressBarMarks: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    opacity: 0.7,
  },
  progressMarkText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#f0f2eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  statTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  statMetricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  statIconWrapper: {
    padding: 8,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statBadgeGreen: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statBadgeGreenText: {
    color: "#2e7d32",
    fontSize: 10,
    fontWeight: "bold",
  },
  statBadgeOrange: {
    backgroundColor: "#fff3e0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statBadgeOrangeText: {
    color: "#e65100",
    fontSize: 10,
    fontWeight: "bold",
  },
  statBadgeBlue: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statBadgeBlueText: {
    color: "#1565c0",
    fontSize: 10,
    fontWeight: "bold",
  },
  statValue: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1a3c2a",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: 4,
  },
  
  // 2x2 Matrix grid styles
  matrix2x2Grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  matrixSquareCard: {
    width: (width - 44) / 2, // 2 equal columns
    height: 146,
    borderRadius: 28,
    padding: 14,
    alignItems: "stretch",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: "#f0f2eb",
  },
  statIconWrapperSquare: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
    elevation: 1,
  },
  avatarDashedBorderSquare: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#a7c957",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: "white",
  },
  avatarImageSquare: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  streakCircleContainerSquare: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
    elevation: 1,
  },
  streakInactiveCircle: {
    backgroundColor: "#e5e7eb",
  },
  streakInactiveText: {
    color: "#9aa0a6",
  },
  matrixCardValue: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1a3c2a",
    marginBottom: 2,
  },
  matrixCardKicker: {
    width: "100%",
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "900",
    textAlign: "left",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  matrixCardName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1a3c2a",
    marginBottom: 2,
    textAlign: "left",
    width: "100%",
  },
  matrixCardLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
    textAlign: "left",
  },
  matrixInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  matrixTextSide: {
    flex: 1,
    minWidth: 0,
  },
  matrixSideVisual: {
    marginBottom: 0,
  },

  fullWidthCard: {
    backgroundColor: "white",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardHeaderGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  pillIndicator: {
    width: 4,
    height: 16,
    backgroundColor: "#1a3c2a",
    borderRadius: 2,
  },
  cardTitleText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#1a3c2a",
    letterSpacing: 1.5,
  },
  distributionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  donutGraphicBox: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentedDonut: {
    alignItems: "center",
    justifyContent: "center",
  },
  donutSegment: {
    position: "absolute",
    borderRadius: 8,
  },
  pieInnerCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  donutNumberText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1a3c2a",
  },
  donutLabelText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#999",
  },
  distributionLegendGroup: {
    flex: 1,
    gap: 10,
  },
  legendLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  legendRowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  legendIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabelTextLarge: {
    fontSize: 13,
    color: "#444",
    fontWeight: "600",
  },
  legendValueTextLarge: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1a3c2a",
  },
  
  activitySummaryCard: {
    backgroundColor: "white",
    borderRadius: 32,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    marginBottom: 16,
  },
  activitiesList: {
    gap: 24,
  },
  activityRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  activityLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activityTinyIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  activityLabel: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "600",
  },
  activityValue: {
    fontSize: 10,
    color: "#111827",
    fontWeight: "900",
  },
  activityProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activityProgressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    overflow: "hidden",
  },
  activityProgressFill: {
    height: "100%",
    borderRadius: 999,
  },
  activityPercent: {
    width: 28,
    fontSize: 9,
    fontWeight: "900",
  },

  bannerContainer: {
    backgroundColor: "#f1f5eb",
    borderRadius: 28,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  bannerContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  bannerIconBox: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  bannerTitleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a3c2a",
  },
  bannerDescText: {
    fontSize: 12,
    color: "#556254",
    marginTop: 4,
    lineHeight: 16,
  },
  bannerIllustration: {
    position: "relative",
    width: 60,
    height: 60,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  terracottaPot: {
    width: 24,
    height: 14,
    backgroundColor: "#d35400", // Terracotta orange
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    zIndex: 2,
  },
  treeTrunk: {
    position: "absolute",
    bottom: 12,
    width: 4,
    height: 24,
    backgroundColor: "#5c3d2e", // Brown trunk
    borderRadius: 2,
    zIndex: 1,
  },
  leafCircle: {
    position: "absolute",
  },
  illustrationHeart: {
    position: "absolute",
    top: -6,
    right: 6,
    zIndex: 3,
  },
});
