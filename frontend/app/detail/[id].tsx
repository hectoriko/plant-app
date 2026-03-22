import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Image, ScrollView, Platform, Dimensions, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.27:5000/api/plants';
const PLANTAE_LOGO = require('../../assets/images/plantae-logo.png');

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [plant, setPlant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingPhoto, setAddingPhoto] = useState(false);

  const screenWidth = Dimensions.get('window').width;

  const addPhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAddingPhoto(true);
      const newPhotoUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      try {
        const updatedPhotos = [...(plant.photos || []), newPhotoUri];
        const updatedPlant = { ...plant, photos: updatedPhotos };
        await axios.put(`${API_URL}/${plant._id}`, updatedPlant);
        setPlant(updatedPlant);
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to save the photo');
      } finally {
        setAddingPhoto(false);
      }
    }
  };

  useEffect(() => {
    const fetchPlant = async () => {
      try {
        const response = await axios.get(`${API_URL}/${id}`);
        setPlant(response.data);
      } catch (error) {
        console.error(error);
        router.back();
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlant();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ title: 'Cargando...' }} />
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ title: 'No encontrada' }} />
        <Text style={styles.errorText}>Plant not found</Text>
      </View>
    );
  }

  const allPhotos = [];
  if (plant.imageUri) allPhotos.push(plant.imageUri);
  if (plant.photos && plant.photos.length > 0) {
    allPhotos.push(...plant.photos);
  }

  return (
    <>
      <Stack.Screen options={{ title: plant.name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.imageContainer}>
        {allPhotos.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {allPhotos.map((uri, index) => (
              <Image key={index} source={{ uri }} style={[styles.mainImage, { width: screenWidth }]} />
            ))}
          </ScrollView>
        ) : (
          <Image source={PLANTAE_LOGO} style={[styles.mainImage, styles.imageFallback, { width: screenWidth }]} />
        )}
      </View>

      {allPhotos.length > 1 && (
        <View style={styles.paginationDots}>
          {allPhotos.map((_, i) => (
            <View key={i} style={styles.dot} />
          ))}
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.name}>{plant.name}</Text>
        {plant.species ? <Text style={styles.species}>{plant.species}</Text> : null}
        {plant.isDead && <Text style={styles.deadWarning}>💀 Dead</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {plant.description || 'No description available for this plant.'}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>Photos</Text>
            <TouchableOpacity onPress={addPhoto} disabled={addingPhoto} style={styles.addPhotoBtn}>
              {addingPhoto ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addPhotoText}>+ Add Photo</Text>}
            </TouchableOpacity>
          </View>
          <Text style={[styles.description, { marginTop: 10 }]}>
            {allPhotos.length > 0 ? `Swipe the top image to see all ${allPhotos.length} photos.` : 'No photos uploaded yet.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Watering History</Text>
          {plant.wateredDates && plant.wateredDates.length > 0 ? (
            <View style={styles.historyList}>
              {plant.wateredDates.slice().reverse().map((dateString: string, index: number) => {
                const date = new Date(dateString);
                return (
                  <View key={index} style={styles.historyItem}>
                    <Text style={styles.historyDate}>💧 {date.toLocaleDateString()}</Text>
                    <Text style={styles.historyTime}>{date.toLocaleTimeString()}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noHistory}>Has not been watered yet.</Text>
          )}
        </View>
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f9f6',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#e0ebd8',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageFallback: {
    resizeMode: 'contain',
    padding: 20,
    backgroundColor: '#f0f4f1',
  },
  infoContainer: {
    padding: 24,
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e2f',
    marginBottom: 4,
  },
  species: {
    fontSize: 18,
    color: '#6c8270',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  deadWarning: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    backgroundColor: '#ffe8e8',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  section: {
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f1',
    paddingBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#4a5d4e',
    lineHeight: 24,
  },
  historyList: {
    marginTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f1',
  },
  historyDate: {
    fontSize: 16,
    color: '#2c3e2f',
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 14,
    color: '#9aa89b',
  },
  noHistory: {
    fontSize: 15,
    color: '#9aa89b',
    fontStyle: 'italic',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f1',
    paddingBottom: 8,
  },
  addPhotoBtn: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addPhotoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2ecc71',
    marginHorizontal: 4,
    opacity: 0.6,
  },
});
