import { StarredBox, StarredLegacy } from '../helper/types';

export const deriveFilteredPlayerIds = (playerFilters: Record<string, boolean>): string[] =>
    Object.entries(playerFilters)
        .filter(([, show]) => !show)
        .map(([id]) => id);

export const applyViewportDelete = (
    current: Array<StarredBox | StarredLegacy>,
    id: string,
): Array<StarredBox | StarredLegacy> | undefined => {
    const filtered = current.filter((v) => v.id !== id);
    return filtered.length ? filtered : undefined;
};

type ItemBounds = {
    image: { width: number; height: number };
    scale: { x: number; y: number };
    position: { x: number; y: number };
};

export const calcItemsBoundingBox = (
    items: ItemBounds[],
): { min: { x: number; y: number }; max: { x: number; y: number } } => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    items.forEach((item) => {
        const halfWidth = (item.image.width * item.scale.x) / 2;
        const halfHeight = (item.image.height * item.scale.y) / 2;
        if (item.position.x - halfWidth < minX) minX = item.position.x - halfWidth;
        if (item.position.y - halfHeight < minY) minY = item.position.y - halfHeight;
        if (item.position.x + halfWidth > maxX) maxX = item.position.x + halfWidth;
        if (item.position.y + halfHeight > maxY) maxY = item.position.y + halfHeight;
    });
    return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
};
