import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../../app/register-screen';
import * as SQLite from 'expo-sqlite';
import { Alert } from 'react-native';

// Mocking SQLite
jest.mock('expo-sqlite', () => {
    const mockDb = {
        getAllSync: jest.fn(),
        execSync: jest.fn(),
    };
    return {
        openDatabaseSync: jest.fn(() => mockDb),
    };
});

// Mocking Alert
jest.spyOn(Alert, 'alert');

describe('SettingsScreen - Benutzerregistrierung', () => {
    let mockDb;

    beforeEach(() => {
        mockDb = SQLite.openDatabaseSync();
        mockDb.getAllSync.mockReset();
        mockDb.execSync.mockReset();
    });

    // Positivtest: Erfolgreiche Benutzerregistrierung
    it('should register a new user successfully', async () => {
        mockDb.getAllSync.mockReturnValueOnce([]); // Kein vorhandener Benutzer

        const { getByPlaceholderText, getByText } = render(<SettingsScreen />);

        // Benutzerdaten eingeben
        fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
        fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

        // Registrierung auslösen
        fireEvent.press(getByText('REGISTER'));

        await waitFor(() => {
            // Überprüfen, ob der Benutzer hinzugefügt wurde
            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringMatching(/INSERT INTO users \(email, username, password\) VALUES \('test@example.com', 'testuser', 'password123'\);/)
            );
            // Überprüfen, ob die Erfolgsmeldung angezeigt wird
            expect(Alert.alert).toHaveBeenCalledWith('Benutzer erfolgreich registriert');
        });
    });

    // Negativtest: Fehlermeldung, wenn der Benutzer bereits existiert
    it('should show an error if the user already exists', async () => {
        mockDb.getAllSync.mockReturnValueOnce([{ id: 1, email: 'test@example.com', username: 'testuser', password: 'password123' }]);

        const { getByPlaceholderText, getByText } = render(<SettingsScreen />);

        // Benutzerdaten eingeben, die bereits existieren
        fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
        fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

        // Registrierung auslösen
        fireEvent.press(getByText('REGISTER'));

        await waitFor(() => {
            // Überprüfen, ob die Fehlermeldung angezeigt wird
            expect(Alert.alert).toHaveBeenCalledWith('Benutzer mit dieser E-Mail oder diesem Benutzernamen existiert bereits');
            // Überprüfen, dass kein neuer Benutzer hinzugefügt wurde
            expect(mockDb.execSync).not.toHaveBeenCalled();
        });
    });
});
