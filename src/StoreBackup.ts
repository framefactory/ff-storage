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

        console.log(`[StoreBackup] completed, ${fileNames.length} files copied.`);
    }

    /**
     * Copies files that are in source but not in target, and deletes files that are in target but not in source.
     * Only checks file existence, does not check for file modifications or updates.
     * @param source The source file store.
     * @param target The target file store.
     * @param prefix Optional prefix to filter files in the source store.
     */
    static async copyStoreDiff(source: FileStore, target: FileStore, prefix = ""): Promise<void>
    {
        const targetFiles = await target.list(prefix);
        const targetSet = new Set(targetFiles);
        const sourceFiles = await source.list(prefix);
        const sourceSet = new Set(sourceFiles);

        const addedFiles = sourceFiles.filter(name => !targetSet.has(name));
        const removedFiles = targetFiles.filter(name => !sourceSet.has(name));

        console.log(`[StoreBackup] copying ${addedFiles.length} added files...`);
        for (const fileName of addedFiles) {
            console.log(`[StoreBackup] copying ${fileName}`);
            const stream = await source.readStream(fileName);
            await target.write(fileName, stream);
        };

        console.log(`[StoreBackup] delete ${removedFiles.length} removed files...`);
        for (const fileName of removedFiles) {
            console.log(`[StoreBackup] deleting ${fileName}`);
            await target.delete(fileName);
        };

        console.log(`[StoreBackup] completed, ${addedFiles.length} files added, ${removedFiles.length} files removed.`);
    }
}
