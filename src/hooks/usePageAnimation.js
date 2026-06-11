import { useContext, useLayoutEffect } from 'react';
import { AnimationContext } from '../components/animations/AnimationContext';

export default function usePageAnimation(config) {
  const { setOverride, clearOverride } = useContext(AnimationContext);
  useLayoutEffect(() => {
    setOverride(config);
    return () => clearOverride();
  }, []);
}