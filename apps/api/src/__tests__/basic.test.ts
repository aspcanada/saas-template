// Basic test to verify Jest is working
describe('Basic Jest Test', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const greeting = 'Hello, World!';
    expect(greeting).toContain('World');
    expect(greeting.length).toBeGreaterThan(0);
  });

  it('should handle array operations', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers).toHaveLength(5);
    expect(numbers).toContain(3);
    expect(numbers.filter(n => n > 3)).toEqual([4, 5]);
  });

  it('should handle object operations', () => {
    const user = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com'
    };
    
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name', 'John Doe');
    expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});
