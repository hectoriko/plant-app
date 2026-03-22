import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Image, ScrollView, Platform, Dimensions, TouchableOpacity, Alert, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.27:5000/api/plants';
const PLANTAE_LOGO = require('../../assets/images/plantae-logo.png');
const DEFAULT_PLANT_IMAGE = require('../../assets/images/default.jpg');

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [plant, setPlant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [newJournalNote, setNewJournalNote] = useState('');
  const [addingJournal, setAddingJournal] = useState(false);
  const [frequency, setFrequency] = useState('7');
  const [updatingFrequency, setUpdatingFrequency] = useState(false);
  const [watering, setWatering] = useState(false);
  const [activeTab, setActiveTab] = useState('main'); // 'main', 'water', 'journal'

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

  const addJournalEntry = async () => {
    if (!newJournalNote.trim()) return;
    setAddingJournal(true);
    try {
      const entry = { date: new Date(), note: newJournalNote.trim() };
      const updatedJournal = [...(plant.journal || []), entry];
      const updatedPlant = { ...plant, journal: updatedJournal };
      await axios.put(`${API_URL}/${plant._id}`, updatedPlant);
      setPlant(updatedPlant);
      setNewJournalNote('');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add journal entry');
    } finally {
      setAddingJournal(false);
    }
  };

  const updateFrequency = async (newVal: string) => {
    setFrequency(newVal);
    const num = parseInt(newVal);
    if (isNaN(num) || num < 1) return;
    
    setUpdatingFrequency(true);
    try {
      const updatedPlant = { ...plant, wateringFrequency: num };
      await axios.put(`${API_URL}/${plant._id}`, updatedPlant);
      setPlant(updatedPlant);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update watering frequency');
    } finally {
      setUpdatingFrequency(false);
    }
  };

  const waterPlant = async () => {
    setWatering(true);
    try {
      const newDate = new Date();
      const updatedPlant = { 
        ...plant, 
        lastWatered: newDate,
        wateredDates: [...(plant.wateredDates || []), newDate]
      };
      await axios.put(`${API_URL}/${plant._id}`, updatedPlant);
      setPlant(updatedPlant);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to water plant');
    } finally {
      setWatering(false);
    }
  };

  const deleteJournalEntry = (entryToDelete: any) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const updatedJournal = plant.journal.filter((e: any) => e !== entryToDelete);
          const updatedPlant = { ...plant, journal: updatedJournal };
          await axios.put(`${API_URL}/${plant._id}`, updatedPlant);
          setPlant(updatedPlant);
        } catch (error) {
          Alert.alert('Error', 'Failed to delete note');
        }
      }}
    ]);
  };

  const deleteWateringRecord = (dateToDelete: string) => {
    Alert.alert('Delete Record', 'Are you sure you want to delete this watering record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const updatedDates = plant.wateredDates.filter((d: string) => d !== dateToDelete);
          const updatedPlant = { ...plant, wateredDates: updatedDates };
          // If the deleted date was the lastWatered, we might want to update it to the previous one
          if (plant.lastWatered === dateToDelete) {
            updatedPlant.lastWatered = updatedDates.length > 0 ? updatedDates[updatedDates.length - 1] : new Date();
          }
          await axios.put(`${API_URL}/${plant._id}`, updatedPlant);
          setPlant(updatedPlant);
        } catch (error) {
          Alert.alert('Error', 'Failed to delete watering record');
        }
      }}
    ]);
  };

  useEffect(() => {
    const fetchPlant = async () => {
      try {
        const response = await axios.get(`${API_URL}/${id}`);
        setPlant(response.data);
        setFrequency(response.data.wateringFrequency?.toString() || '7');
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

  const allPhotos: string[] = [];
  if (plant.imageUri) allPhotos.push(plant.imageUri);
  if (plant.photos && plant.photos.length > 0) {
    allPhotos.push(...plant.photos);
  }

  const getNextWateringInfo = () => {
    if (!plant.lastWatered || !plant.wateringFrequency) return null;
    const lastDate = new Date(plant.lastWatered);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + plant.wateringFrequency);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const nextClean = new Date(nextDate);
    nextClean.setHours(0,0,0,0);
    
    const diffTime = nextClean.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return { date: nextDate, daysRemain: diffDays };
  };

  const renderWateringStatus = () => {
    const info = getNextWateringInfo();
    if (!info) return null;
    
    const isOverdue = info.daysRemain < 0;
    const isToday = info.daysRemain === 0;
    
    return (
      <View style={[styles.statusBanner, isOverdue && styles.overdueBanner, isToday && styles.todayBanner]}>
        <Text style={styles.statusBannerText}>
          {isOverdue ? `Overdue by ${Math.abs(info.daysRemain)} days!` : 
           isToday ? 'NEEDS WATER TODAY' : 
           `Next watering in ${info.daysRemain} days (${info.date.toLocaleDateString()})`}
        </Text>
      </View>
    );
  };

  const renderMainTab = () => (
    <>
      <View style={styles.imageContainer}>
        {allPhotos.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {allPhotos.map((uri, index) => (
              <Image key={index} source={{ uri }} style={[styles.mainImage, { width: screenWidth }]} />
            ))}
          </ScrollView>
        ) : (
          <Image source={DEFAULT_PLANT_IMAGE} style={[styles.mainImage, { width: screenWidth }]} />
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
        <View style={styles.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{plant.name}</Text>
            {plant.species ? <Text style={styles.species}>{plant.species}</Text> : null}
          </View>
          <TouchableOpacity 
            style={[styles.waterBtn, watering && styles.waterBtnDisabled]} 
            onPress={waterPlant}
            disabled={watering}
          >
            {watering ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="water" size={24} color="#fff" />}
          </TouchableOpacity>
        </View>
        
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
      </View>
    </>
  );

  const renderWateringTab = () => (
    <View style={styles.tabContentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminders</Text>
        <View style={styles.reminderCard}>
          <View style={styles.reminderRow}>
            <Text style={styles.reminderLabel}>Water every</Text>
            <View style={styles.frequencyInputWrapper}>
              <TextInput
                style={styles.frequencyInput}
                value={frequency}
                onChangeText={updateFrequency}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.frequencySuffix}>days</Text>
            </View>
          </View>
          {updatingFrequency && <ActivityIndicator size="small" color="#2ecc71" style={{marginTop: 5}} />}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Watering History</Text>
        {plant.wateredDates && plant.wateredDates.length > 0 ? (
          <View style={styles.historyList}>
            {plant.wateredDates.slice().reverse().map((dateString: string, index: number) => {
              const date = new Date(dateString);
              return (
                <View key={index} style={styles.historyItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDate}>💧 {date.toLocaleDateString()}</Text>
                    <Text style={styles.historyTime}>{date.toLocaleTimeString()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteWateringRecord(dateString)}>
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.noHistory}>Has not been watered yet.</Text>
        )}
      </View>
    </View>
  );

  const renderJournalTab = () => (
    <View style={styles.tabContentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plant Journal</Text>
        
        <View style={styles.journalInputContainer}>
          <TextInput
            style={styles.journalInput}
            placeholder="e.g. Repotted into a bigger ceramic pot"
            placeholderTextColor="#9aa89b"
            value={newJournalNote}
            onChangeText={setNewJournalNote}
            multiline
          />
          <TouchableOpacity 
            style={[styles.journalButton, !newJournalNote.trim() && styles.journalButtonDisabled]} 
            onPress={addJournalEntry}
            disabled={!newJournalNote.trim() || addingJournal}
          >
            {addingJournal ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.journalButtonText}>Save Note</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.journalList}>
          {plant.journal && plant.journal.length > 0 ? (
            plant.journal.slice().reverse().map((entry: any, index: number) => {
              const date = new Date(entry.date || new Date());
              return (
                <View key={index} style={styles.journalEntry}>
                  <View style={styles.journalHeader}>
                    <Text style={styles.journalDate}>📓 {date.toLocaleDateString()} - {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                    <TouchableOpacity onPress={() => deleteJournalEntry(entry)}>
                      <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.journalNote}>{entry.note}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.noJournal}>No journal entries yet. Add one above!</Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: plant.name }} />
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {renderWateringStatus()}
          
          {activeTab === 'main' && renderMainTab()}
          {activeTab === 'water' && renderWateringTab()}
          {activeTab === 'journal' && renderJournalTab()}
        </ScrollView>

        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'main' && styles.activeTabItem]} 
            onPress={() => setActiveTab('main')}
          >
            <Ionicons name="image" size={24} color={activeTab === 'main' ? '#2ecc71' : '#9aa89b'} />
            <Text style={[styles.tabLabel, activeTab === 'main' && styles.activeTabLabel]}>General</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'water' && styles.activeTabItem]} 
            onPress={() => setActiveTab('water')}
          >
            <Ionicons name="water" size={24} color={activeTab === 'water' ? '#2ecc71' : '#9aa89b'} />
            <Text style={[styles.tabLabel, activeTab === 'water' && styles.activeTabLabel]}>Riego</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'journal' && styles.activeTabItem]} 
            onPress={() => setActiveTab('journal')}
          >
            <Ionicons name="book" size={24} color={activeTab === 'journal' ? '#2ecc71' : '#9aa89b'} />
            <Text style={[styles.tabLabel, activeTab === 'journal' && styles.activeTabLabel]}>Diario</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingTop: 10,
  },
  statusBanner: {
    backgroundColor: '#e8f7ec',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBanner: {
    backgroundColor: '#f1c40f',
  },
  overdueBanner: {
    backgroundColor: '#e74c3c',
  },
  statusBannerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e2f',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  waterBtn: {
    backgroundColor: '#3498db',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  waterBtnDisabled: {
    backgroundColor: '#a9cce3',
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
  journalInputContainer: {
    marginTop: 10,
    marginBottom: 16,
  },
  journalInput: {
    backgroundColor: '#f5f9f6',
    borderWidth: 1,
    borderColor: '#e0ebd8',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#2c3e2f',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  journalButton: {
    backgroundColor: '#2ecc71',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
  },
  journalButtonDisabled: {
    backgroundColor: '#a8e6cf',
  },
  journalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  journalList: {
    marginTop: 8,
  },
  journalEntry: {
    backgroundColor: '#fafcfb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0ebd8',
    marginBottom: 12,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  journalDate: {
    fontSize: 13,
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  journalNote: {
    fontSize: 15,
    color: '#4a5d4e',
    lineHeight: 22,
  },
  noJournal: {
    fontSize: 15,
    color: '#9aa89b',
    fontStyle: 'italic',
  },
  reminderCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0ebd8',
    marginTop: 10,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderLabel: {
    fontSize: 16,
    color: '#2c3e2f',
    fontWeight: '600',
  },
  frequencyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  frequencyInput: {
    backgroundColor: '#f5f9f6',
    borderWidth: 1,
    borderColor: '#e0ebd8',
    borderRadius: 10,
    width: 60,
    padding: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  frequencySuffix: {
    fontSize: 16,
    color: '#6c8270',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addPhotoBtn: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addPhotoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2ecc71',
    marginHorizontal: 4,
    opacity: 0.6,
  },
  tabContentContainer: {
    padding: 24,
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0ebd8',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  activeTabItem: {
    borderTopWidth: 3,
    borderTopColor: '#2ecc71',
  },
  tabLabel: {
    fontSize: 11,
    color: '#9aa89b',
    fontWeight: '600',
  },
  activeTabLabel: {
    color: '#2ecc71',
  },
});
