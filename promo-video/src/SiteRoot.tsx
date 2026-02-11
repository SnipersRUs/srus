
import { Composition } from 'remotion';
import { SitePromo } from './SitePromo';

export const SiteRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="ZoidrusSitePromo"
                component={SitePromo}
                durationInFrames={35 * 30} // 35 seconds
                fps={30}
                width={1920} // Landscape
                height={1080} // Landscape
            />
        </>
    );
};
