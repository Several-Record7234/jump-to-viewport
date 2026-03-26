import { useEffect, useState } from 'react';
import OBR, { Vector2, Math2, isImage } from '@owlbear-rodeo/sdk';
import {
    SceneMetadata,
    StarredBox,
    StarredLegacy,
    UserFilter,
    isStarredBox,
    isStarredLegacy,
    metadataId,
    validMetadata,
} from '../helper/types';
import { usePlayerContext } from '../context/PlayerContext';
import { usePartyContext } from '../context/PartyContext';
import { deriveFilteredPlayerIds, applyViewportDelete, calcItemsBoundingBox } from './viewportHelpers';

const makeId = () => {
    return crypto.randomUUID();
};
const reset = async () => {
    await OBR.viewport.reset();
};

const starred = (metadata: SceneMetadata | null) =>
    metadata && metadata[metadataId].starredViewports ? metadata[metadataId].starredViewports : [];

const defaultFilters: UserFilter = { players: {}, absents: true };

const filtersKey = (userId: string) => `views:filters:${userId}`;

const readLocalFilters = (userId: string): UserFilter => {
    try {
        const raw = localStorage.getItem(filtersKey(userId));
        if (!raw) return { ...defaultFilters };
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return { ...defaultFilters };
        const p = parsed as Record<string, unknown>;
        return {
            players: typeof p.players === 'object' && p.players !== null
                ? (p.players as Record<string, boolean>)
                : {},
            absents: typeof p.absents === 'boolean' ? p.absents : true,
        };
    } catch {
        return { ...defaultFilters };
    }
};

const writeLocalFilters = (userId: string, filters: UserFilter) => {
    localStorage.setItem(filtersKey(userId), JSON.stringify(filters));
};

const getViewportBounds = async () => {
    const [height, width, min] = await Promise.all([
        OBR.viewport.getHeight(),
        OBR.viewport.getWidth(),
        OBR.viewport.inverseTransformPoint({ x: 0, y: 0 }),
    ]);
    // get world coordinates for top-left of viewpoint
    const max = await OBR.viewport.inverseTransformPoint({ x: width, y: height });

    return { min, max };
};

const jumpToLegacy = async ({ transform }: StarredLegacy) => {
    await OBR.viewport.animateTo(transform);
};

const jumpToBoundingBox = async ({ boundingCorners }: Pick<StarredBox, 'boundingCorners'>) => {
    const { min, max } = boundingCorners;
    const bbox = Math2.boundingBox([min, max]);
    await OBR.viewport.animateToBounds(bbox);
};

const constructStarredBox = ({
    id,
    viewportName,
    min,
    max,
    currentUserId,
}: {
    id?: string;
    viewportName: string;
    min: Vector2;
    max: Vector2;
    currentUserId: string;
}): StarredBox => ({
    id: id ?? makeId(),
    name: viewportName,
    boundingCorners: { min, max },
    playerId: currentUserId,
});

const getPlayerImages = async (nonGMids: string[]) => {
    return (await OBR.scene.items.getItems((item) => nonGMids.includes(item.createdUserId))).filter(
        isImage,
    );
};


const defaultSceneMetadata: SceneMetadata = {
    [metadataId]: { starredViewports: [] },
};

