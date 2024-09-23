import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CreatePostScreen = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState(null);

  const pickImage = async () => {
    // Anfrage für die Erlaubnis
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Erlaubnis erforderlich", "Erlaubnis für den Zugriff auf die Galerie wird benötigt!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePublish = async () => {
    console.log('Title:', title);
    console.log('Content:', content);
    console.log('Image URI:', imageUri);

    try {
      // userId direkt aus AsyncStorage abrufen
      const storedUserId = await AsyncStorage.getItem('userId');
      const userId = storedUserId ? parseInt(storedUserId, 10) : null;

      console.log('User ID for publishing:', userId);

      if (!title || !content || !userId) {
        Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus.');
        return;
      }

      const db = SQLite.openDatabaseSync('lmao');

      try {
        db.execSync(`
          INSERT INTO blogs (title, text, imageUri, user_id)
          VALUES ('${title}', '${content}', '${imageUri}', ${userId});
        `);
        console.log('Blog inserted successfully');
        Alert.alert('Erfolg', 'Der Beitrag wurde erfolgreich veröffentlicht!');

        // Felder nach erfolgreichem Eintrag leeren
        setTitle('');
        setContent('');
        setImageUri(null);
      } catch (error) {
        console.log('Error inserting blog:', error);
        Alert.alert('Fehler', 'Es gab ein Problem beim Veröffentlichen des Beitrags.');
      }
    } catch (error) {
      console.log('Error retrieving user ID for publish:', error);
      Alert.alert('Fehler', 'Es gab ein Problem beim Abrufen der Benutzerinformationen.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Erstelle einen neuen Post</Text>

      <Text style={styles.label}>Titel:</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Titel"
      />

      <Text style={styles.label}>Inhalt:</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={content}
        onChangeText={setContent}
        placeholder="Inhalt"
        multiline
      />

      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        <Text style={styles.buttonText}>Bild auswählen</Text>
      </TouchableOpacity>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.publishButton]} onPress={handlePublish}>
          <Text style={styles.buttonText}>Veröffentlichen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePicker: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#00407A',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CreatePostScreen;
