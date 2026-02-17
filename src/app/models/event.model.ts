export interface SecretSantaEvent {
  id: string;
  name: string;
  description: string;
  organizerId: string;
  organizerName: string;
  participants: EventParticipant[];
  status: 'pending' | 'active' | 'drawing' | 'completed';
  createdAt: number;
  draws?: EventAssignment[];
  minParticipants: number;
}

export interface EventParticipant {
  userId: string;
  email: string;
  displayName: string;
  joinedAt: number;
}

export interface EventAssignment {
  from: string;
  fromName: string;
  to: string;
  toName: string;
}
