import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const animVariants: gsap.TweenVars[] = [
  { opacity: 0, y: 40 },
  { opacity: 0, x: -50 },
  { opacity: 0, x: 50 },
  { opacity: 0, scale: 0.88 },
  { opacity: 0, y: 30, x: -25 },
  { opacity: 0, y: 30, x: 25 },
  { opacity: 0, y: -20 },
];

const groupVariants: gsap.TweenVars[] = [
  { opacity: 0, y: 35 },
  { opacity: 0, x: -45 },
  { opacity: 0, x: 45 },
  { opacity: 0, scale: 0.9 },
  { opacity: 0, y: 25, x: -20 },
  { opacity: 0, y: 25, x: 20 },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-anim]').forEach((el) => {
        gsap.from(el, {
          ...pickRandom(animVariants),
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            once: true,
          },
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-anim-group]').forEach((group) => {
        const items = group.querySelectorAll('[data-anim-item]');
        gsap.from(items, {
          ...pickRandom(groupVariants),
          duration: 0.65,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: group,
            start: 'top 88%',
            once: true,
          },
        });
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return ref;
}
