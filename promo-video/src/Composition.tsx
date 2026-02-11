import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence, Easing, Audio } from 'remotion';
import React from 'react';

const FONT_FAMILY = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif';

// --- Reusable Animated Components ---

const ScaleIn: React.FC<{ children: React.ReactNode; delay?: number; stiffness?: number }> = ({ children, delay = 0, stiffness = 100 }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const scale = spring({
        frame: frame - delay,
        fps,
        config: { damping: 12, stiffness: stiffness },
    });

    return <div style={{ transform: `scale(${scale})` }}>{children}</div>;
};

const Pulse: React.FC<{ children: React.ReactNode; speed?: number }> = ({ children, speed = 1 }) => {
    const frame = useCurrentFrame();
    const scale = 1 + Math.sin(frame * 0.1 * speed) * 0.05;
    return <div style={{ transform: `scale(${scale})` }}>{children}</div>;
};

const Shake: React.FC<{ children: React.ReactNode; intensity?: number }> = ({ children, intensity = 10 }) => {
    const frame = useCurrentFrame();
    const x = Math.sin(frame * 0.5) * intensity;
    const y = Math.cos(frame * 0.3) * intensity;

    return <div style={{ transform: `translate(${x}px, ${y}px)` }}>{children}</div>;
};

const SlideInText: React.FC<{ children: React.ReactNode; delay?: number; direction?: 'up' | 'down' | 'left' | 'right'; style?: React.CSSProperties }> = ({ children, delay = 0, direction = 'up', style }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const entrance = spring({
        frame: frame - delay,
        fps,
        config: { damping: 200 },
    });

    const opacity = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

    let transform = '';
    const dist = 100;
    if (direction === 'up') transform = `translateY(${interpolate(entrance, [0, 1], [dist, 0])}px)`;
    if (direction === 'down') transform = `translateY(${interpolate(entrance, [0, 1], [-dist, 0])}px)`;
    if (direction === 'left') transform = `translateX(${interpolate(entrance, [0, 1], [dist, 0])}px)`;
    if (direction === 'right') transform = `translateX(${interpolate(entrance, [0, 1], [-dist, 0])}px)`;

    return (
        <div style={{ transform, opacity, ...style }}>
            {children}
        </div>
    );
};

const Title: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, color = '#fff', size = 90, style }) => {
    return (
        <h1 style={{
            fontSize: size,
            fontWeight: '900',
            fontFamily: FONT_FAMILY,
            textAlign: 'center',
            color,
            textShadow: `0 0 30px ${color}90`, // Enhanced glow
            margin: '10px 0',
            lineHeight: 1.1,
            ...style
        }}>
            {children}
        </h1>
    );
};

const Subtitle: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = '#ccc', style }) => {
    return (
        <h2 style={{
            fontSize: 45,
            fontWeight: '600',
            fontFamily: FONT_FAMILY,
            textAlign: 'center',
            color,
            margin: '10px 0',
            textShadow: '0 4px 10px rgba(0,0,0,0.5)',
            ...style
        }}>
            {children}
        </h2>
    );
};

