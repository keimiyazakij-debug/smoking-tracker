export default {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/unit', '<rootDir>/storage', '<rootDir>/ui','<rootDir>/integration'],
  testMatch: ['**/*.test.js'],
  clearMocks: true,
  transform: {}
};
