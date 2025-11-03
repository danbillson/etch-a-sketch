"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface DrawingKnobProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  keyboardKeys: { increment: string; decrement: string };
  className?: string;
}

export function DrawingKnob({
  value,
  onChange,
  label,
  keyboardKeys,
  className,
}: DrawingKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartAngle, setTouchStartAngle] = useState(0);
  const [touchStartValue, setTouchStartValue] = useState(0);
  const [touchVelocity, setTouchVelocity] = useState(0);
  const [lastTouchTime, setLastTouchTime] = useState(0);
  const [lastTouchAngle, setLastTouchAngle] = useState(0);
  const momentumRef = useRef<number | null>(null);

  // Spring animation for smooth rotation
  const rotation = useMotionValue(value * 360);
  const springRotation = useSpring(rotation, {
    stiffness: 300,
    damping: 30,
  });

  // Update rotation when value changes
  useEffect(() => {
    rotation.set(value * 360);
  }, [value, rotation]);

  // Transform rotation to CSS degrees
  const rotateZ = useTransform(springRotation, (r) => `${r}deg`);

  // Calculate angle from center point
  const getAngleFromCenter = (clientX: number, clientY: number): number => {
    if (!knobRef.current) return 0;
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current);
      momentumRef.current = null;
    }
    setIsDragging(true);
    const touch = e.touches[0];
    const angle = getAngleFromCenter(touch.clientX, touch.clientY);
    setTouchStartAngle(angle);
    setTouchStartValue(value);
    setLastTouchAngle(angle);
    setLastTouchTime(Date.now());
    setTouchVelocity(0);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const angle = getAngleFromCenter(touch.clientX, touch.clientY);
    const now = Date.now();
    const timeDelta = now - lastTouchTime;
    
    if (timeDelta > 0) {
      const angleDelta = angle - lastTouchAngle;
      // Normalize angle delta to [-180, 180]
      let normalizedDelta = angleDelta;
      if (normalizedDelta > 180) normalizedDelta -= 360;
      if (normalizedDelta < -180) normalizedDelta += 360;
      
      const velocity = normalizedDelta / timeDelta;
      setTouchVelocity(velocity);
    }
    
    setLastTouchAngle(angle);
    setLastTouchTime(now);

    // Calculate rotation delta
    let angleDelta = angle - touchStartAngle;
    // Normalize to [-180, 180]
    if (angleDelta > 180) angleDelta -= 360;
    if (angleDelta < -180) angleDelta += 360;

    // Convert to value change (full rotation = 1.0)
    const valueDelta = angleDelta / 360;
    const newValue = Math.max(0, Math.min(1, touchStartValue + valueDelta));
    onChange(newValue);
  };

  // Handle touch end with momentum
  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Apply momentum with friction
    if (Math.abs(touchVelocity) > 0.1) {
      const friction = 0.95;
      let currentVelocity = touchVelocity;
      let currentValue = value;

      const applyMomentum = () => {
        if (Math.abs(currentVelocity) < 0.05) {
          momentumRef.current = null;
          return;
        }

        // Convert velocity to value change
        const valueDelta = currentVelocity * 0.002; // Scaling factor
        currentValue = Math.max(0, Math.min(1, currentValue + valueDelta));
        onChange(currentValue);

        // Apply friction
        currentVelocity *= friction;

        momentumRef.current = requestAnimationFrame(applyMomentum);
      };

      momentumRef.current = requestAnimationFrame(applyMomentum);
    }
  };

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === keyboardKeys.increment || e.key === keyboardKeys.decrement) {
        e.preventDefault();
        const delta = e.key === keyboardKeys.increment ? 0.01 : -0.01;
        const newValue = Math.max(0, Math.min(1, value + delta));
        onChange(newValue);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keyboardKeys, value, onChange]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className || ""}`}>
      {label && <div className="text-xs text-muted-foreground">{label}</div>}
      <motion.div
        ref={knobRef}
        className="relative w-20 h-20 cursor-grab active:cursor-grabbing touch-none select-none"
        style={{ rotateZ }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Knob base */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-900 shadow-lg border-2 border-gray-400 dark:border-gray-600" />
        
        {/* Concentric rings */}
        <div className="absolute inset-2 rounded-full border-2 border-gray-400 dark:border-gray-600" />
        <div className="absolute inset-4 rounded-full border border-gray-300 dark:border-gray-700" />
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-gray-600 dark:bg-gray-400" />
        </div>
        
        {/* Rotation indicator */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-3 rounded-full bg-red-500 dark:bg-red-400" />
      </motion.div>
    </div>
  );
}

