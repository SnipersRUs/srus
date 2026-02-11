import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence, Audio } from 'remotion';
import React from 'react';

const FONT_FAMILY = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif';

// --- Shared Components ---

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

const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; duration?: number }> = ({ children, delay = 0, duration = 15 }) => {
    const frame = useCurrentFrame();
    const opacity = interpolate(frame - delay, [0, duration], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
    return <div style={{ opacity }}>{children}</div>;
};

const SlideText: React.FC<{ children: React.ReactNode; delay?: number; y?: number }> = ({ children, delay = 0, y = 100 }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const progress = spring({
        frame: frame - delay,
        fps,
        config: { damping: 200 },
    });
    const transform = `translateY(${interpolate(progress, [0, 1], [y, 0])}px)`;
    const opacity = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
    return <div style={{ transform, opacity }}>{children}</div>;
};

const MoveIn: React.FC<{ children: React.ReactNode; direction?: 'left' | 'right' | 'up' | 'down'; delay?: number; duration?: number }> = ({ children, direction = 'right', delay = 0, duration = 15 }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const entrance = spring({
        frame: frame - delay,
        fps,
        config: { damping: 200 },
    });

    const dist = 500;
    let transform = '';
    if (direction === 'up') transform = `translateY(${interpolate(entrance, [0, 1], [dist, 0])}px)`;
    if (direction === 'down') transform = `translateY(${interpolate(entrance, [0, 1], [-dist, 0])}px)`;
    if (direction === 'left') transform = `translateX(${interpolate(entrance, [0, 1], [dist, 0])}px)`;
    if (direction === 'right') transform = `translateX(${interpolate(entrance, [0, 1], [-dist, 0])}px)`;

    return <div style={{ transform, width: '100%', height: '100%' }}>{children}</div>;
};

const Title: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, color = '#fff', size = 80, style }) => (
    <h1 style={{
        fontSize: size, fontWeight: '900', fontFamily: FONT_FAMILY, textAlign: 'center', color,
        textShadow: `0 0 30px ${color}80`, margin: '10px 0', lineHeight: 1.1, ...style
    }}>{children}</h1>
);

const Subtitle: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, color = '#ccc', size = 40, style }) => (
    <h2 style={{
        fontSize: size, fontWeight: '600', fontFamily: FONT_FAMILY, textAlign: 'center', color,
        margin: '10px 0', textShadow: '0 4px 10px rgba(0,0,0,0.5)', ...style
    }}>{children}</h2>
);

const NeonContainer: React.FC<{ children: React.ReactNode; borderColor?: string }> = ({ children, borderColor = '#a855f7' }) => (
    <div style={{
        border: `4px solid ${borderColor}`, padding: '20px 40px', borderRadius: 20,
        background: `${borderColor}20`, boxShadow: `0 0 30px ${borderColor}40`,
        backdropFilter: 'blur(10px)'
    }}>{children}</div>
);

