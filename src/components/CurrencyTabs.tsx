// src/components/CurrencyTabs.tsx
'use client';

import { useState } from 'react';
import CurrencyIssueForm from './CurrencyIssueForm';
import CurrencyManagePanel from './CurrencyManagePanel';

export default function CurrencyTabs() {
  const [tab, setTab] = useState<'manage' | 'issue'>('manage');

  return (
    <div className="max-w-xl mx-auto mt-6">
      <div className="flex border-b mb-4">
        <button
          onClick={() => setTab('manage')}
          className={`px-4 py-2 ${tab === 'manage' ? 'border-b-2 border-green-600 font-bold' : 'text-gray-500'}`}
        >
          管理
        </button>
        <button
          onClick={() => setTab('issue')}
          className={`px-4 py-2 ${tab === 'issue' ? 'border-b-2 border-green-600 font-bold' : 'text-gray-500'}`}
        >
          発行
        </button>
      </div>

      {tab === 'issue' ? <CurrencyIssueForm /> : <CurrencyManagePanel />}
    </div>
  );
}
