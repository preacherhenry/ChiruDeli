import { describe, it, expect } from 'vitest';
import {
  assertValidOrderTransition,
  canCustomerCancel,
} from '../src/lib/orderStateMachine';
import { InvalidStatusTransitionError } from '../src/lib/errors';

describe('assertValidOrderTransition', () => {
  it('allows the documented happy-path sequence', () => {
    const sequence: Array<[string, string]> = [
      ['PENDING_CONFIRMATION', 'CONFIRMED'],
      ['CONFIRMED', 'PREPARING'],
      ['PREPARING', 'READY_FOR_PICKUP'],
      ['READY_FOR_PICKUP', 'RIDER_ASSIGNED'],
      ['RIDER_ASSIGNED', 'PICKED_UP'],
      ['PICKED_UP', 'ON_THE_WAY'],
      ['ON_THE_WAY', 'DELIVERED'],
    ];
    for (const [from, to] of sequence) {
      expect(() => assertValidOrderTransition(from as never, to as never)).not.toThrow();
    }
  });

  it('rejects skipping states', () => {
    expect(() => assertValidOrderTransition('PENDING_CONFIRMATION' as never, 'PREPARING' as never)).toThrow(
      InvalidStatusTransitionError,
    );
  });

  it('rejects moving a terminal order', () => {
    expect(() => assertValidOrderTransition('DELIVERED' as never, 'CANCELLED' as never)).toThrow(
      InvalidStatusTransitionError,
    );
  });

  it('allows cancellation before preparation starts', () => {
    expect(() => assertValidOrderTransition('CONFIRMED' as never, 'CANCELLED' as never)).not.toThrow();
  });

  it('rejects cancellation once the order is on the way', () => {
    expect(() => assertValidOrderTransition('ON_THE_WAY' as never, 'CANCELLED' as never)).toThrow(
      InvalidStatusTransitionError,
    );
  });
});

describe('canCustomerCancel', () => {
  it('is true only before preparation starts', () => {
    expect(canCustomerCancel('PENDING_CONFIRMATION' as never)).toBe(true);
    expect(canCustomerCancel('CONFIRMED' as never)).toBe(true);
    expect(canCustomerCancel('PREPARING' as never)).toBe(false);
    expect(canCustomerCancel('ON_THE_WAY' as never)).toBe(false);
  });
});
