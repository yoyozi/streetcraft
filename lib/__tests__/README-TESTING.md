# Testing Documentation

## Overview
This directory contains comprehensive test suites for the Streetcraft application, following Test-Driven Development (TDD) principles. Tests are organized into basic unit tests and integration tests to ensure code quality and reliability.

---

## Test Structure

### 📁 Directory Organization
```
lib/__tests__/
├── basic/                  # Basic unit tests
│   ├── auth-basic.test.ts  # Authentication logic tests
│   ├── db-basic.test.ts    # Database connection tests
│   └── crafter-basic.test.ts # Crafter logic tests
├── integration/            # Integration tests
│   ├── auth-critical.test.ts  # Critical authentication flows
│   └── crafter-critical.test.ts # Critical crafter flows
├── actions/                # Server action tests (TDD)
│   ├── crafter.actions.test.ts # Crafter CRUD operations
│   ├── product.actions.test.ts # Product CRUD operations
│   └── product-image.actions.test.ts # Product image management
└── README-TESTING.md       # This file
```

---

## Test Suites

### 1. **Basic Authentication Tests** (`basic/auth-basic.test.ts`)
Tests core authentication logic without complex imports.

#### Test Groups:
- **Role Validation** (3 tests)
  - ✓ Validate admin role correctly
  - ✓ Validate user role correctly
  - ✓ Deny access for inactive users

- **Access Control Logic** (3 tests)
  - ✓ Allow admin to access admin routes
  - ✓ Deny user from accessing admin routes
  - ✓ Allow user to access user routes

- **Session Management** (2 tests)
  - ✓ Create valid session object
  - ✓ Handle admin session correctly

- **Authentication Flow Logic** (3 tests)
  - ✓ Validate correct credentials format
  - ✓ Reject invalid email format
  - ✓ Reject empty password

**Total: 11 tests**

---

### 2. **Basic Database Tests** (`basic/db-basic.test.ts`)
Tests database connectivity and configuration without complex imports.

#### Test Groups:
- **Connection String Validation** (3 tests)
  - ✓ Validate correct MongoDB URI format
  - ✓ Validate database name format
  - ✓ Construct connection string correctly

- **Environment Variable Validation** (3 tests)
  - ✓ Validate required environment variables
  - ✓ Validate NextAuth secret format
  - ✓ Validate NextAuth URL format

- **Database State Management** (2 tests)
  - ✓ Handle connection state transitions
  - ✓ Validate database name isolation

- **Error Handling Logic** (2 tests)
  - ✓ Handle invalid connection strings
  - ✓ Handle missing database name

**Total: 10 tests**

---

### 3. **Critical Authentication Integration Tests** (`integration/auth-critical.test.ts`)
Tests critical authentication flows with minimal dependencies, simulating real-world scenarios.

#### Test Groups:
- **Real Database Simulation** (2 tests)
  - ✓ Create and retrieve admin user from database simulation
  - ✓ Find user by email in database simulation

- **Authentication Flow Integration** (4 tests)
  - ✓ Authenticate admin user with valid credentials
  - ✓ Authenticate regular user with valid credentials
  - ✓ Reject authentication with invalid password
  - ✓ Reject authentication for inactive users

- **Role-Based Access Integration** (2 tests)
  - ✓ Grant admin access to admin routes
  - ✓ Deny regular user access to admin routes

- **Critical User Scenarios** (3 tests)
  - ✓ Handle user registration flow correctly
  - ✓ Handle password reset flow correctly
  - ✓ Create session after successful authentication

**Total: 11 tests**

---

### 4. **Basic Crafter Tests** (`basic/crafter-basic.test.ts`)
Tests core crafter management logic for admin-only operations.

#### Test Groups:
- **Crafter Data Validation** (4 tests)
  - ✓ Validate crafter has required fields
  - ✓ Validate crafter name is trimmed
  - ✓ Validate mobile number format
  - ✓ Validate location is required

- **Crafter Status Management** (4 tests)
  - ✓ Set crafter as active by default
  - ✓ Allow crafter to be deactivated
  - ✓ Allow crafter to be reactivated
  - ✓ Identify inactive crafters

- **Crafter Product Association** (5 tests)
  - ✓ Allow crafter to have multiple products
  - ✓ Allow crafter to have no products
  - ✓ Calculate product count correctly
  - ✓ Allow adding product to crafter
  - ✓ Allow removing product from crafter

