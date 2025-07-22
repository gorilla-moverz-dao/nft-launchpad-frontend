import React, { useEffect, useRef } from "react";

/**
 * AnimatedGradientBackground
 * Renders a full-screen animated dark green gradient background that follows mouse movement.
 * Intended to be used as a background layer (z-index: -1).
 */
const AnimatedGradientBackground: React.FC = () => {
  const bgRef = useRef<HTMLDivElement>(null);
  // Track the current and target positions for smooth animation
  const pos = useRef({ x: 50, y: 50 });
  const target = useRef({ x: 50, y: 50 });
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      target.current = { x, y };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      // Smoothly interpolate towards the target
      pos.current.x += (target.current.x - pos.current.x) * 0.08;
      pos.current.y += (target.current.y - pos.current.y) * 0.08;
      if (bgRef.current) {
        bgRef.current.style.background = `radial-gradient(circle at ${pos.current.x}% ${pos.current.y}%,rgb(19, 61, 31) 0%, #0d2b16 80%, #07160b 100%)`;
      }
      animationFrame.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  return (
    <div
      ref={bgRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        transition: "background 0.2s",
        overflow: "hidden",
      }}
    >
      <style>
        {`
          @keyframes windSway {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(1deg); }
            75% { transform: rotate(-1deg); }
          }
          .wind-animation {
            animation: windSway 5s ease-in-out infinite;
            transform-origin: bottom center;
          }
          .wind-animation-slow {
            animation: windSway 8s ease-in-out infinite;
          }
          .banana-tree-mobile {
            width: 100vw;
          }
          @media (min-width: 640px) {
            .banana-tree-mobile {
              width: 70vw;  
            }
          }
        `}
      </style>
      {/* Banana tree left - visible on mobile and desktop */}
      <img
        src="/images/banana-tree.webp"
        alt="Banana Tree Left"
        className="fixed left-[-20px] bottom-0 z-0 pointer-events-none select-none wind-animation-slow sm:max-w-[35vw] sm:max-h-[60vh] sm:w-auto sm:h-auto banana-tree-mobile"
        style={{
          maxHeight: "100vh",
          maxWidth: "100vw",
          height: "100vh",
          opacity: 0.35,
          filter: "blur(0.5px)",
          objectFit: "cover",
          mixBlendMode: "lighten",
          transition: "opacity 0.3s",
          maskImage: "linear-gradient(to right, black 80%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 80%, transparent 100%)",
        }}
      />
      {/* Banana tree right - only visible on desktop */}
      <img
        src="/images/banana-tree.webp"
        alt="Banana Tree Right"
        className="hidden sm:block fixed right-0 bottom-0 z-0 pointer-events-none select-none wind-animation"
        style={{
          maxHeight: "90vh",
          maxWidth: "40vw",
          width: "auto",
          height: "auto",
          opacity: 0.35,
          filter: "blur(0.5px)",
          objectFit: "contain",
          mixBlendMode: "lighten",
          transform: "scaleX(-1)",
          transition: "opacity 0.3s",
          maskImage: "linear-gradient(to left, black 80%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to left, black 80%, transparent 100%)",
        }}
      />
    </div>
  );
};

export default AnimatedGradientBackground;
