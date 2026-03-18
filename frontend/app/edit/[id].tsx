import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const API_URL = 'http://192.168.0.27:5000/api/plants';

export default function EditPlantScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isDead, setIsDead] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPlant = async () => {
      try {
        const response = await axios.get(API_URL);
        const plant = response.data.find((p: any) => p._id === id);
        if (plant) {
          setName(plant.name);
          setSpecies(plant.species || '');
          setImageUri(plant.imageUri || null);
          setIsDead(plant.isDead);
        } else {
          Alert.alert('Error', 'Plant not found');
          router.back();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch plant details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlant();
  }, [id]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setImageUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You've refused to allow this app to access your camera!");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setImageUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a plant name');
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${API_URL}/${id}`, { name, species, imageUri, isDead });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update plant');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#646cff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Plant Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>Species (optional)</Text>
      <TextInput
        style={styles.input}
        value={species}
        onChangeText={setSpecies}
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>Photo (optional)</Text>
      <View style={styles.imageSelector}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>No Photo</Text>
          </View>
        )}
        <View style={styles.imageButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={takePhoto}>
            <Text style={styles.iconButtonText}>📷 Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
            <Text style={styles.iconButtonText}>🖼️ Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.statusToggle, isDead && styles.statusToggleDead]}
        onPress={() => setIsDead(!isDead)}
      >
        <Text style={[styles.statusText, isDead && styles.statusTextDead]}>
          {isDead ? '💀 Currently marked as Dead (Tap to Revive)' : '🌿 Currently Alive (Tap to mark Dead)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#242424',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: 'rgba(255, 255, 255, 0.87)',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  imageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  imagePlaceholderText: {
    color: '#666',
    fontSize: 12,
  },
  imageButtons: {
    flex: 1,
    gap: 10,
  },
  iconButton: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  iconButtonText: {
    color: '#646cff',
    fontWeight: '500',
  },
  statusToggle: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
    alignItems: 'center',
  },
  statusToggleDead: {
    borderColor: '#ff4444',
    backgroundColor: '#3a1a1a',
  },
  statusText: {
    color: '#4ade80',
    fontWeight: 'bold',
  },
  statusTextDead: {
    color: '#ff4444',
  },
  button: {
    backgroundColor: '#646cff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


