interface RealtimeUpdate {
  type: 'job_status' | 'notification' | 'analytics';
  data: any;
  timestamp: number;
  id: string;
}

// In-memory store for real-time updates (use Redis in production)
const realtimeUpdates = new Map<string, RealtimeUpdate[]>();
const maxUpdatesPerOrg = 100;

export function addJobUpdate(organizationId: string, jobData: any) {
  const update: RealtimeUpdate = {
    type: 'job_status',
    data: jobData,
    timestamp: Date.now(),
    id: Math.random().toString(36).slice(2)
  };

  const orgUpdates = realtimeUpdates.get(organizationId) || [];
  orgUpdates.push(update);

  if (orgUpdates.length > maxUpdatesPerOrg) {
    orgUpdates.splice(0, orgUpdates.length - maxUpdatesPerOrg);
  }

  realtimeUpdates.set(organizationId, orgUpdates);
}

export function addNotification(organizationId: string, notification: any) {
  const update: RealtimeUpdate = {
    type: 'notification',
    data: notification,
    timestamp: Date.now(),
    id: Math.random().toString(36).slice(2)
  };

  const orgUpdates = realtimeUpdates.get(organizationId) || [];
  orgUpdates.push(update);

  if (orgUpdates.length > maxUpdatesPerOrg) {
    orgUpdates.splice(0, orgUpdates.length - maxUpdatesPerOrg);
  }

  realtimeUpdates.set(organizationId, orgUpdates);
}

export function getUpdates(organizationId: string): RealtimeUpdate[] {
  return realtimeUpdates.get(organizationId) || [];
}

export function addUpdate(organizationId: string, update: RealtimeUpdate) {
  const orgUpdates = realtimeUpdates.get(organizationId) || [];
  orgUpdates.push(update);

  if (orgUpdates.length > maxUpdatesPerOrg) {
    orgUpdates.splice(0, orgUpdates.length - maxUpdatesPerOrg);
  }

  realtimeUpdates.set(organizationId, orgUpdates);
}
