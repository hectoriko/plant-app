import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.27:5000/api';
const API_URL = `${BASE_URL}/tasks`;

interface Task {
  _id: string;
  title: string;
  completed: boolean;
  plantId?: string;
  plantName?: string;
  createdAt: string;
}

interface Plant {
  _id: string;
  name: string;
}

export default function TodosScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Mention system states
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  const fetchData = async () => {
    try {
      const [tasksRes, plantsRes] = await Promise.all([
        axios.get(API_URL),
        axios.get(`${BASE_URL}/plants`)
      ]);
      setTasks(tasksRes.data);
      setPlants(plantsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleTextChange = (text: string) => {
    setNewTaskTitle(text);
    
    // Check if user is typing a mention
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const query = text.slice(lastAtIndex + 1).toLowerCase();
      // Only show suggestions if there's no space after @ OR we are still in the mention word
      const nextSpaceIndex = text.indexOf(' ', lastAtIndex);
      
      if (nextSpaceIndex === -1 || nextSpaceIndex > text.length - 1) {
        const matches = plants.filter(p => p.name.toLowerCase().includes(query));
        setFilteredPlants(matches);
        setShowSuggestions(matches.length > 0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const selectPlant = (plant: Plant) => {
    setSelectedPlant(plant);
    setShowSuggestions(false);
    
    // Optional: replace the @mention with the actual name or just keep it
    const lastAtIndex = newTaskTitle.lastIndexOf('@');
    const newText = newTaskTitle.slice(0, lastAtIndex) + `@${plant.name} `;
    setNewTaskTitle(newText);
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    setIsAdding(true);
    try {
      const response = await axios.post(API_URL, { 
        title: newTaskTitle,
        plantId: selectedPlant?._id 
      });
      
      // Manually add plantName for immediate UI update if needed
      const newTask = { ...response.data, plantName: selectedPlant?.name };
      setTasks([newTask, ...tasks]);
      
      setNewTaskTitle('');
      setSelectedPlant(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to add task.');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleTask = async (task: any) => {
    try {
      const response = await axios.put(`${API_URL}/${task._id}`, { ...task, completed: !task.completed });
      setTasks(tasks.map(t => t._id === task._id ? response.data : t));
    } catch (error) {
      Alert.alert('Error', 'Failed to update task.');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTasks(tasks.filter(t => t._id !== id));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete task.');
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plant Tasks</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="What needs to be done? (use @ to link a plant)"
              value={newTaskTitle}
              onChangeText={handleTextChange}
              onSubmitEditing={addTask}
            />
            <TouchableOpacity 
              style={[styles.addButton, !newTaskTitle && styles.disabledButton]} 
              onPress={addTask}
              disabled={isAdding || !newTaskTitle}
            >
              {isAdding ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="add" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {showSuggestions && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={filteredPlants}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.suggestionItem} 
                    onPress={() => selectPlant(item)}
                  >
                    <Ionicons name="leaf-outline" size={16} color="#2ecc71" />
                    <Text style={styles.suggestionText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                style={styles.suggestionsList}
                keyboardShouldPersistTaps="always"
              />
            </View>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2ecc71" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.taskItem}>
                <TouchableOpacity 
                  style={styles.taskContent} 
                  onPress={() => toggleTask(item)}
                >
                  <Ionicons 
                    name={item.completed ? "checkbox" : "square-outline"} 
                    size={24} 
                    color={item.completed ? "#2ecc71" : "#bdc3c7"} 
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskTitle, item.completed && styles.completedText]}>
                      {item.title}
                    </Text>
                    {item.plantId && (
                      <View style={styles.plantBadge}>
                        <Ionicons name="leaf" size={12} color="#2ecc71" />
                        <Text style={styles.plantBadgeText}>
                          {(item.plantId as any).name || 'Unknown Plant'}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => deleteTask(item._id)}>
                  <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="clipboard-outline" size={60} color="#ecf0f1" />
                <Text style={styles.emptyText}>All caught up! Add a new task above.</Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f9f6',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0ebd8',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e2f',
  },
  inputWrapper: {
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    zIndex: 1,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e0ebd8',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 100,
  },
  suggestionsList: {
    padding: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f9f6',
  },
  suggestionText: {
    fontSize: 16,
    color: '#2c3e2f',
  },
  plantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e8f7ec',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  plantBadgeText: {
    fontSize: 12,
    color: '#2ecc71',
    fontWeight: '600',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0ebd8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0ebd8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskTitle: {
    fontSize: 16,
    color: '#2c3e2f',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#95a5a6',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});
