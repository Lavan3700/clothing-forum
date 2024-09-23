import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Image, Alert, TextInput } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const ForumScreen = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [selectedBlogId, setSelectedBlogId] = useState<number | null>(null);

  const navigation = useNavigation();

  const handleNewPost = () => {
    navigation.navigate('new-forum-page');
  };

  useEffect(() => {
    const db = SQLite.openDatabaseSync('lmao');

    // Sicherstellen, dass die Tabellen für Kommentare und Likes existieren
    db.execSync(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY,
        blog_id INTEGER,
        user_id INTEGER,
        text TEXT,
        FOREIGN KEY (blog_id) REFERENCES blogs(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY,
        blog_id INTEGER,
        user_id INTEGER,
        FOREIGN KEY (blog_id) REFERENCES blogs(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    fetchBlogs(); // Initiales Laden der Blogs
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchBlogs(); // Blogs erneut laden, wenn die Seite in den Fokus kommt
    }, [])
  );

  const fetchBlogs = async () => {
    const db = SQLite.openDatabaseSync('lmao');
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const userId = storedUserId ? parseInt(storedUserId, 10) : null;

      if (!userId) {
        Alert.alert('Fehler', 'Benutzer nicht gefunden.');
        return;
      }

      const result = db.getAllSync(`
        SELECT blogs.id, blogs.title, blogs.text, blogs.imageUri, users.username,
        (SELECT COUNT(*) FROM likes WHERE likes.blog_id = blogs.id) AS likeCount,
        EXISTS(SELECT 1 FROM likes WHERE likes.blog_id = blogs.id AND likes.user_id = ${userId}) AS likedByUser
        FROM blogs
        JOIN users ON blogs.user_id = users.id;
      `);

      const blogsWithCommentsAndLikes = result.map(blog => {
        const comments = fetchComments(blog.id);
        return { ...blog, comments };
      });

      if (blogsWithCommentsAndLikes.length > 0) {
        setBlogs(blogsWithCommentsAndLikes);
      } else {
        setBlogs([]);
      }
    } catch (error) {
      console.log('Error fetching blogs:', error);
      Alert.alert('Fehler', 'Fehler beim Abrufen der Blogeinträge.');
    }
  };

  const fetchComments = (blogId: number) => {
    const db = SQLite.openDatabaseSync('lmao');
    try {
      const result = db.getAllSync(`
        SELECT comments.id, comments.text, users.username
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.blog_id = ${blogId};
      `);
      return result;
    } catch (error) {
      console.log('Error fetching comments:', error);
      return [];
    }
  };

  const handleAddComment = async () => {
    if (selectedBlogId !== null && commentText.trim() !== '') {
      const db = SQLite.openDatabaseSync('lmao');
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const userId = storedUserId ? parseInt(storedUserId, 10) : null;

        if (!userId) {
          Alert.alert('Fehler', 'Benutzer nicht gefunden.');
          return;
        }

        db.execSync(`
          INSERT INTO comments (blog_id, user_id, text)
          VALUES (${selectedBlogId}, ${userId}, '${commentText}');
        `);

        setCommentText('');
        Alert.alert('Erfolg', 'Kommentar hinzugefügt');

        const updatedBlogs = blogs.map(blog => {
          if (blog.id === selectedBlogId) {
            const updatedComments = fetchComments(selectedBlogId);
            return { ...blog, comments: updatedComments };
          }
          return blog;
        });
        setBlogs(updatedBlogs);

      } catch (error) {
        console.log('Error adding comment:', error);
        Alert.alert('Fehler', 'Fehler beim Hinzufügen des Kommentars.');
      }
    } else {
      Alert.alert('Fehler', 'Bitte geben Sie einen Kommentar ein.');
    }
  };

  const handleLike = async (blogId: number) => {
    const db = SQLite.openDatabaseSync('lmao');
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const userId = storedUserId ? parseInt(storedUserId, 10) : null;

      if (!userId) {
        Alert.alert('Fehler', 'Benutzer nicht gefunden.');
        return;
      }

      const existingLike = db.getAllSync(`
        SELECT * FROM likes WHERE blog_id = ${blogId} AND user_id = ${userId};
      `);

      if (existingLike.length === 0) {
        db.execSync(`
          INSERT INTO likes (blog_id, user_id)
          VALUES (${blogId}, ${userId});
        `);

        const updatedBlogs = blogs.map(blog => {
          if (blog.id === blogId) {
            return { ...blog, likeCount: blog.likeCount + 1, likedByUser: true };
          }
          return blog;
        });
        setBlogs(updatedBlogs);
      } else {
        db.execSync(`
          DELETE FROM likes WHERE blog_id = ${blogId} AND user_id = ${userId};
        `);

        const updatedBlogs = blogs.map(blog => {
          if (blog.id === blogId) {
            return { ...blog, likeCount: blog.likeCount - 1, likedByUser: false };
          }
          return blog;
        });
        setBlogs(updatedBlogs);
      }

    } catch (error) {
      console.log('Error toggling like:', error);
      Alert.alert('Fehler', 'Fehler beim Liken/Disliken des Blogs.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.innerContainer}>
          <TouchableOpacity style={styles.newPostButton} onPress={handleNewPost}>
            <Text style={styles.newPostButtonText}>Neuer Post</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>Blogs</Text>
          {blogs.map((blog) => (
            <View key={blog.id} style={styles.postContainer}>
              <Text style={styles.postTitle}>{blog.title}</Text>
              <Text style={styles.postContent}>{blog.text}</Text>
              {blog.imageUri ? (
                <Image source={{ uri: blog.imageUri }} style={styles.image} />
              ) : null}
              <Text style={styles.postContent}>Author: {blog.username}</Text>
              <View style={styles.likeContainer}>
                <Text style={styles.likeCount}>{blog.likeCount} Likes</Text>
                <TouchableOpacity onPress={() => handleLike(blog.id)}>
                  <AntDesign
                    name="heart"
                    size={24}
                    color={blog.likedByUser ? 'red' : 'gray'}
                    style={styles.heartIcon}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.commentSectionTitle}>Kommentare:</Text>
              {blog.comments && blog.comments.map((comment) => (
                <View key={comment.id} style={styles.commentContainer}>
                  <Text style={styles.commentUsername}>{comment.username}:</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              ))}
              <TextInput
                style={styles.input}
                placeholder="Einen Kommentar hinzufügen..."
                value={commentText}
                onChangeText={setCommentText}
                onFocus={() => setSelectedBlogId(blog.id)}
              />
              <TouchableOpacity style={styles.addCommentButton} onPress={handleAddComment}>
                <Text style={styles.addCommentButtonText}>Kommentar hinzufügen</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  innerContainer: {
    padding: width * 0.05,
    backgroundColor: 'white',
  },
  newPostButton: {
    backgroundColor: '#28a745',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.05,
    borderRadius: 5,
    alignSelf: 'flex-end', // Button rechtsbündig ausrichten
    marginBottom: height * 0.02,
  },
  newPostButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    backgroundColor: '#00407A',
    color: 'white',
    padding: height * 0.015,
    borderRadius: 5,
    marginBottom: height * 0.02, // Abstand zum Button
  },
  postContainer: {
    backgroundColor: '#f4f4f4',
    padding: height * 0.02,
    marginTop: height * 0.01,
    borderRadius: 5,
  },
  postTitle: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#00407A',
    marginBottom: height * 0.005,
  },
  postContent: {
    fontSize: width * 0.04,
    color: 'gray',
  },
  image: {
    width: '100%',
    height: 200,
    marginVertical: 10,
    borderRadius: 5,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  likeCount: {
    fontSize: width * 0.04,
    color: 'gray',
  },
  heartIcon: {
    marginLeft: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  addCommentButton: {
    backgroundColor: '#00407A',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  addCommentButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  commentContainer: {
    backgroundColor: '#e1e1e1',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  commentSectionTitle: {
    fontSize: width * 0.04,
    color: 'gray',
    marginTop: height * 0.02,
    fontWeight: 'normal',
  },
  commentUsername: {
    fontWeight: 'normal',
    marginRight: 5,
  },
  commentText: {
    fontSize: width * 0.04,
  },
});

export default ForumScreen;
