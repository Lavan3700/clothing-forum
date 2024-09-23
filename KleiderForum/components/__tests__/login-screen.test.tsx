import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../../app/index'; // Adjust path as necessary
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Mocking SQLite
jest.mock('expo-sqlite', () => {
    const mockDb = {
        getAllSync: jest.fn(),
    };
    return {
        openDatabaseSync: jest.fn(() => mockDb),
    };
});

// Mocking AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
}));

// Mocking Alert
jest.spyOn(Alert, 'alert');

// Helper function to render component with navigation context
const renderWithNavigation = (component) => {
    return render(
        <NavigationContainer>
            {component}
        </NavigationContainer>
    );
};

describe('LoginScreen - User Login', () => {
    let mockDb;

    beforeEach(() => {
        mockDb = SQLite.openDatabaseSync();
        mockDb.getAllSync.mockReset();
        AsyncStorage.setItem.mockReset();
        Alert.alert.mockReset();
    });

    // Positive test: Successful login with correct credentials
    it('should log in successfully with correct credentials', async () => {
        mockDb.getAllSync.mockReturnValueOnce([{ id: 1, username: 'admin', email: 'admin@example.com', password: 'password' }]);

        const { getByPlaceholderText, getByText } = renderWithNavigation(<LoginScreen />);

        fireEvent.changeText(getByPlaceholderText('Email oder Username'), 'admin');
        fireEvent.changeText(getByPlaceholderText('Password'), 'password');
        fireEvent.press(getByText('LOGIN'));

        await waitFor(() => {
            // Verify database query
            expect(mockDb.getAllSync).toHaveBeenCalledWith(expect.any(String));

            // Verify AsyncStorage actions
            expect(AsyncStorage.setItem).toHaveBeenCalledWith('userId', '1');
            expect(AsyncStorage.setItem).toHaveBeenCalledWith('username', 'admin');

            // Verify success alert
            expect(Alert.alert).toHaveBeenCalledWith('Erfolgreich eingeloggt!');
        });
    });

    // Negative test: Error message with incorrect credentials
    it('should show an error message with incorrect credentials', async () => {
        mockDb.getAllSync.mockReturnValueOnce([]); // No matches in DB

        const { getByPlaceholderText, getByText } = renderWithNavigation(<LoginScreen />);

        fireEvent.changeText(getByPlaceholderText('Email oder Username'), 'wronguser');
        fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpassword');
        fireEvent.press(getByText('LOGIN'));

        await waitFor(() => {
            expect(mockDb.getAllSync).toHaveBeenCalledWith(expect.any(String));
            expect(Alert.alert).toHaveBeenCalledWith('Benutzereingaben falsch');
        });
    });

    // Test for empty input fields
    it('should show an error message if fields are empty', async () => {
        const { getByText } = renderWithNavigation(<LoginScreen />);

        fireEvent.press(getByText('LOGIN'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Bitte geben Sie eine E-Mail oder einen Benutzernamen und ein Passwort ein.');
        });
    });
});
