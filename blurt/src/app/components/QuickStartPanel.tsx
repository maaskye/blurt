import { useNavigate } from 'react-router-dom';
import { SessionSetupView } from '../../components/SessionSetupView';
import { useAppState } from '../state';

export const QuickStartPanel = () => {
  const navigate = useNavigate();
  const { templates, startSession, saveTemplate, updateTemplate, deleteTemplate } = useAppState();

  return (
    <aside className="w-80 bg-white border-l border-neutral-200 p-8">
      <SessionSetupView
        variant="compact"
        templates={templates}
        onStart={({ title, prompt, durationSec }) => {
          void (async () => {
            const session = await startSession({ title, prompt, durationSec });
            navigate(`/session/${session.id}`);
          })();
        }}
        onSaveTemplate={saveTemplate}
        onUpdateTemplate={updateTemplate}
        onDeleteTemplate={deleteTemplate}
      />
    </aside>
  );
};
