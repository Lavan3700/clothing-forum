import React, { useState } from 'react';
import { Button, View, Text, FlatList, StyleSheet, TextInput, Alert } from "react-native";
import * as SQLite from 'expo-sqlite';

export default function SettingsScreen() {
    const [users, setUsers] = useState<any[]>([]); // Zustand für die Benutzerliste
    const [email, setEmail] = useState(''); // Zustand für die E-Mail-Eingabe
    const [username, setUsername] = useState(''); // Zustand für die Benutzernamen-Eingabe
    const [password, setPassword] = useState(''); // Zustand für die Passwort-Eingabe

    const handleRegisterUser = () => {
        const db = SQLite.openDatabaseSync('lmao');

        // Überprüfen, ob der Benutzer bereits existiert
        const existingUser: any[] = db.getAllSync(`
            SELECT * FROM users WHERE email = '${email}' OR username = '${username}';
        `);

        if (existingUser.length > 0) {
            Alert.alert('Benutzer mit dieser E-Mail oder diesem Benutzernamen existiert bereits');
        } else {
            // Benutzer hinzufügen
            db.execSync(`
                INSERT INTO users (email, username, password) VALUES ('${email}', '${username}', '${password}');
            `);
            Alert.alert('Benutzer erfolgreich registriert');
            setEmail(''); // Felder zurücksetzen
            setUsername('');
            setPassword('');
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button title="REGISTER" onPress={handleRegisterUser} />
            <FlatList
                data={users}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={{ padding: 10 }}>
                        <Text style={styles.text}>ID: {item.id}</Text>
                        <Text style={styles.text}>Email: {item.email}</Text>
                        <Text style={styles.text}>Username: {item.username}</Text>
                        <Text style={styles.text}>Password: {item.password}</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    text: {
        color: 'black', // Setzt die Textfarbe auf Schwarz
    },
    input: {
        width: 200,
        marginTop: 50,
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
});