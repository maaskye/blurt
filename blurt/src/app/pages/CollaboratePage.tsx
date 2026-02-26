import { Users } from 'lucide-react';
import { useAppState } from '../state';

export const CollaboratePage = () => {
  const { templates, sessions } = useAppState();

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Collaborate</h2>

      <div className="mb-8 bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="text-sm font-semibold text-neutral-700 mb-4">Template Packs</h3>
        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded-lg border border-neutral-200 p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900">{template.name}</p>
                <p className="text-sm text-neutral-500">{template.durationSecDefault / 60} min default</p>
              </div>
              <Users className="w-4 h-4 text-purple-500" />
            </div>
          ))}
          {templates.length === 0 && <p className="text-sm text-neutral-500">No templates yet.</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="text-sm font-semibold text-neutral-700 mb-4">Shared-Ready Sessions</h3>
        <div className="space-y-3">
          {sessions.slice(0, 6).map((session) => (
            <div key={session.id} className="rounded-lg border border-neutral-200 p-4">
              <p className="font-medium text-neutral-900">{session.title}</p>
              <p className="text-sm text-neutral-500">{session.notes.length} blurts • {session.endedAtMs ? 'Completed' : 'Active'}</p>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-sm text-neutral-500">No sessions yet.</p>}
        </div>
      </div>
    </div>
  );
};
