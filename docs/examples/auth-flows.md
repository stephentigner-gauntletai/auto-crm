# Authentication Flow Examples

## Sign In

```typescript
// Using fetch
const signIn = async (email: string, password: string) => {
  const response = await fetch('/api/auth/sign-in', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to sign in');
  }

  return data;
};

// Example usage
try {
  const { user, session } = await signIn('user@example.com', 'password123');
  console.log('Signed in as:', user.email);
} catch (error) {
  console.error('Sign in failed:', error.message);
}
```

## Sign Up

```typescript
// Using fetch
const signUp = async (email: string, password: string, fullName: string) => {
  const response = await fetch('/api/auth/sign-up', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      email, 
      password,
      full_name: fullName 
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create account');
  }

  return data;
};

// Example usage
try {
  const { user } = await signUp('newuser@example.com', 'password123', 'John Doe');
  console.log('Account created for:', user.email);
} catch (error) {
  console.error('Sign up failed:', error.message);
}
```

## Password Reset

```typescript
// Request password reset
const requestReset = async (email: string) => {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to request password reset');
  }

  return data;
};

// Example usage
try {
  await requestReset('user@example.com');
  console.log('Password reset instructions sent');
} catch (error) {
  console.error('Password reset request failed:', error.message);
}
```

## Using React Hooks

```typescript
import { useAuth } from '@/hooks/auth/useAuth';

// In your component
function LoginForm() {
  const { signIn, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = 'user@example.com';
    const password = 'password123';

    try {
      await signIn({ email, password });
      // Redirect or show success message
    } catch (err) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      {error && <div className="error">{error.message}</div>}
    </form>
  );
}
``` 