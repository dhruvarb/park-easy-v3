import { Image, StyleSheet, FlatList, TouchableOpacity, View, Text, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { userApi } from '@/src/services/api';
import { useAuth } from '@/src/context/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Stack, useRouter } from 'expo-router';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadLots();
  }, []);

  const loadLots = async () => {
    try {
      const data = await userApi.getLots();
      // data should be { slots: [...] }
      const lotsData = data.slots || (Array.isArray(data) ? data : []);
      setLots(lotsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => {
      // Navigate to details if needed
      // router.push(`/details/${item.id}`);
    }}>
      <Image
        source={{ uri: (item.images && item.images.length > 0 && typeof item.images[0] === 'string') ? item.images[0] : 'https://placehold.co/600x400/png?text=Parking' }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <ThemedText type="subtitle" style={styles.lotName}>{item.name}</ThemedText>
          <View style={[styles.badge, item.hasEv ? styles.badgeEv : styles.badgeNormal]}>
            <Text style={styles.badgeText}>{item.hasEv ? 'EV' : 'Parking'}</Text>
          </View>
        </View>
        <Text style={styles.address}>{item.address}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.price}>₹{item.pricing?.hourly || '--'}/hr</Text>
          {parseInt(item.availableSlots) > 0 ?
            <Text style={styles.available}>{item.availableSlots} spots left</Text>
            : <Text style={styles.full}>Full</Text>
          }
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <View>
          <ThemedText type="title">Welcome!</ThemedText>
          <ThemedText style={styles.userName}>{user?.full_name}</ThemedText>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={lots}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<ThemedText style={{ textAlign: 'center', marginTop: 20 }}>No parking lots found near you.</ThemedText>}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  userName: {
    fontSize: 16,
    opacity: 0.8,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lotName: {
    flex: 1,
    marginRight: 8,
  },
  address: {
    color: '#94a3b8',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 16,
  },
  available: {
    color: '#22c55e',
    fontWeight: '600',
  },
  full: {
    color: '#ef4444',
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeEv: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  badgeNormal: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
