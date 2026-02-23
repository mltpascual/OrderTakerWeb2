import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { Loader2, ArrowDown } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  /** Minimum pull distance in px to trigger refresh (default: 80) */
  threshold?: number;
}

export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
}: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (refreshing) return;
      // Only enable pull-to-refresh when scrolled to top
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > 5) return;

      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    },
    [refreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPullingRef.current || refreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      if (diff > 0) {
        // Apply resistance: the further you pull, the harder it gets
        const distance = Math.min(diff * 0.5, threshold * 1.8);
        setPullDistance(distance);
        setPulling(true);

        // Prevent default scroll when pulling down
        if (distance > 10) {
          e.preventDefault();
        }
      } else {
        setPulling(false);
        setPullDistance(0);
      }
    },
    [refreshing, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      setPullDistance(threshold * 0.6); // Hold at a smaller distance during refresh
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
        setPulling(false);
      }
    } else {
      setPullDistance(0);
      setPulling(false);
    }
  }, [pullDistance, threshold, refreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pulling || refreshing;

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200 ease-out"
        style={{
          height: showIndicator ? `${pullDistance}px` : "0px",
          opacity: showIndicator ? 1 : 0,
        }}
      >
        {refreshing ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <div
            className="flex flex-col items-center gap-1"
            style={{
              transform: `rotate(${progress * 180}deg)`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <ArrowDown
              className="w-5 h-5 text-muted-foreground"
              style={{ opacity: progress }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          transform: showIndicator ? `translateY(0)` : "none",
          transition: pulling ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
