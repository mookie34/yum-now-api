// setupTests.js

// Mock authenticate middleware to bypass JWT in tests
jest.mock('../middleware/authenticate', () => {
  return (req, res, next) => {
    req.admin = { username: 'admin' };
    next();
  };
});

beforeAll(() => {
    // Silencia todos los console.error en los tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restaura el comportamiento original
    console.error.mockRestore();
  });
  