- **Admin Access Control for Crafters** (5 tests)
  - ✓ Allow only admin to create crafter
  - ✓ Allow only admin to edit crafter
  - ✓ Allow only admin to activate/deactivate crafter
  - ✓ Allow admin to access crafter management routes
  - ✓ Deny regular user access to crafter management routes

- **Crafter Update Operations** (4 tests)
  - ✓ Allow updating crafter name
  - ✓ Allow updating crafter location
  - ✓ Allow updating crafter mobile
  - ✓ Allow updating multiple crafter fields

- **Crafter Listing Logic** (4 tests)
  - ✓ Filter crafters by active status
  - ✓ Sort crafters by name
  - ✓ Search crafters by name
  - ✓ Calculate total crafter count

**Total: 26 tests**

---

### 5. **Critical Crafter Integration Tests** (`integration/crafter-critical.test.ts`)
Tests critical crafter management flows with database simulation.

#### Test Groups:
- **Real Database Simulation** (3 tests)
  - ✓ Create and retrieve crafter from database simulation
  - ✓ Find crafter by name in database simulation
  - ✓ Retrieve all crafters from database simulation

- **Crafter Creation Flow Integration** (3 tests)
  - ✓ Allow admin to create crafter with valid data
  - ✓ Deny regular user from creating crafter
  - ✓ Create crafter with active status by default

- **Crafter Update Flow Integration** (2 tests)
  - ✓ Allow admin to update crafter details
  - ✓ Deny regular user from updating crafter

- **Crafter Activation/Deactivation Integration** (3 tests)
  - ✓ Allow admin to deactivate crafter
  - ✓ Allow admin to reactivate crafter
  - ✓ Deny regular user from deactivating crafter

- **Crafter Listing and Filtering Integration** (2 tests)
  - ✓ Filter and retrieve only active crafters
  - ✓ Calculate total and active crafter counts

- **Crafter-Product Association Integration** (2 tests)
  - ✓ Track number of products for crafter
  - ✓ Handle crafter with no products

- **Critical Crafter Scenarios** (2 tests)
  - ✓ Handle complete crafter creation workflow
  - ✓ Handle crafter status toggle workflow

**Total: 17 tests**

---

### 6. **Crafter Actions Tests** (`actions/crafter.actions.test.ts`)
TDD tests for crafter server actions with admin authorization.

#### Test Groups:
- **createCrafter** (4 tests)
  - ✓ Creates crafter when user is admin
  - ✓ Fails when user is not admin
  - ✓ Fails with invalid data
  - ✓ Handles validation errors gracefully

- **updateCrafter** (3 tests)
  - ✓ Updates crafter when user is admin
  - ✓ Fails when user is not admin
  - ✓ Fails when crafter does not exist

- **toggleCrafterStatus** (3 tests)
  - ✓ Toggles crafter status when user is admin
  - ✓ Fails when user is not admin
  - ✓ Fails when crafter does not exist

- **getAllCrafters** (3 tests)
  - ✓ Returns all crafters
  - ✓ Filters by active status
  - ✓ Returns empty array when no crafters exist

- **getCrafterById** (2 tests)
  - ✓ Returns crafter by ID
  - ✓ Returns null for non-existent crafter

- **deleteCrafter** (2 tests)
  - ✓ Deletes crafter when user is admin
  - ✓ Fails when user is not admin

**Total: 17 tests**

---

### 7. **Product Actions Tests** (`actions/product.actions.test.ts`)
TDD tests for product server actions with admin authorization and tag support.

#### Test Groups:
- **createProduct** (5 tests)
  - ✓ Creates product when user is admin
  - ✓ Fails when user is not admin
  - ✓ Fails with invalid data
  - ✓ Normalizes tags to lowercase
  - ✓ Validates required fields

- **updateProduct** (4 tests)
  - ✓ Updates product when user is admin
  - ✓ Fails when user is not admin
  - ✓ Fails when product does not exist
  - ✓ Updates tags correctly

- **deleteProduct** (3 tests)
  - ✓ Deletes product when user is admin
  - ✓ Fails when user is not admin
  - ✓ Fails when product does not exist

- **getAllProducts** (3 tests)
  - ✓ Returns all products with pagination
  - ✓ Filters products by search query
  - ✓ Handles empty results

- **getProductBySlug** (3 tests)
  - ✓ Returns product by slug
  - ✓ Returns null for non-existent slug
  - ✓ Includes tags in response

**Total: 18 tests**

---

