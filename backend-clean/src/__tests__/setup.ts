// Test setup file
import { jest } from '@jest/globals';

// Mock Supabase client
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn()
    }))
  }
}));

// Mock crypto module for consistent testing
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('1234567890abcdef', 'hex')),
  createHash: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => 'mockedhash1234567890abcdef')
    }))
  }))
}));

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};