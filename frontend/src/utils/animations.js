/**
 * Framer Motion Animation Variants
 * Premium, playful animations for the book marketplace
 */

// ===== FADE ANIMATIONS =====
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
};

export const fadeInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
};

// ===== SCALE ANIMATIONS =====
export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
};

export const scaleInCenter = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { duration: 0.35, ease: [0.68, -0.55, 0.265, 1.55] }
};

// ===== SLIDE ANIMATIONS =====
export const slideInLeft = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
};

export const slideInRight = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
};

export const slideInUp = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
};

export const slideInDown = {
  initial: { y: '-100%' },
  animate: { y: 0 },
  exit: { y: '-100%' },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
};

// ===== STAGGER ANIMATIONS (for lists/grids) =====
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

// ===== CARD HOVER EFFECTS =====
export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  tap: { scale: 0.98 }
};

export const bookCardHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  tap: { scale: 0.95 }
};

// ===== BUTTON ANIMATIONS =====
export const buttonHover = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95 }
};

export const buttonRipple = {
  initial: { scale: 0, opacity: 0.5 },
  animate: {
    scale: 2,
    opacity: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

// ===== PAGE TRANSITIONS =====
export const pageTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
};

export const pageFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
};

// ===== MODAL/DRAWER ANIMATIONS =====
export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
};

export const drawerSlide = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
};

// ===== IMAGE ANIMATIONS =====
export const imageZoom = {
  rest: { scale: 1 },
  hover: {
    scale: 1.1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

export const imageParallax = (speed = 0.5) => ({
  initial: { y: 0 },
  animate: (scrollY) => ({
    y: scrollY * speed,
    transition: { duration: 0 }
  })
});

// ===== NOTIFICATION/TOAST ANIMATIONS =====
export const toastSlideIn = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
};

// ===== DROPDOWN/ACCORDION ANIMATIONS =====
export const dropdownExpand = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: 'auto',
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

export const accordionExpand = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

// ===== NUMBER COUNTER ANIMATION =====
export const counterAnimation = (from, to, duration = 1) => ({
  initial: { value: from },
  animate: {
    value: to,
    transition: { duration, ease: 'easeOut' }
  }
});

// ===== SCROLL REVEAL =====
export const scrollReveal = {
  offscreen: {
    opacity: 0,
    y: 50
  },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// ===== CUSTOM SPRING CONFIGS =====
export const springConfig = {
  gentle: { type: 'spring', stiffness: 100, damping: 15 },
  bouncy: { type: 'spring', stiffness: 300, damping: 10 },
  smooth: { type: 'spring', stiffness: 200, damping: 20 },
  snappy: { type: 'spring', stiffness: 400, damping: 25 }
};

// ===== HELPER FUNCTIONS =====

/**
 * Create stagger animation for children
 */
export const createStagger = (staggerDelay = 0.1, delayStart = 0) => ({
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: delayStart
    }
  }
});

/**
 * Create custom fade with specific direction and distance
 */
export const createFade = (direction = 'up', distance = 20, duration = 0.4) => {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance }
  };

  return {
    initial: { opacity: 0, ...directions[direction] },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, ...directions[direction] },
    transition: { duration, ease: [0.25, 0.46, 0.45, 0.94] }
  };
};

/**
 * Create hover lift effect with custom values
 */
export const createHoverLift = (yOffset = -4, scale = 1.02, duration = 0.3) => ({
  rest: { y: 0, scale: 1 },
  hover: {
    y: yOffset,
    scale,
    transition: { duration, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  tap: { scale: 0.98 }
});

/**
 * Scroll-triggered animation hook helper
 */
export const scrollTriggerVariants = {
  hidden: { opacity: 0, y: 75 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// ===== EASING CURVES =====
export const easings = {
  elegant: [0.25, 0.46, 0.45, 0.94],
  smooth: [0.45, 0.05, 0.55, 0.95],
  bounce: [0.68, -0.55, 0.265, 1.55],
  inOut: [0.4, 0, 0.2, 1],
  in: [0.4, 0, 1, 1],
  out: [0, 0, 0.2, 1]
};
