import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const ProfileScreen = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [username, setUsername] = useState('');
  const [blogs, setBlogs] = useState<any[]>([]);
  const navigation = useNavigation(); // Für Navigation

  useEffect(() => {
    const fetchUsernameAndBlogs = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedUserId = await AsyncStorage.getItem('userId');

      if (storedUsername) {
        setUsername(storedUsername);
      }

      if (storedUserId) {
        fetchBlogs(parseInt(storedUserId, 10));
      }
    };

    fetchUsernameAndBlogs();
  }, []);

  const fetchBlogs = (userId: number) => {
    const db = SQLite.openDatabaseSync('lmao');
    try {
      const result = db.getAllSync(`
        SELECT blogs.id, blogs.title, blogs.text, blogs.imageUri, users.username,
        (SELECT COUNT(*) FROM likes WHERE likes.blog_id = blogs.id) AS likeCount
        FROM blogs
        JOIN users ON blogs.user_id = users.id
        WHERE blogs.user_id = ${userId};
      `);

      if (result.length > 0) {
        setBlogs(result);
      } else {
        setBlogs([]);
      }
    } catch (error) {
      console.log('Error fetching blogs:', error);
      Alert.alert('Fehler', 'Fehler beim Abrufen der Blogeinträge.');
    }
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert('Erlaubnis zur Verwendung der Kamera wird benötigt!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage({ uri: result.assets[0].uri });
    }
  };

  const handleLogout = async () => {
    try {
      // Benutzerinformationen aus AsyncStorage entfernen
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('username');
      Alert.alert('Erfolgreich abgemeldet', 'Sie wurden erfolgreich abgemeldet.');
      navigation.navigate('index'); // Benutzer zur Login-Seite weiterleiten
    } catch (error) {
      Alert.alert('Fehler', 'Beim Abmelden ist ein Fehler aufgetreten.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.activityContainer}>
      <Text style={styles.activityTitle}>{item.title}</Text>
      <Text style={styles.activityDescription}>{item.text}</Text>
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.activityImage} />
      ) : null}
      <Text style={styles.activityMeta}>{item.likeCount} Likes</Text>
    </View>
  );

  return (
    <View style={styles.background}>
      <View style={styles.profileContainer}>
        <TouchableOpacity onPress={openCamera}>
          <Image style={styles.profileImage} source={profileImage || { uri: 'https://via.placeholder.com/150' }} />
        </TouchableOpacity>
        <Text style={styles.username}>{username}</Text>
      </View>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.activityBox}>
        <Text style={styles.sectionTitle}>{username}'s Blogs</Text>
        <FlatList
          data={blogs}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    padding: 20,
  },
  profileContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  activityBox: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  activityContainer: {
    backgroundColor: '#f4f4f4',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00407A',
  },
  activityDescription: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 5,
  },
  activityImage: {
    width: '100%',
    height: 200,
    marginVertical: 10,
    borderRadius: 5,
  },
  activityMeta: {
    fontSize: 12,
    color: 'gray',
  },
});

export default ProfileScreen;
