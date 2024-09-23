import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ForumScreen from '../../app/(tabs)/main';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';

// Mocking SQLite
jest.mock('expo-sqlite', () => {
    const mockDb = {
        execSync: jest.fn(),
        getAllSync: jest.fn(),
    };
    return {
        openDatabaseSync: jest.fn(() => mockDb),
    };
});

// Mocking AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
}));

describe('ForumScreen - Laden von Blogs', () => {
    let mockDb;

    beforeEach(() => {
        mockDb = SQLite.openDatabaseSync();
        mockDb.getAllSync.mockReset();
        AsyncStorage.getItem.mockReset();
    });

    it('should load and display blogs correctly', async () => {
        // Mocking AsyncStorage to return a user ID
        AsyncStorage.getItem.mockResolvedValueOnce('1');

        // Mocking the database to return some blogs
        mockDb.getAllSync.mockReturnValueOnce([
            { id: 1, title: 'First Blog', text: 'This is the first blog.', username: 'User1', likeCount: 2, likedByUser: 0 },
            { id: 2, title: 'Second Blog', text: 'This is the second blog.', username: 'User2', likeCount: 0, likedByUser: 0 },
        ]);

        const { getByText } = render(
            <NavigationContainer>
                <ForumScreen />
            </NavigationContainer>
        );

        // Wait for blogs to load
        await waitFor(() => {
            expect(mockDb.getAllSync).toHaveBeenCalledWith(expect.any(String));
            expect(getByText('First Blog')).toBeTruthy();
            expect(getByText('Second Blog')).toBeTruthy();
        });
    });
});
