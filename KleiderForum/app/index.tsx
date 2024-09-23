import React, { useState } from 'react';
import { Button, View, Text, StyleSheet, TextInput, Alert, TouchableOpacity } from "react-native";
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation();

    const handleCheckUserExists = async () => {
        if (!identifier || !password) {
            Alert.alert('Bitte geben Sie eine E-Mail oder einen Benutzernamen und ein Passwort ein.');
            return;
        }

        const db = SQLite.openDatabaseSync('lmao');
        const query = `
            SELECT * FROM users WHERE (email = '${identifier}' OR username = '${identifier}') AND password = '${password}';
        `;

        const result = db.getAllSync(query);

        if (result.length > 0) {
            const user = result[0];
            console.log('Logged in user:', user);
            await AsyncStorage.setItem('userId', String(user.id));
            await AsyncStorage.setItem('username', user.username);
            Alert.alert('Erfolgreich eingeloggt!');

            // Nach erfolgreichem Login zum Tab-Navigator wechseln
            navigation.navigate('(tabs)');
        } else {
            Alert.alert('Benutzereingaben falsch');
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <TextInput
                style={styles.input}
                placeholder="Email oder Username"
                value={identifier}
                onChangeText={setIdentifier}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button title="LOGIN" onPress={handleCheckUserExists} />

            <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate('register-screen')}
            >
                <Text style={styles.registerButtonText}>Registrieren</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    input: {
        width: 200,
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    registerButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#28a745',
        borderRadius: 5,
    },
    registerButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
