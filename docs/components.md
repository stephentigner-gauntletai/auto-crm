# Component Documentation

## UI Components

### Button
```tsx
import { Button } from "@/components/ui/button"

// Default button
<Button>Click me</Button>

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
```

Props:
- `variant`: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
- `size`: 'default' | 'sm' | 'lg' | 'icon'
- `asChild`: boolean - Allows button to be rendered as a different element
- All standard button HTML attributes

### Form
```tsx
import { useForm } from "react-hook-form"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

// Example usage
function ProfileForm() {
  const form = useForm()
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Your display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
```

Components:
- `Form`: The root form component
- `FormField`: Connects form fields to react-hook-form
- `FormItem`: Wrapper for form field components
- `FormLabel`: Label for form fields
- `FormControl`: Wrapper for form controls
- `FormDescription`: Description text for form fields
- `FormMessage`: Displays validation messages

### Dialog
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Example usage
<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description goes here.</DialogDescription>
    </DialogHeader>
    <div>Dialog content</div>
  </DialogContent>
</Dialog>
```

Props:
- `open`: boolean - Controlled open state
- `onOpenChange`: (open: boolean) => void - Called when open state changes
- All Radix UI Dialog props are supported

## Theme Customization

Components use CSS variables for theming, defined in `globals.css`. Key customization points:

### Colors
```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  /* ... other color variables ... */
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... dark mode colors ... */
}
```

### Border Radius
```css
:root {
  --radius: 0.5rem;
}
```

To customize a component's appearance:
1. Use the `className` prop for one-off styling
2. Modify CSS variables for global changes
3. Use Tailwind's configuration for systematic changes

## Best Practices

1. Always use semantic HTML elements
2. Maintain accessibility by using proper ARIA attributes
3. Follow the component composition patterns
4. Use the provided theme variables for consistency
5. Test components in both light and dark modes 