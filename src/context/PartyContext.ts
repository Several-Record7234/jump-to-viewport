import { createContext, useContext, useEffect } from 'react';
import OBR, { Player } from '@owlbear-rodeo/sdk';

export type PartyContextType = {
    players: Player[] | null;
    nonGMPlayers: Player[] | null;
    /** Internal — used by ContextWrapper's party subscription only. */
    _setPlayers: (p: Player[]) => void;
};

export const PartyContext = createContext<PartyContextType | null>(null);

export const usePartyContext = (): PartyContextType => {
    const partyContext = useContext(PartyContext);
    if (partyContext === null) {
        throw new Error('Party not yet set');
    }
    useEffect(() => {
        return OBR.party.onChange((party) => partyContext._setPlayers(party));
    }, []);

    return partyContext;
};
