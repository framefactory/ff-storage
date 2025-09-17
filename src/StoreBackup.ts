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
     * The target store must be empty, otherwise an exception is thrown.
     * @param source The source file store.
     * @param target The target file store.
     * @param prefix Optional prefix to filter files in the source store.
     */
    static async copyStore(source: FileStore, target: FileStore, prefix = ""): Promise<void>
    {
        const empty = await target.empty();
        if (!empty) {
            throw new Error("Target store is not empty");
        }

        const fileNames = await source.list(prefix);
        console.log(`[StoreBackup] copying ${fileNames.length} files...`);

        for (const fileName of fileNames) {
            console.log(`[StoreBackup] copying ${fileName}`);
            const stream = await source.readStream(fileName);
            await target.write(fileName, stream);
        };
    }
}
