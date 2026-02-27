interface LocalModeLinkProps {
  onClick: () => void;
}

export function LocalModeLink({ onClick }: LocalModeLinkProps) {
  return (
    <div className="text-center">
      <button
        type="button"
        onClick={onClick}
        className="text-sm text-neutral-600 hover:text-purple-600 transition-colors underline underline-offset-2"
      >
        Use local mode instead
      </button>
    </div>
  );
}
