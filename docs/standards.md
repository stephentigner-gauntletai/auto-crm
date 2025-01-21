# Coding Standards

## TypeScript Guidelines

### Type Definitions
- Use TypeScript's built-in types where possible (`string`, `number`, `boolean`, etc.)
- Define interfaces for object shapes and types for unions/aliases
- Use `type` for unions, intersections, and mapped types
- Use `interface` for object shapes that might be extended
```typescript
// Good
interface UserProps {
  id: string;
  name: string;
  email: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';
```

### Type Safety
- Avoid using `any` - use `unknown` if type is truly unknown
- Enable strict mode in `tsconfig.json`
- Use type assertions sparingly, prefer type guards
- Define return types for functions with complex logic

## Component Structure

### File Organization
```typescript
// 1. Imports
import { useState } from 'react';

// 2. Type definitions
interface Props {
  // ...
}

// 3. Helper functions/constants
const ITEMS_PER_PAGE = 10;

// 4. Component definition
export function ComponentName({ prop1, prop2 }: Props) {
  // 4.1 Hooks
  const [state, setState] = useState();

  // 4.2 Derived state/computations
  const computed = useMemo(() => {}, []);

  // 4.3 Event handlers
  const handleClick = () => {};

  // 4.4 Render
  return (
    // JSX
  );
}
```

### Component Guidelines
- Use function components with hooks
- Keep components focused and single-responsibility
- Extract reusable logic into custom hooks
- Use composition over inheritance
- Implement proper error boundaries
- Use semantic HTML elements

## File Naming Conventions

### Components
- Use PascalCase for component files: `Button.tsx`, `UserProfile.tsx`
- Use kebab-case for utility files: `use-auth.ts`, `api-client.ts`
- Group related components in folders: `components/forms/`, `components/layout/`

### File Structure
```
src/
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── forms/       # form-related components
│   └── layout/      # layout components
├── hooks/           # custom hooks
├── lib/            # utilities and helpers
├── types/          # shared type definitions
└── app/            # Next.js app router pages
```

## Import Ordering

Order imports in the following sequence:
```typescript
// 1. React and Next.js imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// 2. External libraries
import { motion } from 'framer-motion';
import { format } from 'date-fns';

// 3. Internal components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 4. Internal utilities/hooks
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

// 5. Types
import type { User } from '@/types';

// 6. Assets/styles
import './styles.css';
```

## Code Style

### General
- Use semicolons
- Use single quotes for strings
- Use template literals for string interpolation
- Use meaningful variable names
- Keep functions small and focused
- Add comments for complex logic
- Use early returns to reduce nesting

### Formatting
- Use Prettier for consistent formatting
- Use ESLint for code quality
- Use tabs for indentation (tab width: 4)
- 100-character line length limit
- Use semicolons
- Use single quotes
- Use trailing commas in objects and arrays (es5)
- Use spaces in brackets
- Empty line between logical blocks 