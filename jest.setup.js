import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill TextEncoder/TextDecoder for Node.js test environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill Request for Next.js server components
global.Request = class Request {
  constructor(input, init) {
    this.url = typeof input === 'string' ? input : input.url
    this.method = init?.method || 'GET'
    this.headers = new Map(Object.entries(init?.headers || {}))
  }
}

// Mock NextAuth providers
jest.mock('next-auth/providers/credentials', () => ({
  CredentialsProvider: jest.fn(),
}))

jest.mock('next-auth/providers/google', () => ({
  GoogleProvider: jest.fn(),
}))

jest.mock('next-auth/providers/facebook', () => ({
  FacebookProvider: jest.fn(),
}))

// Mock NextAuth react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      }
    },
    status: 'authenticated'
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Mock NextAuth actions
jest.mock('next-auth', () => ({
  auth: jest.fn(() => Promise.resolve({
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user'
    }
  })),
  NextAuth: jest.fn(),
}))

// Mock bcrypt-ts-edge to prevent ES module errors
jest.mock('bcrypt-ts-edge', () => ({
  hashSync: jest.fn((password) => `hashed_${password}`),
  compareSync: jest.fn(() => true),
  genSaltSync: jest.fn(() => 'test-salt'),
}))

// Mock query-string to prevent ES module errors
jest.mock('query-string', () => ({
  parse: jest.fn((str) => ({})),
  stringify: jest.fn((obj) => ''),
  parseUrl: jest.fn((url) => ({ url, query: {} })),
}))

// Create a default auth mock that can be overridden in tests
const mockAuth = jest.fn(() => Promise.resolve({
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user'
  }
}))

// Mock @/auth module to prevent bcrypt-ts-edge loading
jest.mock('@/auth', () => ({
  auth: mockAuth,
  signIn: jest.fn(),
  signOut: jest.fn(),
  handlers: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
}))

// Mock auth-actions to use the same auth mock
jest.mock('@/lib/actions/auth-actions', () => ({
  auth: mockAuth,
}))

// Mock MongoDB connection
jest.mock('./lib/mongodb/connection', () => ({
  connectDB: jest.fn(() => Promise.resolve()),
}))

// Mock MongoDB models with proper structure
jest.mock('./lib/mongodb/models', () => ({
  connectDB: jest.fn(() => Promise.resolve()),
  Category: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
  Product: {
    create: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
  User: {
    create: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  },
  Crafter: {
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
  },
}))

// Mock UploadThing UTApi
jest.mock('uploadthing/server', () => ({
  UTApi: jest.fn().mockImplementation(() => ({
    deleteFiles: jest.fn().mockResolvedValue({ success: true }),
  })),
}))

// Mock constants - must use a function to access requireActual
jest.mock('./lib/constants', () => {
  const actual = jest.requireActual('./lib/constants')
  return {
    ...actual,
    signInDefaultValues: {
      email: '',
      password: ''
    },
  }
})

// Mock mongoose to prevent BSON module loading
jest.mock('mongoose', () => {
  const mockSchema = jest.fn(function() {
    return {
      virtual: jest.fn(() => ({
        get: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
      })),
      index: jest.fn().mockReturnThis(),
      pre: jest.fn().mockReturnThis(),
      post: jest.fn().mockReturnThis(),
    }
  })
  
  mockSchema.Types = {
    ObjectId: 'ObjectId',
    String: String,
    Number: Number,
    Boolean: Boolean,
    Date: Date,
  }
  
  return {
    connect: jest.fn(() => Promise.resolve()),
    connection: {
      readyState: 1,
    },
    Schema: mockSchema,
    model: jest.fn(),
    models: {},
  }
})

// Set test environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.MONGODB_DB = 'streetcraft_test'
