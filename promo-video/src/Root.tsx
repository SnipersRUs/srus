
import { Composition } from 'remotion';
import { PromotionVideo } from './Composition';
import { SniperPromo } from './SniperPromo';

export const MyOriginalComp: React.FC = () => {
    return (
        <>
            <Composition
                id="SniperPromo"
                component={SniperPromo}
                durationInFrames={65 * 30}
                fps={30}
                width={1080}
                height={1920}
            />
            <Composition
                id="PromoVideo"
                component={PromotionVideo}
                durationInFrames={30 * 30} // 30 seconds at 30fps
                fps={30}
                width={1080}
                height={1920}
            />
        </>
    );
};
