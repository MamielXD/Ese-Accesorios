import { Toaster } from 'react-hot-toast';

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#f9fafb', // bg-stone-50
          color: '#1f2937', // text-neutral-800
          border: '1px solid #e5e7eb', // border-stone-200
          fontWeight: 300,
          padding: '8px 12px',
          borderRadius: '4px',
        },
      }}
    />
  );
}
