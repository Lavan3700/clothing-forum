import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreatePostScreen from '../../app/new-forum-page'; // Passe den Pfad entsprechend an
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { NavigationContainer } from '@react-navigation/native';

// Mocking SQLite
jest.mock('expo-sqlite', () => {
    const mockDb = {
        execSync: jest.fn(),
    };
    return {
        openDatabaseSync: jest.fn(() => mockDb),
    };
});

// Mocking AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
}));

// Mocking ImagePicker
jest.mock('expo-image-picker', () => ({
    requestMediaLibraryPermissionsAsync: jest.fn(),
    launchImageLibraryAsync: jest.fn(),
    MediaTypeOptions: {
        Images: 'Images',
    },
}));

describe('CreatePostScreen - Veröffentlichung eines neuen Blogposts', () => {
    let mockDb;

    beforeEach(() => {
        mockDb = SQLite.openDatabaseSync();
        mockDb.execSync.mockReset();
        AsyncStorage.getItem.mockReset();
        ImagePicker.requestMediaLibraryPermissionsAsync.mockReset();
        ImagePicker.launchImageLibraryAsync.mockReset();
    });

    it('should allow a user to create a new blog post', async () => {
        // Mocking AsyncStorage to return a user ID
        AsyncStorage.getItem.mockResolvedValueOnce('1');

        const { getByPlaceholderText, getByText } = render(
            <NavigationContainer>
                <CreatePostScreen />
            </NavigationContainer>
        );

        // Simulate user input
        fireEvent.changeText(getByPlaceholderText('Titel'), 'Test Blog Title');
        fireEvent.changeText(getByPlaceholderText('Inhalt'), 'This is the content of the test blog post.');

        // Mocking ImagePicker result
        ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: true });
        ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
            canceled: false,
            assets: [{ uri: 'test-uri' }],
        });

        // Simulate image picking
        fireEvent.press(getByText('Bild auswählen'));

        await waitFor(() => {
            expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
        });

        // Simulate publishing the post
        fireEvent.press(getByText('Veröffentlichen'));

        await waitFor(() => {
            // Check if the INSERT INTO blogs SQL command was issued
            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringMatching(/INSERT INTO blogs\s+\(title, text, imageUri, user_id\)\s+VALUES\s+\('Test Blog Title', 'This is the content of the test blog post.', 'test-uri', 1\);/)
            );
        });
    });
});
