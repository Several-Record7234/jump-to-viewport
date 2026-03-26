import { ReactNode, useEffect, useState } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import { useSceneReady } from './useSceneReady.ts';

export const PluginGate = ({ children }: { children: ReactNode }) => {
    const [ready, setReady] = useState(false);
    const { setIsReady } = useSceneReady();

    useEffect(() => {
        if (OBR.isAvailable) {
            OBR.onReady(() => setReady(true));
        }
    }, []);

    useEffect(() => {
        if (!OBR.isAvailable) return;
        const initIsReady = async () => {
            setIsReady(await OBR.scene.isReady());
        };
        const unsubscribe = OBR.scene.onReadyChange((ready) => {
            setIsReady(ready);
        });
        initIsReady();
        return unsubscribe;
    }, []);

    if (ready) {
        return <>{children}</>;
    } else {
        return null;
    }
};
