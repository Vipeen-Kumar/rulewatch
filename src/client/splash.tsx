import './index.css';

import { navigateTo } from '@devvit/web/client';
import { context, requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export const Splash = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6">
      <h1 className="text-5xl font-bold mb-4">RuleWatch</h1>

      <p className="text-xl mb-8 text-center">
        Smart moderation workflow assistant
      </p>

      <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">User Moderation Info</h2>

        <p className="mb-2">Username: bad_user123</p>

        <p className="mb-2">Warnings: 2</p>

        <p className="mb-6">Last Reason: Spam Links</p>

        <div className="flex gap-4">
          <button className="bg-red-500 px-4 py-2 rounded-xl">Warn User</button>

          <button className="bg-blue-500 px-4 py-2 rounded-xl">Add Note</button>
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