export const useViewport = () => {
    const currentUser = usePlayerContext();
    const { id: currentUserId } = currentUser;
    const { nonGMPlayers } = usePartyContext();
    const [metadata, setMetadata] = useState<SceneMetadata>(defaultSceneMetadata);
    const [localFilters, setLocalFilters] = useState<UserFilter>(() =>
        readLocalFilters(currentUserId),
    );
    useEffect(() => {
        const fetchMetadata = async () => {
            const sceneMetadata = await OBR.scene.getMetadata();
            if (validMetadata(sceneMetadata)) {
                setMetadata(sceneMetadata);
                // One-way migration: if legacy filter data exists in metadata and
                // localStorage is empty, copy it over then ignore metadata filters.
                const legacyFilter = sceneMetadata[metadataId].filters?.[currentUserId];
                if (legacyFilter && !localStorage.getItem(filtersKey(currentUserId))) {
                    writeLocalFilters(currentUserId, legacyFilter);
                    setLocalFilters(legacyFilter);
                }
                return;
            }
            // todo handle
            console.log('Metadata was invalid');
        };
        fetchMetadata();
    }, []);
    useEffect(() => {
        return OBR.scene.onMetadataChange((m) => {
            // Validate before trusting data from the SDK
            if (!validMetadata(m)) return;
            const obrMetadata = m;
            setMetadata((prev) => {
                if (JSON.stringify(obrMetadata[metadataId]) !== JSON.stringify(prev[metadataId])) {
                    return starred(obrMetadata).length ? obrMetadata : defaultSceneMetadata;
                }
                return prev;
            });
        });
    }, [currentUserId]);

    const starViewport = async (viewportName: string) => {
        const trimmed = viewportName.trim();
        if (!trimmed) throw new Error('Viewport name must not be blank');
        if (starred(metadata).some((v) => v.name === trimmed))
            throw new Error(`A viewport named "${trimmed}" already exists`);
        const { min, max } = await getViewportBounds();

        await OBR.scene.setMetadata({
            [metadataId]: {
                starredViewports: [
                    ...starred(metadata),
                    constructStarredBox({ currentUserId, viewportName: trimmed, min, max }),
                ],
            },
        });
    };
    const deleteViewport = async (viewport: StarredLegacy | StarredBox) => {
        await OBR.scene.setMetadata({
            [metadataId]: { starredViewports: applyViewportDelete(starred(metadata), viewport.id) },
        });
    };

    const jumpTo = async ({ id }: StarredLegacy | StarredBox) => {
        const star = starred(metadata).find((v) => v.id === id);
        if (!star) {
            throw new Error(`Jumping Error: No viewport with id ${id} exists`);
        }
        if (isStarredBox(star)) {
            await jumpToBoundingBox(star);
        }

        if (isStarredLegacy(star)) {
            await jumpToLegacy(star);
            await overwriteViewport({ id });
        }
    };

    const filterPlayer = (filteredPlayerId: string, show: boolean) => {
        const updated: UserFilter = {
            ...localFilters,
            players: { ...localFilters.players, [filteredPlayerId]: show },
        };
        writeLocalFilters(currentUserId, updated);
        setLocalFilters(updated);
    };

    const filterAbsent = (show: boolean) => {
        const updated: UserFilter = { ...localFilters, absents: show };
        writeLocalFilters(currentUserId, updated);
        setLocalFilters(updated);
    };

    const overwriteViewport = async ({ id: idToBeOverwritten }: { id: string }) => {
        const existingViewports = starred(metadata);
        const viewportToBeDeleted = existingViewports.find(({ id }) => id === idToBeOverwritten);
        if (!viewportToBeDeleted) {
            throw new Error(
                `Overwrite Viewport Error: No viewport with id ${idToBeOverwritten} exists`,
            );
        }
        const { min, max } = await getViewportBounds();
        await OBR.scene.setMetadata({
            [metadataId]: {
                starredViewports: [
                    ...starred(metadata).filter(({ id }) => id !== idToBeOverwritten),
                    constructStarredBox({
                        viewportName: viewportToBeDeleted.name,
                        min,
                        max,
                        currentUserId,
                        id: idToBeOverwritten,
                    }),
                ],
            },
        });
    };
    const nonGMids = nonGMPlayers?.map(({ id }) => id) || [];

    const jumpToPlayerItems = async () => {
        const items = await getPlayerImages(nonGMids);
        await jumpToBoundingBox({ boundingCorners: calcItemsBoundingBox(items) });
    };

    const filteredPlayerIds = deriveFilteredPlayerIds(localFilters.players);

    return {
        starredViewports: starred(metadata),
        starViewport,
        deleteViewport,
        reset,
        jumpTo,
        filterPlayer,
        filterAbsent,
        jumpToPlayerItems,
        filteredPlayerIds,
        showAbsentPlayers: localFilters.absents,
    };
};
