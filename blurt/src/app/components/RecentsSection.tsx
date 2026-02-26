import { ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRemaining, useAppState } from '../state';

export const RecentsSection = () => {
  const navigate = useNavigate();
  const { latestSession, sessions } = useAppState();

  const continueLatest = () => {
    if (!latestSession) {
      return;
    }
    navigate(latestSession.endedAtMs ? `/session/${latestSession.id}/review` : `/session/${latestSession.id}`);
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Recents</h2>

      {latestSession ? (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 mb-8 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">{latestSession.title}</h3>
              <p className="text-sm text-neutral-500 mb-3">{latestSession.prompt || 'No prompt provided'}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-neutral-700 font-medium">{latestSession.notes.length} Blurts</span>
                <span className="text-purple-600 font-medium">{formatRemaining(latestSession)}</span>
              </div>
            </div>
            <button
              onClick={continueLatest}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No recent sessions</h3>
          <p className="text-sm text-neutral-500">Start a new session from Quick Start.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 mb-8">
        <div className="flex gap-6">
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center cursor-pointer hover:shadow-md transition-all">
              <Plus className="w-10 h-10 text-purple-600" />
            </div>
          </div>

          <div className="w-px bg-neutral-200" />

          <div className="flex-1 grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <button
                key={i}
                className="aspect-square rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50 hover:border-purple-200 flex items-center justify-center transition-all group"
              >
                <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-purple-600 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Past Sessions</h3>
        {sessions.length === 0 && <p className="text-neutral-500">No sessions yet.</p>}
        <div className="space-y-2">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => navigate(session.endedAtMs ? `/session/${session.id}/review` : `/session/${session.id}`)}
              className="w-full text-left px-4 py-3 rounded-lg border border-neutral-200 hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <strong className="text-neutral-900">{session.title}</strong>
                <span className="text-xs text-neutral-400">{new Date(session.startedAtMs).toLocaleString()}</span>
              </div>
              <div className="text-sm text-neutral-500">{session.notes.length} notes</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
