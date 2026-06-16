import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, Platform, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// Adjusted paths for (tabs) folder
const PLANTAE_LOGO = require('../../assets/images/plantae-logo.png');
const DEFAULT_PLANT_IMAGE = require('../../assets/images/default.jpg');

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.27:5000/api';
const API_URL = `${BASE_URL}/plants`;

export default function HomeScreen() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGridView, setIsGridView] = useState(false);
  const router = useRouter();

  const fetchPlants = async () => {
    try {
      const response = await axios.get(API_URL);
      setPlants(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch plants. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlants();
    }, [])
  );

  const toggleDead = async (plant: any) => {
    try {
      await axios.put(`${API_URL}/${plant._id}`, { ...plant, isDead: !plant.isDead });
      fetchPlants();
    } catch (error) {
      Alert.alert('Error', 'Failed to update plant status.');
    }
  };

  const waterPlant = async (plant: any) => {
    try {
      const newDate = new Date();
      await axios.put(`${API_URL}/${plant._id}`, { 
        ...plant, 
        lastWatered: newDate,
        wateredDates: [...(plant.wateredDates || []), newDate]
      });
      fetchPlants();
    } catch (error) {
      Alert.alert('Error', 'Failed to water plant.');
    }
  };

  const deletePlant = async (id: string) => {
    Alert.alert('Delete Plant', 'Are you sure you want to delete this plant?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await axios.delete(`${API_URL}/${id}`);
          fetchPlants();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete plant.');
        }
      }}
    ]);
  };

  const renderGridItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.gridCard}
      onPress={() => router.push(`/detail/${item._id}` as any)}
      activeOpacity={0.9}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.cardBgImage} />
      ) : (
        <Image source={DEFAULT_PLANT_IMAGE} style={styles.cardBgImage} />
      )}
      
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gridGradient}
      >
        <Text style={[styles.gridName, item.isDead && styles.deadText]} numberOfLines={1}>{item.name}</Text>
        
        <View style={styles.gridActions}>
          <TouchableOpacity style={styles.compactActionBtn} onPress={() => waterPlant(item)}>
            <Ionicons name="water" size={14} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.compactActionBtn} onPress={() => toggleDead(item)}>
            <Ionicons name="skull" size={14} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.compactActionBtn} onPress={() => router.push(`/edit/${item._id}` as any)}>
            <Ionicons name="pencil" size={14} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.compactActionBtn, {backgroundColor: 'rgba(231, 76, 60, 0.6)'}]} onPress={() => deletePlant(item._id)}>
            <Ionicons name="trash" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.plantCard}
      onPress={() => router.push(`/detail/${item._id}` as any)}
      activeOpacity={0.9}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.cardBgImage} />
      ) : (
        <Image source={DEFAULT_PLANT_IMAGE} style={styles.cardBgImage} />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.listGradient}
      >
        <View style={styles.listContent}>
          <View style={styles.mainInfo}>
            <Text style={[styles.listName, item.isDead && styles.deadText]}>{item.name}</Text>
            <Text style={styles.listSpecies}>{item.species || 'Unknown species'}</Text>
          </View>
          
          <View style={styles.listActions}>
            <TouchableOpacity style={styles.circleActionBtn} onPress={() => waterPlant(item)}>
              <Ionicons name="water" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleActionBtn} onPress={() => toggleDead(item)}>
              <Ionicons name="skull" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleActionBtn} onPress={() => router.push(`/edit/${item._id}` as any)}>
              <Ionicons name="pencil" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circleActionBtn, {backgroundColor: 'rgba(231, 76, 60, 0.6)'}]} onPress={() => deletePlant(item._id)}>
              <Ionicons name="trash" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Plants</Text>
        <TouchableOpacity style={styles.toggleButton} onPress={() => setIsGridView(!isGridView)}>
          <Ionicons name={isGridView ? "list" : "grid"} size={22} color="#2ecc71" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2ecc71" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          key={isGridView ? 'grid' : 'list'}
          data={plants}
          keyExtractor={(item) => item._id}
          renderItem={isGridView ? renderGridItem : renderItem}
          numColumns={isGridView ? 2 : 1}
          contentContainerStyle={styles.list}
          columnWrapperStyle={isGridView ? styles.gridRow : undefined}
          ListEmptyComponent={<Text style={styles.emptyText}>No plants in your collection. Add one!</Text>}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add')}>
        <Text style={styles.addButtonText}>+ Add Plant</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f9f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0ebd8',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e2f',
  },
  toggleButton: {
    padding: 10,
    backgroundColor: '#e8f7ec',
    borderRadius: 8,
  },
  logo: {
    width: 100,
    height: 100,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  plantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 20,
    height: 200,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  placeholderBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f0f4f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantImageFallback: {
    width: 80,
    height: 80,
    opacity: 0.3,
    resizeMode: 'contain',
  },
  listGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  listContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  mainInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  listSpecies: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  listActions: {
    flexDirection: 'row',
    gap: 8,
  },
  circleActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  deadText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9aa89b',
    marginTop: 40,
  },
  addButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#2ecc71',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    height: 180,
    marginBottom: 16,
    flex: 1,
    marginHorizontal: 8,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gridGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 12,
  },
  gridName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    width: '100%',
  },
  gridActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  compactActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
