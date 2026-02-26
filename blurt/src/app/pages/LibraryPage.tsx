import { FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../state';

export const LibraryPage = () => {
  const { sessions } = useAppState();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Your Library</h2>
      <div className="grid grid-cols-2 gap-4">
        {sessions.map((session) => (
          <button
            key={session.id}
            className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-all cursor-pointer group text-left"
            onClick={() => navigate(session.endedAtMs ? `/session/${session.id}/review` : `/session/${session.id}`)}
          >
            <div className="flex items-start justify-between mb-3">
              <FolderOpen className="w-5 h-5 text-purple-600" />
              <span className="text-xs text-neutral-400">{new Date(session.startedAtMs).toLocaleDateString()}</span>
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2 group-hover:text-purple-700 transition-colors">{session.title}</h3>
            <div className="text-sm text-neutral-500">{session.notes.length} blurts</div>
          </button>
        ))}
      </div>
      {sessions.length === 0 && <p className="text-neutral-500">No sessions yet.</p>}
    </div>
  );
};
