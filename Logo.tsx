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
      <img
        src="/logo.png"
        alt="Sellia"
        width={sizes[size].img}
        height={sizes[size].img}
        className="flex-shrink-0 object-contain"
        style={{ width: sizes[size].img, height: sizes[size].img, filter: white ? 'brightness(0) invert(1)' : undefined }}
      />
      {!iconOnly && (
        <span translate="no" lang="und" className={`notranslate font-bold ${sizes[size].text} ${white ? 'text-white' : 'text-gray-900'} tracking-tight`}>
          Sellia
        </span>
      )}
    </div>
  );
}
