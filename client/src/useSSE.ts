import { useState, useEffect, useCallback, useRef } from 'react';
import type { Report, InboxMessage } from './types';

interface SSEEvent {
  type: 'new-report' | 'new-message';
  data: Report | InboxMessage;
}

export function useSSE() {
  const [newReportCount, setNewReportCount] = useState(0);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reportKeyRef = useRef(0);
  const messageKeyRef = useRef(0);
  const [reportRefreshKey, setReportRefreshKey] = useState(0);
  const [messageRefreshKey, setMessageRefreshKey] = useState(0);

  useEffect(() => {
    const es = new EventSource('/events');
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const parsed: SSEEvent = JSON.parse(event.data);

      if (parsed.type === 'new-report') {
        setNewReportCount((c) => c + 1);
        reportKeyRef.current += 1;
        setReportRefreshKey(reportKeyRef.current);
        const report = parsed.data as Report;
        showNotification('New Report', `${report.agent}: ${report.title}`);
      } else if (parsed.type === 'new-message') {
        setNewMessageCount((c) => c + 1);
        messageKeyRef.current += 1;
        setMessageRefreshKey(messageKeyRef.current);
        const message = parsed.data as InboxMessage;
        showNotification(
          'New Message',
          `From ${message.from}: ${message.subject}`,
        );
      }
    };

    return () => es.close();
  }, []);

  const clearReportBadge = useCallback(() => setNewReportCount(0), []);
  const clearMessageBadge = useCallback(() => setNewMessageCount(0), []);

  return {
    newReportCount,
    newMessageCount,
    clearReportBadge,
    clearMessageBadge,
    reportRefreshKey,
    messageRefreshKey,
  };
}

function showNotification(title: string, body: string) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'default') {
    Notification.requestPermission();
    return; // Don't show on first prompt
  }

  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}
