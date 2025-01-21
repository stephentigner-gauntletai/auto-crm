# API Guidelines

## Error Handling

### Standard Error Response Format

```typescript
interface ApiError {
  code: string;        // Machine-readable error code
  message: string;     // Human-readable error message
  details?: unknown;   // Optional additional error details
  status: number;      // HTTP status code
}
```

### Common Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Authenticated but insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate entry)
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Error Code Examples

```typescript
// Example error responses for different scenarios
const errors = {
  INVALID_CREDENTIALS: {
    code: 'auth/invalid-credentials',
    message: 'Invalid email or password',
    status: 401
  },
  INSUFFICIENT_PERMISSIONS: {
    code: 'auth/insufficient-permissions',
    message: 'You do not have permission to perform this action',
    status: 403
  },
  RATE_LIMIT_EXCEEDED: {
    code: 'rate-limit/exceeded',
    message: 'Too many requests. Please try again later',
    status: 429
  }
};
```

### Error Handling Best Practices

1. **Consistent Format**
   - Always return errors in the standard format
   - Include appropriate HTTP status codes
   - Use consistent error codes across the API

2. **Meaningful Messages**
   - Provide clear, actionable error messages
   - Include relevant details for debugging
   - Avoid exposing sensitive information

3. **Validation Errors**
   ```typescript
   // Example validation error response
   {
     code: 'validation/invalid-input',
     message: 'Invalid input data',
     status: 422,
     details: {
       email: ['Invalid email format'],
       password: ['Must be at least 8 characters']
     }
   }
   ```

## Rate Limiting

### Configuration

```typescript
const rateLimits = {
  // General API endpoints
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5 // limit each IP to 5 requests per windowMs
  },
  
  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50 // limit each IP to 50 uploads per windowMs
  }
};
```

### Response Headers

```typescript
// Rate limit headers included in all responses
{
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '99',
  'X-RateLimit-Reset': '1640995200'
}
```

### Rate Limit Exceeded Response

```typescript
{
  code: 'rate-limit/exceeded',
  message: 'Rate limit exceeded. Try again in 59 minutes',
  status: 429,
  details: {
    retryAfter: 3540, // seconds until reset
    limit: 100,
    remaining: 0,
    reset: 1640995200
  }
}
```

## Authentication

### Best Practices

1. **Token Management**
   - Use short-lived access tokens
   - Implement secure token refresh mechanism
   - Store tokens securely (httpOnly cookies)

2. **Session Security**
   ```typescript
   // Example session configuration
   const sessionConfig = {
     maxAge: 7 * 24 * 60 * 60, // 7 days
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'strict'
   };
   ```

3. **Authorization Headers**
   ```typescript
   // Example authorization header
   {
     'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
   }
   ```

## API Best Practices

1. **Versioning**
   - Include version in URL path: `/api/v1/tickets`
   - Support multiple versions simultaneously
   - Deprecate old versions with notice

2. **Pagination**
   ```typescript
   // Example pagination parameters
   interface PaginationParams {
     page?: number;
     limit?: number;
     cursor?: string;
   }

   // Example pagination response
   interface PaginatedResponse<T> {
     data: T[];
     pagination: {
       total: number;
       page: number;
       limit: number;
       hasMore: boolean;
       nextCursor?: string;
     }
   }
   ```

3. **Filtering and Sorting**
   ```typescript
   // Example query parameters
   interface QueryParams {
     sort?: string;        // e.g., 'created_at:desc'
     filter?: {
       status?: string[];
       priority?: string;
       team_id?: string;
     };
     search?: string;
   }
   ```

4. **Response Envelope**
   ```typescript
   // Consistent response format
   interface ApiResponse<T> {
     data?: T;
     error?: ApiError;
     meta?: {
       pagination?: PaginationMeta;
       [key: string]: unknown;
     }
   }
   ``` 