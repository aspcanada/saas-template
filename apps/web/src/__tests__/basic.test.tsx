import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple test component
const TestComponent = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h1>{title}</h1>
    {children}
  </div>
);

describe('Basic React Test', () => {
  it('should render a simple component', () => {
    render(
      <TestComponent title="Hello World">
        <p>This is a test</p>
      </TestComponent>
    );
    
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('This is a test')).toBeInTheDocument();
  });

  it('should handle user interactions', () => {
    const Button = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
      <button onClick={onClick}>{children}</button>
    );
    
    const handleClick = jest.fn();
    
    render(
      <Button onClick={handleClick}>
        Click me
      </Button>
    );
    
    const button = screen.getByText('Click me');
    expect(button).toBeInTheDocument();
    
    button.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should handle form inputs', () => {
    const Input = ({ value, onChange, placeholder }: { 
      value: string; 
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
      placeholder: string;
    }) => (
      <input value={value} onChange={onChange} placeholder={placeholder} />
    );
    
    const handleChange = jest.fn();
    
    render(
      <Input 
        value="test value" 
        onChange={handleChange} 
        placeholder="Enter text" 
      />
    );
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveValue('test value');
  });
});
