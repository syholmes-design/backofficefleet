import type { DispatchEvent } from "@/components/dispatch-v2/types";

export function logDispatchEvent(event: DispatchEvent): DispatchEvent {
  // Create a complete audit event with timestamp
  const auditEvent: DispatchEvent = {
    dispatcherId: event.dispatcherId || "DS-001", // Default dispatcher ID
    timestamp: event.timestamp || new Date().toISOString(),
    loadId: event.loadId,
    driverId: event.driverId,
    checklistState: event.checklistState,
    modalVerification: event.modalVerification,
    trackingActivated: event.trackingActivated,
    dispatchSuccess: event.dispatchSuccess
  };

  // Demo-safe behavior: log to console and store in localStorage
  console.info('📋 DISPATCH AUDIT EVENT:', auditEvent);
  
  // Store in localStorage for demo persistence
  try {
    const existingEvents = localStorage.getItem('bof-dispatch-audit');
    const events = existingEvents ? JSON.parse(existingEvents) : [];
    events.push(auditEvent);
    
    // Keep only last 100 events to prevent storage bloat
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    localStorage.setItem('bof-dispatch-audit', JSON.stringify(events));
  } catch (error) {
    console.warn('Failed to store audit event in localStorage:', error);
  }

  // In a real implementation, this would send to a secure audit server
  // For demo purposes, we just log and return the event
  
  return auditEvent;
}

export function getDispatchAuditEvents(): DispatchEvent[] {
  try {
    const existingEvents = localStorage.getItem('bof-dispatch-audit');
    return existingEvents ? JSON.parse(existingEvents) : [];
  } catch (error) {
    console.warn('Failed to retrieve audit events from localStorage:', error);
    return [];
  }
}

export function clearDispatchAuditEvents(): void {
  try {
    localStorage.removeItem('bof-dispatch-audit');
    console.info('Dispatch audit events cleared');
  } catch (error) {
    console.warn('Failed to clear audit events from localStorage:', error);
  }
}