### 8. **Product Image Management Tests** (`actions/product-image.actions.test.ts`)
TDD tests for UploadThing image upload and deletion integration.

#### Test Groups:
- **deleteProductImages** (6 tests)
  - ✓ Deletes images from UploadThing
  - ✓ Extracts file keys from URLs correctly
  - ✓ Handles empty image array
  - ✓ Handles non-UploadThing URLs gracefully
  - ✓ Handles UploadThing API errors
  - ✓ Validates UploadThing URL format

- **deleteProduct with Image Cleanup** (7 tests)
  - ✓ Deletes product and its images
  - ✓ Deletes product even if image deletion fails
  - ✓ Handles product with no images
  - ✓ Handles mixed image sources
  - ✓ Only deletes UploadThing images
  - ✓ Fails when user is not admin
  - ✓ Fails when product does not exist

- **Image URL Validation** (2 tests)
  - ✓ Identifies UploadThing URLs correctly
  - ✓ Identifies non-UploadThing URLs correctly

- **Batch Image Deletion** (1 test)
  - ✓ Handles multiple products with images

- **Error Handling & Edge Cases** (5 tests)
  - ✓ Handles malformed URLs
  - ✓ Handles large image arrays (100+)
  - ✓ Handles null/undefined arrays
  - ✓ Graceful error degradation
  - ✓ Product deletion succeeds despite image errors

**Total: 21 tests**

---

## Test Suite Summary

### By Category:
- **Basic Tests**: 48 tests (auth + db + crafter)
- **Integration Tests**: 28 tests (auth + crafter critical)
- **Action Tests**: 56 tests (crafter + product + image management)

### Total Test Count: **132 tests**

### Coverage Areas:
- ✅ Authentication & Authorization
- ✅ Database Operations
- ✅ Crafter Management (CRUD)
- ✅ Product Management (CRUD)
- ✅ Image Upload & Deletion (UploadThing)
- ✅ Admin Access Control
- ✅ Data Validation
- ✅ Error Handling

---

## Test Commands

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Tests in CI Mode
```bash
npm run test:ci
```

### Run Specific Test File
```bash
npm test -- auth-basic.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="admin"
```

### Run Tests in Specific Directory
```bash
npm test -- basic/
npm test -- integration/
npm test -- actions/
```

### Run Specific Action Tests
```bash
npm test -- crafter.actions.test.ts
npm test -- product.actions.test.ts
npm test -- product-image.actions.test.ts
```

---

## Coverage Commands

### Generate Coverage Report
```bash
npm run test:coverage
```

### View Coverage in Browser
After running coverage, open:
```
coverage/lcov-report/index.html
```

### Coverage Thresholds
Current configuration aims for:
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

---

## Additional Commands

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### Build Application
```bash
npm run build
```

### Run Development Server
```bash
npm run dev
```

---

## Test Statistics

### Total Test Count: **75 tests**
- Basic Authentication: 11 tests
- Basic Database: 10 tests
- Basic Crafter: 26 tests
- Critical Authentication Integration: 11 tests
- Critical Crafter Integration: 17 tests

### Test Categories:
- **Unit Tests**: 47 tests (basic/)
- **Integration Tests**: 28 tests (integration/)

---

## Writing New Tests

### Test File Naming Convention
- Basic tests: `*.test.ts` in `basic/` folder
- Integration tests: `*.test.ts` in `integration/` folder

### Test Structure Template
```typescript
describe('Feature Name', () => {
  describe('Specific Functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test data'
      
      // Act
      const result = functionToTest(input)
      
      // Assert
      expect(result).toBe(expected)
    })
  })
})
```

---

## Best Practices

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use Descriptive Test Names**: Clearly state what is being tested
3. **Test One Thing**: Each test should verify a single behavior
4. **Mock External Dependencies**: Use mocks for database, APIs, etc.
5. **Keep Tests Independent**: Tests should not depend on each other
6. **Clean Up After Tests**: Use `beforeEach` and `afterEach` hooks

---

## Troubleshooting

### Tests Not Running
- Ensure Jest is installed: `npm install`
- Check Jest configuration in `package.json` or `jest.config.js`

### Import Errors
- Verify TypeScript paths in `tsconfig.json`
- Check module resolution settings

### Coverage Not Generated
- Run: `npm run test:coverage`
- Check `coverage/` directory is created

---

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: npm run test:ci

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [TDD Best Practices](https://testdriven.io/)

---

**Last Updated**: 2025-11-12


