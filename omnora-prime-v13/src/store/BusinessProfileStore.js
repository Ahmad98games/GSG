"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBusinessProfileStore = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
exports.useBusinessProfileStore = (0, zustand_1.create)()((0, middleware_1.persist)((set) => ({
    profile: null,
    isLoaded: false,
    isOffline: false,
    setProfile: (profile) => set({ profile, isLoaded: true }),
    setLoaded: (loaded) => set({ isLoaded: loaded }),
    setOffline: (offline) => set({ isOffline: offline }),
    clearCache: () => set({ profile: null, isLoaded: false }),
    reset: () => set({ profile: null, isLoaded: false, isOffline: false }),
}), {
    name: 'NOXIS-profile-cache',
    storage: (0, middleware_1.createJSONStorage)(() => localStorage),
    onRehydrateStorage: () => (state) => {
        if (state)
            state.setLoaded(true);
    },
}));
