

export const COLORS = {
  canvas: {
    porcelain: '#1a1410', // Dark Chocolate Background (Primary)
    fog: '#2a2420', // Lighter Dark Chocolate (Secondary/Card)
    white: '#FFFFFF',
    pureBlack: '#000000',
  },
  text: {
    primary: '#FDFBF7', // Off-White Text on Dark
    secondary: '#A8A29E', // Muted Grey
    inverse: '#1a1410', // Dark Text on Light Accents
  },
  accents: {
    electricLime: '#E1FF29', // Slime Green (Punchier)
    bleuGrey: '#FF0099', // Hot Pink (Dragonfruit)
    internationalOrange: '#00FFFF', // Electric Cyan
    lavender: '#CEB3FF', // Soft Lilac (Contrast)
    mint: '#70FFC2', // Bio Mint
    orange: '#FF5500', // Safety Orange
    coral: '#FF6B6B', // Pop Coral
    gold: '#FFD700', // Star Gold
    hotPink: '#FF0099', // Dragonfruit
  }
};

export const TYPOGRAPHY = {
  headings: {
    fontFamily: 'System',
    fontWeight: '900' as const, // Ultra Black
    letterSpacing: -1,
  },
  body: {
    fontFamily: 'System', // Keep system for readability
    fontWeight: '500' as const,
  },
  micro: {
    fontFamily: 'System',
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  }
};

export const EVENT_FONTS = {
  fancy: {
    fontFamily: 'Georgia',
    fontWeight: '300' as const,
    fontStyle: 'italic' as const,
  },
  literary: {
    fontFamily: 'Georgia',
    fontWeight: '400' as const,
  },
  digital: {
    fontFamily: 'Courier',
    fontWeight: 'bold' as const,
    letterSpacing: 1,
  },
  sleek: {
    fontFamily: 'System',
    fontWeight: '200' as const,
    letterSpacing: 0.5,
  },
  elegant: {
    fontFamily: 'System',
    fontWeight: '100' as const,
    letterSpacing: 1,
  },
  simple: {
    fontFamily: 'System',
    fontWeight: '700' as const,
  },
  phosphate: {
    fontFamily: 'System',
    fontWeight: '900' as const,
    letterSpacing: 1,
  },
};

export const DESIGN = {
  borders: {
    radius: {
      pill: 999,
      squircle: 32, // Signature Shape
      small: 12,
    },
    width: 2,
  },
  shadows: {
    softHigh: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 12,
    },
    softLow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    pop: { // Hard Shadow for Sticker effect
      shadowColor: '#000000',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.8,
      shadowRadius: 0,
      elevation: 4,
    }
  }
};
