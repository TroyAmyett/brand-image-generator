/**
 * Audit Log Service
 * Logs account linking and key management events for compliance and debugging
 */

export type AuditEventType =
  | 'account_linked'
  | 'account_unlinked'
  | 'keys_migrated'
  | 'link_attempted'
  | 'link_failed'
  | 'unlink_attempted'
  | 'unlink_failed';

export interface AuditLogEntry {
  event: AuditEventType;
  timestamp: string;
  canvasUserId?: string;
  agentpmUserId?: string;
  agentpmEmail?: string;
  details?: Record<string, unknown>;
  error?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 * In production, this would write to a database or external logging service
 */
export function logAuditEvent(entry: Omit<AuditLogEntry, 'timestamp'>): void {
  const fullEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // Log to console in structured format
  console.log('[AUDIT]', JSON.stringify(fullEntry));

  // In production, you would also:
  // 1. Write to a database table (e.g., audit_logs in Supabase)
  // 2. Send to an external logging service (e.g., Datadog, Sentry)
  // 3. Emit to an event stream for real-time monitoring

  // Example Supabase insert (commented out as we may not have the table):
  // await supabase.from('audit_logs').insert(fullEntry);
}

/**
 * Log account linking attempt
 */
export function logLinkAttempt(canvasUserId: string, canvasEmail?: string): void {
  logAuditEvent({
    event: 'link_attempted',
    canvasUserId,
    details: { canvasEmail },
  });
}

/**
 * Log successful account link
 */
export function logLinkSuccess(
  canvasUserId: string,
  agentpmUserId: string,
  agentpmEmail?: string
): void {
  logAuditEvent({
    event: 'account_linked',
    canvasUserId,
    agentpmUserId,
    agentpmEmail,
  });
}

/**
 * Log failed account link
 */
export function logLinkFailure(
  canvasUserId: string,
  error: string,
  details?: Record<string, unknown>
): void {
  logAuditEvent({
    event: 'link_failed',
    canvasUserId,
    error,
    details,
  });
}

/**
 * Log account unlink attempt
 */
export function logUnlinkAttempt(canvasUserId: string): void {
  logAuditEvent({
    event: 'unlink_attempted',
    canvasUserId,
  });
}

/**
 * Log successful account unlink
 */
export function logUnlinkSuccess(canvasUserId: string): void {
  logAuditEvent({
    event: 'account_unlinked',
    canvasUserId,
  });
}

/**
 * Log failed account unlink
 */
export function logUnlinkFailure(canvasUserId: string, error: string): void {
  logAuditEvent({
    event: 'unlink_failed',
    canvasUserId,
    error,
  });
}

/**
 * Log key migration
 */
export function logKeysMigrated(
  canvasUserId: string,
  providers: string[],
  migratedCount: number
): void {
  logAuditEvent({
    event: 'keys_migrated',
    canvasUserId,
    details: {
      providers,
      migratedCount,
    },
  });
}
