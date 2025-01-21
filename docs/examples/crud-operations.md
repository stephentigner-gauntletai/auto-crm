# CRUD Operation Examples

## Tickets

### List Tickets (with pagination and filtering)

```typescript
// Using fetch
const listTickets = async (params: {
  page?: number;
  limit?: number;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.status) searchParams.set('status', params.status);
  if (params.priority) searchParams.set('priority', params.priority);

  const response = await fetch(`/api/tickets?${searchParams.toString()}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch tickets');
  }

  return data;
};

// Example usage
try {
  const { data, pagination } = await listTickets({
    page: 1,
    limit: 10,
    status: 'open',
    priority: 'high'
  });
  console.log('Tickets:', data);
  console.log('Pagination:', pagination);
} catch (error) {
  console.error('Failed to fetch tickets:', error.message);
}
```

### Create Ticket

```typescript
// Using fetch
const createTicket = async (ticket: {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}) => {
  const response = await fetch('/api/tickets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ticket),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create ticket');
  }

  return data;
};

// Example usage
try {
  const { data } = await createTicket({
    title: 'System Error',
    description: 'Unable to access dashboard',
    priority: 'high'
  });
  console.log('Created ticket:', data);
} catch (error) {
  console.error('Failed to create ticket:', error.message);
}
```

### Update Ticket

```typescript
// Using fetch
const updateTicket = async (id: string, updates: {
  title?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}) => {
  const response = await fetch('/api/tickets', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...updates }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update ticket');
  }

  return data;
};

// Example usage
try {
  const { data } = await updateTicket('123', {
    status: 'in_progress',
    priority: 'urgent'
  });
  console.log('Updated ticket:', data);
} catch (error) {
  console.error('Failed to update ticket:', error.message);
}
```

### Delete Ticket

```typescript
// Using fetch
const deleteTicket = async (id: string) => {
  const response = await fetch(`/api/tickets?id=${id}`, {
    method: 'DELETE',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete ticket');
  }

  return data;
};

// Example usage
try {
  const { success } = await deleteTicket('123');
  console.log('Ticket deleted:', success);
} catch (error) {
  console.error('Failed to delete ticket:', error.message);
}
```

## Using React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// In your component
function TicketList() {
  // Fetch tickets
  const { data, isLoading, error } = useQuery({
    queryKey: ['tickets', { status: 'open' }],
    queryFn: () => listTickets({ status: 'open' })
  });

  // Create ticket mutation
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const handleCreate = async (newTicket) => {
    try {
      await createMutation.mutateAsync(newTicket);
      // Show success message
    } catch (err) {
      // Handle error
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.data.map(ticket => (
        <div key={ticket.id}>{ticket.title}</div>
      ))}
      <button 
        onClick={() => handleCreate({ title: 'New Ticket', description: 'Test' })}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
      </button>
    </div>
  );
}
``` 