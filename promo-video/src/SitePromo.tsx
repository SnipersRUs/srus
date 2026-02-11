import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence, Audio, Easing } from 'remotion';
import React from 'react';

const FONT_FAMILY = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif';

// Reused Components
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

const Title: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, color = '#fff', size = 80, style }) => {
    return (
        <h1 style={{
            fontSize: size,
            fontWeight: '900',
            fontFamily: FONT_FAMILY,
            textAlign: 'center',
            color,
            textShadow: `0 0 30px ${color}80`,
            margin: '10px 0',
            lineHeight: 1.1,
            ...style
        }}>
            {children}
        </h1>
    );
};

const Subtitle: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, color = '#ccc', size = 40, style }) => {
    return (
        <h2 style={{
            fontSize: size,
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

const DynamicBackground: React.FC = () => {
    const frame = useCurrentFrame();
    const deg = frame * 0.2;
    return (
        <AbsoluteFill style={{
            background: `linear-gradient(${deg}deg, #09090b 0%, #1c1917 100%)`,
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div style={{
                position: 'absolute',
                width: '100%', height: '100%',
                backgroundImage: 'radial-gradient(#ffffff10 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                opacity: 0.3
            }} />
        </AbsoluteFill>
    );
};

export const SitePromo: React.FC = () => {
    return (
        <AbsoluteFill>
            <DynamicBackground />

            {/* INTRO: 0-6s */}
            <Sequence from={0} durationInFrames={180}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <ScaleIn delay={0}>
                        {/* Full width hero image, no border/chrome */}
                        <div style={{ width: 1400, height: 800, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: 8 }}>
                            <Img src={staticFile('site_hero.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                        </div>
                    </ScaleIn>
                    <SlideInText delay={30} style={{ position: 'absolute', bottom: 100, right: 100, background: 'rgba(0,0,0,0.8)', padding: 30, borderRadius: 15 }}>
                        <Title color="#4ade80">zoidrus.life</Title>
                        <Subtitle size={30}>Smart Trading Starts Here</Subtitle>
                    </SlideInText>
                </AbsoluteFill>
            </Sequence>

            {/* FEATURES: 6-12s */}
            <Sequence from={180} durationInFrames={180}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <ScaleIn delay={0}>
                        <div style={{ width: 1400, height: 800, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: 8 }}>
                            <PanImage src={staticFile('site_features.png')} duration={180} />
                        </div>
                    </ScaleIn>
                    <SlideInText delay={20} style={{ position: 'absolute', top: 100, left: 100, zIndex: 10, background: 'rgba(0,0,0,0.6)', padding: 20, borderRadius: 10 }}>
                        <Title color="#fbbf24" size={70}>Advanced Features</Title>
                    </SlideInText>
                </AbsoluteFill>
            </Sequence>

            {/* SIGNAL LAUNCHER: 12-20s */}
            <Sequence from={360} durationInFrames={240}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <ScaleIn delay={0} stiffness={60}>
                        <div style={{ width: 1400, height: 800, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: 8 }}>
                            <Img src={staticFile('site_launcher.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </ScaleIn>

                    <SlideInText delay={15} style={{ position: 'absolute', bottom: 100, left: 100, background: 'rgba(0,0,0,0.9)', padding: 40, borderRadius: 20, border: '1px solid #333' }}>
                        <Title color="#f472b6" size={80}>Signal Launcher</Title>
                        <Subtitle size={40}>Powered by <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Clawnch</span></Subtitle>
                    </SlideInText>
                </AbsoluteFill>
            </Sequence>

            {/* WALLET / APP: 20-28s */}
            <Sequence from={600} durationInFrames={240}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <ScaleIn delay={0}>
                        <div style={{ width: 1400, height: 800, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: 8 }}>
                            <Img src={staticFile('site_wallet.png')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                    </ScaleIn>
                    <SlideInText delay={30} style={{ position: 'absolute', top: 100, right: 100 }}>
                        <Title color="#60a5fa" size={90}>Seamless Connect</Title>
                    </SlideInText>
                </AbsoluteFill>
            </Sequence>

            {/* OUTRO: 28-35s */}
            <Sequence from={840} durationInFrames={210}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <ScaleIn delay={0}>
                        <Img src={staticFile('logo.png')} style={{ width: 300, marginBottom: 50 }} />
                    </ScaleIn>
                    <SlideInText delay={20}>
                        <Title color="#fff" size={100}>Ready to Trade?</Title>
                    </SlideInText>
                    <SlideInText delay={40}>
                        <Subtitle color="#fbbf24" size={50}>Visit zoidrus.life</Subtitle>
                    </SlideInText>
                    <ScaleIn delay={60}>
                        <div style={{
                            marginTop: 50,
                            border: '4px solid #fbbf24',
                            padding: '20px 40px',
                            borderRadius: 20,
                            background: 'rgba(251, 191, 36, 0.1)'
                        }}>
                            <Subtitle color="#fff" style={{ fontSize: 35, margin: 0 }}>25% OFF with $ZOID Payment</Subtitle>
                        </div>
                    </ScaleIn>
                </AbsoluteFill>
            </Sequence>

        </AbsoluteFill>
    );
};

// Helper for panning image
const PanImage: React.FC<{ src: string; duration: number }> = ({ src, duration }) => {
    const frame = useCurrentFrame();
    const progress = interpolate(frame, [0, duration], [0, 100], { extrapolateRight: 'clamp' });

    // Smooth scroll down
    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <Img
                src={src}
                style={{
                    width: '100%',
                    transform: `translateY(-${progress * 0.2}%)` // Subtle scroll
                }}
            />
        </div>
    );
};