const DynamicBackground: React.FC<{ colorSet?: number }> = ({ colorSet = 1 }) => {
    const frame = useCurrentFrame();
    const { height, width } = useVideoConfig();

    const deg = frame * 0.5;

    // Different gradient sets for variety
    const bg1 = `linear-gradient(${deg}deg, #0f0c29 0%, #302b63 50%, #24243e 100%)`;
    const bg2 = `linear-gradient(${deg}deg, #200122 0%, #6f0000 100%)`; // Redder for pain
    const bg3 = `linear-gradient(${deg}deg, #000428 0%, #004e92 100%)`; // Blue for tech/trust

    let activeBg = bg1;
    if (colorSet === 2) activeBg = bg2;
    if (colorSet === 3) activeBg = bg3;

    return (
        <AbsoluteFill style={{
            background: activeBg,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
        }}>
            {/* Animated Particles/Orbs */}
            {[...Array(5)].map((_, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    top: `${(i * 20) + Math.sin(frame * 0.01 * (i + 1)) * 10}%`,
                    left: `${(i * 15) + Math.cos(frame * 0.01 * (i + 1)) * 10}%`,
                    width: 200 + i * 50,
                    height: 200 + i * 50,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, rgba(255,255,255, 0.05) 0%, rgba(0,0,0,0) 70%)`,
                    transform: `translate(${Math.sin(frame * 0.02 * (i + 1)) * 50}px, ${Math.cos(frame * 0.02 * (i + 1)) * 50}px)`,
                }} />
            ))}
        </AbsoluteFill>
    );
};

const Scene: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <AbsoluteFill style={{
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            padding: 60,
        }}>
            {children}
        </AbsoluteFill>
    );
};

export const PromotionVideo: React.FC = () => {
    // 30 seconds = 900 frames at 30fps
    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>

            {/* SCENE 1: PAIN POINT (0-5s) - Aggressive Red BG */}
            <Sequence from={0} durationInFrames={150}>
                <DynamicBackground colorSet={2} />
                <Scene>
                    <Shake intensity={5}>
                        <SlideInText delay={0} direction="down">
                            <Title color="#ff4757" size={100}>STOP WASTING MONEY</Title>
                        </SlideInText>
                    </Shake>
                    <SlideInText delay={20} direction="up">
                        <Title color="#fff" size={60}>ON SUBSCRIPTIONS!</Title>
                    </SlideInText>
                    <ScaleIn delay={50}>
                        <Subtitle style={{ marginTop: 50 }}>Pay Only When You Trade</Subtitle>
                    </ScaleIn>
                </Scene>
            </Sequence>

            {/* SCENE 2: SOLUTION (5-10s) */}
            <Sequence from={150} durationInFrames={150}>
                <DynamicBackground colorSet={1} />
                <Scene>
                    <ScaleIn delay={0}>
                        <Title color="#2ed573">Get a DAY PASS</Title>
                    </ScaleIn>
                    <SlideInText delay={15}>
                        <Subtitle>For Premium Signals</Subtitle>
                    </SlideInText>

                    <SlideInText delay={45} direction="up">
                        <Img src={staticFile('logo.png')} style={{ width: 150, height: 150, marginTop: 30 }} />
                    </SlideInText>

                    <SlideInText delay={60}>
                        <Title color="#ffa502" size={60} style={{ marginTop: 20 }}>Wait for the Setup!</Title>
                    </SlideInText>
                </Scene>
            </Sequence>

            {/* SCENE 3: BOT LOGIC & IMAGE (10-15s) */}
            <Sequence from={300} durationInFrames={150}>
                <DynamicBackground colorSet={3} />
                <Scene>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <SlideInText delay={0} direction="left">
                            <Img
                                src={staticFile('resized_bot.jpg')}
                                style={{
                                    width: 250,
                                    height: 250,
                                    borderRadius: '50%',
                                    border: '5px solid #ff6b81',
                                    objectFit: 'cover',
                                    boxShadow: '0 0 20px #ff6b81'
                                }}
                            />
                        </SlideInText>
                        <SlideInText delay={10}>
                            <Title color="#ff6b81">Silent Bots?</Title>
                        </SlideInText>
                    </div>
                    <ScaleIn delay={30}>
                        <Title color="#fff" size={80}>MEAN NO TRADES!</Title>
                    </ScaleIn>
                    <SlideInText delay={50}>
                        <Subtitle>No Noise. Just Results.</Subtitle>
                    </SlideInText>
                </Scene>
            </Sequence>

            {/* SCENE 4: LAUNCHER & Zoid (15-22.5s) */}
            <Sequence from={450} durationInFrames={225}>
                <DynamicBackground colorSet={1} />
                <Scene>
                    <SlideInText delay={0}>
                        <Title color="#7bed9f" size={70}>SIGNAL LAUNCHER</Title>
                    </SlideInText>
                    <SlideInText delay={15}>
                        <Subtitle>Powered by <span style={{ color: '#ffdd59', fontWeight: 'bold' }}>CLAWNCH</span></Subtitle>
                    </SlideInText>

                    <ScaleIn delay={40} stiffness={50}>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: 20,
                            borderRadius: 20,
                            marginTop: 30,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            <Title color="#fff" size={50}>Agents Launch Their Own Signals</Title>
                        </div>
                    </ScaleIn>
                </Scene>
            </Sequence>

            {/* SCENE 5: ECONOMY & OFFER (22.5-30s) */}
            <Sequence from={675} durationInFrames={225}>
                <DynamicBackground colorSet={2} />
                <Scene>
                    <Pulse speed={2}>
                        <div style={{
                            border: '8px solid #ffdf00',
                            padding: '30px 50px',
                            borderRadius: 30,
                            background: 'rgba(255, 223, 0, 0.15)',
                            marginBottom: 30,
                            boxShadow: '0 0 40px rgba(255, 223, 0, 0.4)'
                        }}>
                            <Title color="#ffdf00" size={100}>25% OFF</Title>
                            <Subtitle color="#fff">WHEN YOU PAY WITH <span style={{ fontWeight: 'bold', color: '#ffdf00' }}>$ZOID</span></Subtitle>
                        </div>
                    </Pulse>

                    <SlideInText delay={40}>
                        <Title color="#ff4757" size={60}>10% BURNED MONTHLY</Title>
                    </SlideInText>

                    <SlideInText delay={70} style={{ marginTop: 40 }}>
                        <Img src={staticFile('logo.png')} style={{ width: 100, height: 100 }} />
                        <Subtitle>Access ZOID Today!</Subtitle>
                    </SlideInText>
                </Scene>
            </Sequence>

        </AbsoluteFill>
    );
};
