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
        src="/assets/images/Gemini_Generated_Image_v4c5hrv4c5hrv4c5.jpg"
        alt="LiAfrik OS"
        width={sizes[size].img}
        height={sizes[size].img}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: sizes[size].img, height: sizes[size].img }}
      />
      {!iconOnly && (
        <span className={`font-semibold ${sizes[size].text} ${white ? 'text-white' : 'text-gray-900'} tracking-tight`}>
          LiAfrik <span className="text-green-600">OS</span>
        </span>
      )}
    </div>
  );
}
