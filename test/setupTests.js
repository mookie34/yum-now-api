// setupTests.js

// Mock authenticate middleware to bypass JWT in tests
jest.mock('../middleware/authenticate', () => {
  return (req, res, next) => {
    req.admin = { username: 'admin' };
    next();
  };
});

beforeAll(() => {
    // Silence all console.error calls in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore original behavior
    console.error.mockRestore();
  });
