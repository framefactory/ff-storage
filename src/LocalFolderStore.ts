/**
 * FF Typescript Foundation Library
 * Copyright 2025 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { FileStore } from "./FileStore.js";

////////////////////////////////////////////////////////////////////////////////

export type LocalFolderStoreConfig = {
    rootDir: string;
}

/**
 * A store implementation based on a local folder.
 * Provides methods to write, read and delete files.
 * Calling `initialize` is required before using the store.
 * The root directory is created if it does not exist.
 */
export class LocalFolderStore implements FileStore
{
    protected rootDir: string;

    constructor(config: LocalFolderStoreConfig)
    {
        this.rootDir = config.rootDir;
    }

    /**
     * Creates the root directory if it does not exist.
     * Must be called before using the store.
     */
    async initialize(): Promise<void>
    {
        await fsp.mkdir(this.rootDir, { recursive: true });
    }

    /**
     * Writes the given buffer or readable stream to the file
     * with the given name.
     */
    async write(
        fileName: string, 
        content: Buffer | Readable, 
        contentType?: string
    ): Promise<void>
    {
        const filePath = path.join(this.rootDir, fileName);
        await fsp.mkdir(path.dirname(filePath), { recursive: true });
        return fsp.writeFile(filePath, content);
    }

    /**
     * Reads the file with the given name and returns its content as a buffer.
     */
    async readBuffer(fileName: string): Promise<Buffer>
    {
        const filePath = path.join(this.rootDir, fileName);
        return fsp.readFile(filePath);
    }

    /**
     * Reads the file with the given name and returns its content
     * as a readable stream.
     */
    async readStream(fileName: string): Promise<Readable>
    {
        const filePath = path.join(this.rootDir, fileName);
        return fs.createReadStream(filePath);
    }

    /**
     * Deletes the file with the given name.
     */
    async delete(fileName: string): Promise<void>
    {
        const filePath = path.join(this.rootDir, fileName);
        return fsp.unlink(filePath);
    }

    /**
     * Returns a list of all file names in the store
     * matching the given prefix.
     * @param prefix The prefix to match.
     */
    async list(prefix?: string): Promise<string[]>
    {
        const files = await fsp.readdir(this.rootDir);
        return files.filter(file => !prefix || file.startsWith(prefix));
    }

    /**
     * Checks if a file with the given name exists in the store.
     * @param fileName The name of the file to check.
     */
    async has(fileName: string): Promise<boolean>
    {
        const filePath = path.join(this.rootDir, fileName);
        try {
            await fsp.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }

    type(): string
    {
        return "local";
    }
}