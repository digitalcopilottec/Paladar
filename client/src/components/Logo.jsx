import React from 'react';

/**
 * Logo oficial do Paladar em SVG (nítido em qualquer tamanho, sem arquivo).
 *
 * Variações da identidade:
 *   light  — círculo branco, texto vermelho, chapéu com contorno preto (principal)
 *   red    — círculo vermelho, tudo branco
 *   black  — círculo preto, tudo branco
 *
 * `compact` mostra só o chapéu — em marcas pequenas (menos de ~44px) o texto
 * "Paladar" fica ilegível, então é melhor não exibi-lo.
 */
const CORES = {
  light: { bg: '#ffffff', text: '#C1272D', hatStroke: '#1a1a1a', hatFill: '#ffffff', ring: null },
  red:   { bg: '#8E1117', text: '#ffffff', hatStroke: '#ffffff', hatFill: 'none', ring: '#ffffff' },
  black: { bg: '#0b0b0d', text: '#ffffff', hatStroke: '#ffffff', hatFill: 'none', ring: '#ffffff' },
};

// Extensões possíveis do logo enviado — tenta na ordem e desiste em silêncio.
const TENTATIVAS = ['/uploads/logo.png', '/uploads/logo.jpg', '/uploads/logo.webp'];

export default function Logo({ variant = 'red', compact = false, className = '' }) {
  const c = CORES[variant] || CORES.light;
  const [ix, setIx] = React.useState(0);

  // Se o lojista enviou o logo original, ele manda — o SVG abaixo é só reserva.
  if (ix < TENTATIVAS.length) {
    return (
      <img className={className} src={TENTATIVAS[ix]} alt="Paladar Restaurante"
        style={{ objectFit: 'cover', borderRadius: '50%' }}
        onError={() => setIx(i => i + 1)} />
    );
  }

  return (
    <svg viewBox="0 0 200 200" className={className}
      role="img" aria-label="Paladar Restaurante">
      <circle cx="100" cy="100" r="100" fill={c.bg} />
      {c.ring && (
        <circle cx="100" cy="100" r="92" fill="none" stroke={c.ring} strokeWidth="2.4" />
      )}

      {/* Chapéu de chef */}
      <g transform={compact ? 'translate(48,56) scale(0.52)' : 'translate(26,14) scale(0.33)'}
        fill={c.hatFill} stroke={c.hatStroke} strokeWidth="14"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M52 94 C20 94 20 54 52 50 C47 21 95 12 106 37
                 C140 21 172 55 150 85 C167 93 156 108 140 101 L60 101
                 C47 105 45 91 52 94 Z" />
        <path d="M63 101 L63 131 Q101 145 139 131 L139 101" fill="none" />
        <path d="M87 105 L86 137 M105 106 L105 141 M123 105 L125 136" fill="none" />
      </g>

      {!compact && (
        <>
          {/* "Restaurante" fica encaixado sob o começo de "Paladar", como no original */}
          <text x="102" y="128" textAnchor="middle" fill={c.text}
            fontFamily="'Pacifico', 'Snell Roundhand', cursive" fontSize="50">
            Paladar
          </text>
          <text x="76" y="150" textAnchor="middle" fill={c.text}
            fontFamily="'Pacifico', 'Snell Roundhand', cursive" fontSize="18">
            Restaurante
          </text>
        </>
      )}
    </svg>
  );
}
