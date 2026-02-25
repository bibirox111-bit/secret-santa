export interface SecretSantaEvent {
  id: string;
  name: string;
  description: string;
  organizerId: string;
  organizerName: string;
  participants: EventParticipant[];
  participantIds?: string[]; // Array of UIDs for Firestore rule checks
  status: 'pending' | 'active' | 'drawing' | 'completed';
  createdAt: number;
  draws?: EventAssignment[];
  minParticipants: number;
  invites?: EventInvite[];
}

export interface EventParticipant {
  userId: string;
  email: string;
  displayName: string;
  joinedAt: number;
}

export interface EventInvite {
  userId?: string;
  email: string;
  displayName?: string;
  invitedAt: number;
  status: 'pending' | 'accepted' | 'declined';
}

export interface EventAssignment {
  from: string;
  fromName: string;
  to: string;
  toName: string;
}