const DynamicBackground: React.FC = () => {
    const frame = useCurrentFrame();
    const deg = frame * 0.1;
    return (
        <AbsoluteFill style={{
            background: `linear-gradient(${deg}deg, #0f0f15 0%, #171720 100%)`, alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{
                position: 'absolute', width: '100%', height: '100%',
                backgroundImage: 'radial-gradient(#ffffff08 1px, transparent 1px)', backgroundSize: '50px 50px',
            }} />
        </AbsoluteFill>
    );
};

// --- Main Composition ---

export const SniperPromo: React.FC = () => {
    return (
        <AbsoluteFill>
            <DynamicBackground />

            {/* OPENING: 0-5s (0-150 frames) */}
            <Sequence from={0} durationInFrames={150}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Img src={staticFile('crypto_charts.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
                    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <NeonContainer borderColor="#ef4444">
                            <Title size={70}>TIRED OF PAYING</Title>
                            <Subtitle size={50}>MONTHLY SUBSCRIPTIONS?</Subtitle>
                        </NeonContainer>
                    </AbsoluteFill>
                </AbsoluteFill>
            </Sequence>

            {/* THE PROBLEM: 5-15s (150-450 frames) */}
            <Sequence from={150} durationInFrames={300}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Img src={staticFile('frustrated_trader.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                        <SlideText delay={10}>
                            <Title color="#ef4444" size={100}>$99 / month?</Title>
                        </SlideText>
                        <SlideText delay={30}>
                            <Title color="#ef4444" size={100}>$199 / month?</Title>
                        </SlideText>
                        <SlideText delay={60}>
                            <Subtitle size={40} style={{ marginTop: 50, background: 'rgba(0,0,0,0.8)', padding: 20, borderRadius: 10 }}>
                                Why pay for signals when you're not even trading?
                            </Subtitle>
                        </SlideText>
                    </AbsoluteFill>
                </AbsoluteFill>
            </Sequence>

            {/* THE SOLUTION: 15-30s (450-900 frames) */}
            <Sequence from={450} durationInFrames={450}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <ScaleIn delay={0}>
                        <div style={{ width: 1000, height: 1600, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: 20, border: '5px solid #a855f7', background: '#000' }}>
                            <Img src={staticFile('user_screenshot_1.png')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                    </ScaleIn>
                    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <SlideText delay={20} y={-50}>
                            <div style={{ position: 'absolute', top: 200, left: 100 }}>
                                <NeonContainer borderColor="#10b981">
                                    <Title size={60}>REAL-TIME SIGNALS</Title>
                                </NeonContainer>
                            </div>
                        </SlideText>
                        <SlideText delay={60} y={50}>
                            <div style={{ position: 'absolute', bottom: 300, right: 100 }}>
                                <NeonContainer borderColor="#f97316">
                                    <Subtitle size={50} color="#fff">Only pay when YOU'RE ready!</Subtitle>
                                </NeonContainer>
                            </div>
                        </SlideText>
                    </AbsoluteFill>
                </AbsoluteFill>
            </Sequence>

            {/* KEY FEATURES: 30-50s (900-1500 frames) */}
            <Sequence from={900} durationInFrames={600}>
                <AbsoluteFill style={{ flexDirection: 'row' }}>
                    {/* Left Panel: Feature List */}
                    <div style={{ width: '50%', height: '100%', padding: 50, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Title color="#a855f7" size={70} style={{ textAlign: 'left' }}>KEY FEATURES</Title>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li style={{ marginBottom: 30 }}><Subtitle style={{ textAlign: 'left' }} size={40}>🔍 Watchlist with Confidence Scores</Subtitle></li>
                            <li style={{ marginBottom: 30 }}><Subtitle style={{ textAlign: 'left' }} size={40}>📡 Live Entry, TP, & SL</Subtitle></li>
                            <li style={{ marginBottom: 30 }}><Subtitle style={{ textAlign: 'left' }} size={40}>⏳ 15/60 Min Scan Timers</Subtitle></li>
                            <li style={{ marginBottom: 30 }}><Subtitle style={{ textAlign: 'left' }} size={40}>🛡️ 1% Max Loss Logic</Subtitle></li>
                        </ul>
                    </div>
                    {/* Right Panel: Visuals - Cycling Screenshots */}
                    <div style={{ width: '50%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <ScaleIn delay={20}>
                            <div style={{ width: 800, height: 1400, overflow: 'hidden', borderRadius: 20, boxShadow: '0 0 50px rgba(168, 85, 247, 0.4)', background: '#000' }}>
                                <Sequence durationInFrames={300}>
                                    <Img src={staticFile('user_screenshot_2.png')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </Sequence>
                                <Sequence from={300} durationInFrames={300}>
                                    <MoveIn direction="right">
                                        <Img src={staticFile('user_screenshot_4.png')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </MoveIn>
                                </Sequence>
                            </div>
                        </ScaleIn>
                        <AbsoluteFill style={{ alignItems: 'flex-end', justifyContent: 'flex-end', padding: 50 }}>
                            <FadeIn delay={60}>
                                <NeonContainer borderColor="#10b981">
                                    <Title size={50}>SNIPER GURU AI</Title>
                                    <Subtitle size={30}>$10K Account • 10x Leverage</Subtitle>
                                </NeonContainer>
                            </FadeIn>
                        </AbsoluteFill>
                    </div>
                </AbsoluteFill>
            </Sequence>

            {/* THE HOOK: 50-60s (1500-1800 frames) */}
            <Sequence from={1500} durationInFrames={300}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', background: '#000' }}>
                    <Img src={staticFile('user_screenshot_3.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3, filter: 'blur(10px)' }} />
                    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                        <ScaleIn delay={0} stiffness={100}>
                            <div style={{ width: 800, height: 1200, marginBottom: 50, border: '2px solid #a855f7', borderRadius: 20, overflow: 'hidden', boxShadow: '0 0 40px rgba(168, 85, 247, 0.6)' }}>
                                <Img src={staticFile('user_screenshot_3.png')} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
                            </div>
                        </ScaleIn>
                        <FadeIn delay={20}>
                            <NeonContainer borderColor="#fff">
                                <Title size={60}>GET A DAY PASS</Title>
                                <Subtitle size={40}>Trade Only When You Want</Subtitle>
                            </NeonContainer>
                        </FadeIn>
                    </AbsoluteFill>
                </AbsoluteFill>
            </Sequence>

            {/* CLOSING: 60-65s (1800-1950 frames) */}
            <Sequence from={1800} durationInFrames={150}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', background: '#0f0f15' }}>
                    <ScaleIn delay={10}>
                        <Img src={staticFile('logo.png')} style={{ width: 400, marginBottom: 50 }} />
                    </ScaleIn>
                    <SlideText delay={30}>
                        <Title color="#fff" size={80}>SRUS</Title>
                        <Subtitle color="#a855f7" size={40}>Professional Signals. Amateur Pricing.</Subtitle>
                        <div style={{ marginTop: 50, padding: 20, background: '#a855f7', borderRadius: 10 }}>
                            <Subtitle color="#fff" size={35} style={{ margin: 0 }}>Download Now - Your First Day Pass is Free</Subtitle>
                        </div>
                    </SlideText>
                </AbsoluteFill>
            </Sequence>

        </AbsoluteFill>
    );
};
