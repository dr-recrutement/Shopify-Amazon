interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  white?: boolean;
}

export function Logo({ size = 'md', iconOnly = false, white = false }: LogoProps) {
  const sizes = {
    sm: { img: 28, text: 'text-base' },
    md: { img: 36, text: 'text-xl' },
    lg: { img: 48, text: 'text-2xl' },
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
        style={{ width: sizes[size].img, height: sizes[size].img, background: 'linear-gradient(135deg, #008060 0%, #004C3F 100%)' }}
      >
        <span style={{ fontSize: sizes[size].img * 0.5 }}>O</span>
      </div>
      {!iconOnly && (
        <span translate="no" lang="und" className={`notranslate font-bold ${sizes[size].text} ${white ? 'text-white' : 'text-gray-900'} tracking-tight`}>
          Os <span className="text-brand-600">🛒</span>
        </span>
      )}
    </div>
  );
}
