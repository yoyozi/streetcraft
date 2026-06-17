const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV;

const ENV_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  staging:  { label: '⚠ STAGING — Test keys active. Payments are not real.', bg: 'bg-yellow-400', text: 'text-yellow-950' },
  testing:  { label: '🧪 TEST MODE — This site is under testing. Not live.', bg: 'bg-orange-500', text: 'text-white' },
  dev:      { label: '🛠 DEVELOPMENT — Local dev build.',                    bg: 'bg-blue-600',   text: 'text-white' },
};

export default function EnvBanner() {
  if (!APP_ENV || APP_ENV === 'production') return null;

  const config = ENV_CONFIG[APP_ENV] ?? {
    label: `⚠ ENV: ${APP_ENV} — Not production`,
    bg: 'bg-gray-700',
    text: 'text-white',
  };

  return (
    <div className={`w-full ${config.bg} ${config.text} text-center text-sm font-semibold py-2 px-4 z-50 sticky top-0`}>
      {config.label}
    </div>
  );
}
