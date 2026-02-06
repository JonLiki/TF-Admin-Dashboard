'use client';

import React from 'react';
import { useSpring, animated } from 'react-spring';

interface AnimatedNumberProps {
    value: number;
    toFixed?: number;
    className?: string;
    delay?: number;
}

export function AnimatedNumber({ value, toFixed = 0, className, delay = 0 }: AnimatedNumberProps) {
    const { number } = useSpring({
        from: { number: 0 },
        to: { number: value },
        delay: delay,
        config: { mass: 1, tension: 20, friction: 10, clamp: true }
    });

    return (
        <animated.span className={className}>
            {number.to(n => n.toFixed(toFixed))}
        </animated.span>
    );
}

export function FadeIn({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) {
    const props = useSpring({
        to: { opacity: 1, transform: 'translateY(0px)' },
        from: { opacity: 0, transform: 'translateY(10px)' },
        delay,
        config: { duration: 500 }
    });

    return <animated.div style={props} className={className}>{children}</animated.div>;
}
