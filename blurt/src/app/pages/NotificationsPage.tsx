import { Bell, CheckCircle2 } from 'lucide-react';
import { useAppState } from '../state';

export const NotificationsPage = () => {
  const { sessions, templates } = useAppState();

  const events = [
    ...sessions.slice(0, 6).map((session) => ({
      id: `session-${session.id}`,
      title: session.endedAtMs ? 'Session completed' : 'Session in progress',
      message: `${session.title} • ${session.notes.length} blurts`,
      time: new Date(session.endedAtMs ?? session.startedAtMs).toLocaleString(),
      read: Boolean(session.endedAtMs)
    })),
    ...templates.slice(0, 3).map((template) => ({
      id: `template-${template.id}`,
      title: 'Template updated',
      message: template.name,
      time: new Date(template.updatedAtMs).toLocaleString(),
      read: true
    }))
  ];

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Notifications</h2>
      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className={`bg-white rounded-xl border p-5 ${event.read ? 'border-neutral-200' : 'border-purple-200 bg-purple-50/30'}`}
          >
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                {event.read ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-neutral-900 mb-1">{event.title}</h4>
                <p className="text-sm text-neutral-600 mb-2">{event.message}</p>
                <span className="text-xs text-neutral-400">{event.time}</span>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-neutral-500">No notifications yet.</p>}
      </div>
    </div>
  );
};
