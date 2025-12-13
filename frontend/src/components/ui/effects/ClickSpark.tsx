import { useRef, useEffect, useCallback } from 'react';

/**
 * ClickSpark - Global click spark effect component
 *
 * Canvas-based implementation for optimal performance.
 * Creates geometric particles on every click globally.
 *
 * Features:
 * - Canvas rendering (GPU-accelerated, performant)
 * - Global click detection
 * - Automatic cleanup via requestAnimationFrame
 * - Responsive to window resize
 * - Doesn't interfere with inputs
 */

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
  color: string;
}

const SPARK_COLORS = [
  '#f97316', // orange-500 (primary)
  '#ea580c', // orange-600
  '#000000', // black
  '#ef4444', // red-500
  '#facc15', // yellow-400
];

export function ClickSpark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const animationIdRef = useRef<number | null>(null);

  // Configuration (can be customized later)
  const sparkSize = 12; // Length of spark line
  const sparkRadius = 30; // Distance sparks travel
  const sparkCount = 8; // Number of sparks per click
  const duration = 500; // Animation duration in ms
  const lineWidth = 3; // Thick lines

  // Ease-out function for smooth deceleration
  const easeOut = useCallback((t: number) => t * (2 - t), []);

  // Resize canvas to match window size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparksRef.current = sparksRef.current.filter((spark: Spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) {
          return false; // Remove finished spark
        }

        const progress = elapsed / duration;
        const eased = easeOut(progress);

        // Calculate spark position
        const distance = eased * sparkRadius;
        const lineLength = sparkSize * (1 - eased); // Shrink as it moves

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        // Draw spark line with thick stroke
        ctx.strokeStyle = spark.color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'square'; // Sharp ends
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        return true; // Keep spark
      });

      animationIdRef.current = requestAnimationFrame(draw);
    };

    animationIdRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [sparkSize, sparkRadius, duration, easeOut, lineWidth]);

  // Global click handler
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Don't create sparks on input elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const x = e.clientX;
      const y = e.clientY;
      const now = performance.now();

      // Create sparks in a circle pattern
      const newSparks: Spark[] = Array.from({ length: sparkCount }, (_, i) => ({
        x,
        y,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: now,
        color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
      }));

      sparksRef.current.push(...newSparks);
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [sparkCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
