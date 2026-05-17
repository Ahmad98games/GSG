"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const better_sqlite3_2 = require("drizzle-orm/better-sqlite3");
const schema = __importStar(require("./schema"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("@/lib/logger");
const pragmas_1 = require("./pragmas");
// Safe Electron import
let app;
try {
    if (process.versions.electron) {
        app = require('electron').app;
    }
}
catch (e) { }
const getDbPath = () => {
    // During next build, we might not have process.cwd() pointing where we expect, 
    // or we might not want to initialize a real DB.
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return ':memory:';
    }
    const isElectron = !!(typeof process !== 'undefined' && (process.type === 'renderer' || process.type === 'browser' || process.versions.electron));
    if (isElectron && app) {
        try {
            return path_1.default.join(app.getPath('userData'), 'NOXIS-local.db');
        }
        catch (e) {
            return path_1.default.join(process.cwd(), 'NOXIS-local.db');
        }
    }
    return path_1.default.join(process.cwd(), 'NOXIS-local.db');
};
const dbPath = getDbPath();
// Only initialize if not in build phase or if we use memory
const sqlite = new better_sqlite3_1.default(dbPath, {
    verbose: process.env.NODE_ENV === 'development'
        ? (msg) => logger_1.logger.debug({ msg }, 'sqlite')
        : undefined,
});
exports.db = Object.assign((0, better_sqlite3_2.drizzle)(sqlite, { schema }), { $client: sqlite });
// Apply production-tuned performance pragmas (WAL, mmap, cache)
if (dbPath !== ':memory:') {
    try {
        (0, pragmas_1.applyProductionPragmas)();
    }
    catch (e) {
        console.error("Failed to apply pragmas:", e);
    }
}
