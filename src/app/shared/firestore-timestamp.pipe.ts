import { Pipe, PipeTransform } from '@angular/core';

/**
 * Convert Firestore Timestamp objects to JavaScript Date objects.
 * Handles Firestore Timestamps, regular Dates, and numeric timestamps.
 * 
 * Usage: {{ firebaseTimestamp | fsTimestamp | date: 'medium' }}
 */
@Pipe({
  name: 'fsTimestamp',
  standalone: true
})
export class FirestoreTimestampPipe implements PipeTransform {
  transform(value: any): Date {
    if (!value) return new Date();

    // Handle Firestore Timestamp objects
    if (value.toDate && typeof value.toDate === 'function') {
      return value.toDate();
    }

    // Handle regular Date objects
    if (value instanceof Date) {
      return value;
    }

    // Handle numeric timestamps (milliseconds)
    if (typeof value === 'number') {
      return new Date(value);
    }

    return new Date();
  }
}
