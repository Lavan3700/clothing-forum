import React from 'react';
import renderer from 'react-test-renderer';
import CreatePostScreen from '../../../app/new-forum-page';

// Mocking AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mocking SQLite
jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(() => ({
    execSync: jest.fn(),
  })),
}));

// Mocking ImagePicker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));

test('CreatePostScreen renders correctly', () => {
  const tree = renderer.create(<CreatePostScreen />).toJSON();
  expect(tree).toMatchSnapshot();
});
