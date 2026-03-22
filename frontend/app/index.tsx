import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import axios from 'axios';

// The logo from the previous app
const PLANTAE_LOGO = require('../assets/images/plantae-logo.png');

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.27:5000/api/plants';

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
      onPress={() => router.push(`/detail/${item._id}`)}
      activeOpacity={0.7}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.gridImage} />
      ) : (
        <Image source={PLANTAE_LOGO} style={[styles.gridImage, styles.plantImageFallback]} />
      )}
      <Text style={[styles.gridName, item.isDead && styles.deadText]} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.gridSpecies} numberOfLines={1}>{item.species || 'Unknown'}</Text>
      
      <View style={styles.gridActions}>
        <TouchableOpacity style={styles.gridActionBtn} onPress={() => waterPlant(item)}>
          <Ionicons name="water" size={16} color="#3498db" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridActionBtn} onPress={() => toggleDead(item)}>
          <Ionicons name="skull" size={16} color={item.isDead ? "#e74c3c" : "#9aa89b"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridActionBtn} onPress={() => router.push(`/edit/${item._id}` as any)}>
          <Ionicons name="pencil" size={16} color="#2ecc71" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.gridActionBtn, styles.deleteBtn]} onPress={() => deletePlant(item._id)}>
          <Ionicons name="trash" size={16} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.plantCard}
      onPress={() => router.push(`/detail/${item._id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.plantInfoContainer}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.plantImage} />
        ) : (
          <Image source={PLANTAE_LOGO} style={[styles.plantImage, styles.plantImageFallback]} />
        )}
        <View style={styles.plantInfo}>
          <Text style={[styles.plantName, item.isDead && styles.deadText]}>{item.name}</Text>
          <Text style={styles.plantSpecies}>{item.species || 'Unknown species'}</Text>
          <Text style={styles.plantDate}>Last watered: {new Date(item.lastWatered).toLocaleDateString()}</Text>
          {item.isDead && <Text style={styles.deadWarning}>💀 Dead</Text>}
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#ebf5fb'}]} onPress={() => waterPlant(item)}>
          <Text style={[styles.actionText, {color: '#3498db'}]}>Water</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleDead(item)}>
          <Text style={styles.actionText}>{item.isDead ? 'Revive' : 'Mark Dead'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/edit/${item._id}` as any)}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => deletePlant(item._id)}>
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0ebd8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  plantInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  plantImage: {
    width: 60,
    height: 60,
    borderRadius: 30, // Make it circular
    backgroundColor: '#f0f4f1',
  },
  plantImageFallback: {
    padding: 10,
    resizeMode: 'contain',
  },
  plantInfo: {
    flex: 1,
    marginBottom: 5,
  },
  plantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e2f',
  },
  plantSpecies: {
    fontSize: 14,
    color: '#6c8270',
    marginTop: 4,
  },
  plantDate: {
    fontSize: 12,
    color: '#9aa89b',
    marginTop: 4,
  },
  deadText: {
    textDecorationLine: 'line-through',
    color: '#9aa89b',
  },
  deadWarning: {
    color: '#e74c3c',
    marginTop: 4,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f4f1',
    paddingTop: 12,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e8f7ec',
    borderRadius: 8,
  },
  deleteBtn: {
    backgroundColor: '#ffe8e8',
  },
  actionText: {
    color: '#2ecc71',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9aa89b',
    marginTop: 40,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0ebd8',
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  gridImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f4f1',
    marginBottom: 12,
  },
  gridName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e2f',
    textAlign: 'center',
  },
  gridSpecies: {
    fontSize: 12,
    color: '#6c8270',
    marginTop: 4,
    textAlign: 'center',
  },
  gridActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  gridActionBtn: {
    padding: 10,
    backgroundColor: '#e8f7ec',
    borderRadius: 20,
  },
});
