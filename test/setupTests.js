// setupTests.js
beforeAll(() => {
    // Silencia todos los console.error en los tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterAll(() => {
    // Restaura el comportamiento original
    console.error.mockRestore();
  });
  