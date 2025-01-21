# Realtime Subscription Examples

## Basic Ticket Subscriptions

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Subscribe to all ticket changes
const subscribeToTickets = (onTicketChange: (payload: any) => void) => {
  const subscription = supabase
    .channel('tickets')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'tickets',
      },
      (payload) => onTicketChange(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Example usage
const unsubscribe = subscribeToTickets((payload) => {
  const { eventType, new: newRecord, old: oldRecord } = payload;
  
  switch (eventType) {
    case 'INSERT':
      console.log('New ticket created:', newRecord);
      break;
    case 'UPDATE':
      console.log('Ticket updated:', newRecord);
      console.log('Previous values:', oldRecord);
      break;
    case 'DELETE':
      console.log('Ticket deleted:', oldRecord);
      break;
  }
});

// Clean up subscription when done
unsubscribe();
```

## Filtered Ticket Subscriptions

```typescript
// Subscribe to specific ticket changes
const subscribeToTicket = (ticketId: string, onTicketChange: (payload: any) => void) => {
  const subscription = supabase
    .channel(`ticket-${ticketId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tickets',
        filter: `id=eq.${ticketId}`,
      },
      (payload) => onTicketChange(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Example usage
const unsubscribe = subscribeToTicket('123', (payload) => {
  const { new: newRecord, old: oldRecord } = payload;
  console.log('Ticket status changed from:', oldRecord.status, 'to:', newRecord.status);
});
```

## User Presence

```typescript
// Track user presence in a team or support channel
const trackPresence = (channelId: string, userId: string) => {
  const channel = supabase.channel(`presence-${channelId}`, {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      console.log('Current users:', state);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', key, leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ 
          online_at: new Date().toISOString(),
          user_id: userId 
        });
      }
    });

  return () => {
    channel.unsubscribe();
  };
};
```

## React Integration

```typescript
import { useEffect, useState } from 'react';

// Custom hook for ticket subscriptions
function useTicketSubscription(ticketId: string) {
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchTicket = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (!error && data) {
        setTicket(data);
      }
      setLoading(false);
    };

    fetchTicket();

    // Set up realtime subscription
    const unsubscribe = subscribeToTicket(ticketId, (payload) => {
      setTicket(payload.new);
    });

    return () => {
      unsubscribe();
    };
  }, [ticketId]);

  return { ticket, loading };
}

// Example component using the hook
function TicketDetails({ ticketId }: { ticketId: string }) {
  const { ticket, loading } = useTicketSubscription(ticketId);

  if (loading) return <div>Loading...</div>;
  if (!ticket) return <div>Ticket not found</div>;

  return (
    <div>
      <h1>{ticket.title}</h1>
      <p>Status: {ticket.status}</p>
      <p>Last updated: {new Date(ticket.updated_at).toLocaleString()}</p>
    </div>
  );
}

// Custom hook for user presence
function useTeamPresence(teamId: string, userId: string) {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});

  useEffect(() => {
    const channel = supabase.channel(`team-${teamId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineUsers(channel.presenceState());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ 
            online_at: new Date().toISOString(),
            user_id: userId 
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [teamId, userId]);

  return onlineUsers;
}

// Example component using presence
function TeamMembers({ teamId, userId }: { teamId: string; userId: string }) {
  const onlineUsers = useTeamPresence(teamId, userId);

  return (
    <div>
      <h2>Online Team Members</h2>
      <ul>
        {Object.entries(onlineUsers).map(([key, presence]) => (
          <li key={key}>
            User {presence.user_id} - Online since {new Date(presence.online_at).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
``` 