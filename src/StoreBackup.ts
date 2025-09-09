/**
 * FF Typescript Foundation Library
 * Copyright 2025 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { FileStore } from "./FileStore.js";

////////////////////////////////////////////////////////////////////////////////

/**
 * Utility class providing methods to backup files between file stores.
 */
export class StoreBackup
{
    /**
     * Copies all files from the source file store to the target file store.
     * @param source The source file store.
     * @param target The target file store.
     * @param prefix Optional prefix to filter files in the source store.
     */
    static async copyStore(source: FileStore, target: FileStore, prefix = ""): Promise<void>
    {
        return source.list(prefix).then(async (fileNames) => {
            for (const fileName of fileNames) {
                const stream = await source.readStream(fileName);
                await target.write(fileName, stream);
            }
        });
    }
}
