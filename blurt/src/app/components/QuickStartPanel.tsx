import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { SessionSetupView } from '../../components/SessionSetupView';
import { useAppState } from '../state';

export const QuickStartPanel = () => {
  const navigate = useNavigate();
  const { templates, startSession, saveTemplate, updateTemplate, deleteTemplate, offlineReadOnly } = useAppState();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  return (
    <aside className="w-80 bg-white border-l border-neutral-200 p-8">
      <SessionSetupView
        variant="compact"
        templates={templates}
        startDisabled={offlineReadOnly || isStarting}
        startError={startError}
        onStart={async ({ title, prompt, durationSec }) => {
          setStartError(null);
          setIsStarting(true);
          try {
            const session = await startSession({ title, prompt, durationSec });
            navigate(`/session/${session.id}`);
          } catch (error) {
            setStartError(error instanceof Error ? error.message : 'Unable to start session right now.');
          } finally {
            setIsStarting(false);
          }
        }}
        onSaveTemplate={saveTemplate}
        onUpdateTemplate={updateTemplate}
        onDeleteTemplate={deleteTemplate}
      />
    </aside>
  );
};
