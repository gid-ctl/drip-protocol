import { useState, useEffect } from "react";

export function useSimulatedLoading(duration = 800) {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);
  return isLoading;
}
