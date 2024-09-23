import React from 'react';
import renderer from 'react-test-renderer';
import ProfileScreen from '../../../app/(tabs)/profile';

// Mocking AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mocking SQLite
jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn(),
  })),
}));

// Mocking useNavigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Mocking ImagePicker
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

test('ProfileScreen renders correctly', () => {
  const tree = renderer.create(<ProfileScreen />).toJSON();
  expect(tree).toMatchSnapshot();
});
