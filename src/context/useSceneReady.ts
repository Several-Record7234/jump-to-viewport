import { create } from 'zustand';

export type SceneReady = {
    isReady: boolean;
    setIsReady: (ready: boolean) => void;
};

export const useSceneReady = create<SceneReady>()((set) => ({
    isReady: false,
    setIsReady: (ready) => set(() => ({ isReady: ready })),
}));
