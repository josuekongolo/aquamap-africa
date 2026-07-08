'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleCheck, CloudUpload } from 'lucide-react';
import { useLang } from '../context/LangContext';
import OperatorForm from '../components/OperatorForm';

// Registration page — thin wrapper around the shared OperatorForm (also used
// for editing at /operators/[id]/edit). Handles the success screen, including
// the offline-queued variant.
export default function Register() {
  const { t, lang } = useLang();
  const [done, setDone] = useState(null); // null | { queued }
  const fr = lang === 'fr';

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="mb-4 flex justify-center">
            {done.queued
              ? <CloudUpload className="w-16 h-16" style={{ color: '#F4A261' }} />
              : <CircleCheck className="w-16 h-16" style={{ color: '#00A878' }} />}
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: done.queued ? '#F4A261' : '#00A878' }}>
            {done.queued
              ? (fr ? 'Enregistré hors ligne ✓' : 'Saved offline ✓')
              : t.register.success}
          </h2>
          <p className="text-gray-600 mb-8">
            {done.queued
              ? (fr
                  ? "L'opérateur est stocké sur cet appareil et sera synchronisé automatiquement à la reconnexion."
                  : 'The operator is stored on this device and will sync automatically when you reconnect.')
              : t.register.successSub}
          </p>
          <Link
            href="/dashboard"
            className="inline-block text-white font-bold px-8 py-3 rounded-xl"
            style={{ backgroundColor: '#0D6B8A' }}
          >
            {t.register.dashboard}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8 text-black">{t.register.title}</h1>
        <OperatorForm onSaved={setDone} />
      </div>
    </div>
  );
}
