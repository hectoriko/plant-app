import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.27:5000/api/plants';

export default function EditPlantScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [description, setDescription] = useState('');
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
          setDescription(plant.description || '');
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
      await axios.put(`${API_URL}/${id}`, { name, species, description, imageUri, isDead });
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

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        value={description}
        onChangeText={setDescription}
        placeholderTextColor="#666"
        multiline
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
    padding: 24,
    backgroundColor: '#f5f9f6',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: '#2c3e2f',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0ebd8',
    borderRadius: 12,
    padding: 16,
    color: '#2c3e2f',
    fontSize: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  imageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 15,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0ebd8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  imagePlaceholderText: {
    color: '#9aa89b',
    fontSize: 12,
    fontWeight: '500',
  },
  imageButtons: {
    flex: 1,
    gap: 10,
  },
  iconButton: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0ebd8',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconButtonText: {
    color: '#2ecc71',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusToggle: {
    backgroundColor: '#e8f7ec',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2ecc71',
    marginBottom: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statusToggleDead: {
    borderColor: '#e74c3c',
    backgroundColor: '#ffe8e8',
  },
  statusText: {
    color: '#2ecc71',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusTextDead: {
    color: '#e74c3c',
  },
  button: {
    backgroundColor: '#2ecc71',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#a8e6cf',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});


