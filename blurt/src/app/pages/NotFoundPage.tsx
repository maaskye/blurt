import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div className="max-w-3xl rounded-xl border border-neutral-200 bg-white p-8">
      <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Page not found</h2>
      <p className="text-neutral-600 mb-4">The page you requested does not exist.</p>
      <Link className="text-purple-600 font-medium" to="/">
        Return home
      </Link>
    </div>
  );
};
