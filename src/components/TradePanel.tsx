'use client';

import { useState } from 'react';
import TradeBalancePanel from './TradeBalancePanel';
import TradeHistoryPanel from './TradeHistoryPanel';
import TradeSendPanel from './TradeSendPanel';

const tabs = [
  { key: 'balance', label: '所持通貨' },
  { key: 'history', label: '履歴' },
  { key: 'send', label: '送信' },
] as const;

type TabKey = typeof tabs[number]['key'];

export default function TradePanel() {
  const [currentTab, setCurrentTab] = useState<TabKey>('balance');

  return (
    <div className="bg-white p-4 rounded shadow max-w-2xl mx-auto space-y-6">
      {/* タブメニュー */}
      <div className="flex border-b mb-4 space-x-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCurrentTab(tab.key)}
            className={`pb-2 ${
              currentTab === tab.key
                ? 'border-b-2 border-green-600 font-bold'
                : 'text-gray-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容切り替え */}
      <div>
        {currentTab === 'balance' && <TradeBalancePanel />}
        {currentTab === 'history' && <TradeHistoryPanel />}
        {currentTab === 'send' && <TradeSendPanel />}
      </div>
    </div>
  );
}
