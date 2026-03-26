import { ReactNode, useEffect } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import { useSceneReady } from './useSceneReady.ts';

// PluginGate is only rendered after ContextWrapper's OBR.onReady has fired,
// so it owns exactly one concern: tracking OBR.scene.isReady.
export const PluginGate = ({ children }: { children: ReactNode }) => {
    const { setIsReady } = useSceneReady();

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

    return <>{children}</>;
};
