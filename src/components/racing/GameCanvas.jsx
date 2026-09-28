import { useEffect, useRef } from "react";
import "./GameCanvas.css";

/**
 * Owns nothing but the <canvas> element and keeping its backing store
 * sized to its container. All drawing happens in GameEngine via the ref
 * passed up through onReady -- this component never touches game state.
 */
export function GameCanvas({ onReady }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = container.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    onReady(canvas);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="game-canvas" ref={containerRef}>
      <canvas ref={canvasRef} aria-label="Race track view" role="img" />
    </div>
  );
}
