/**
 * FF Typescript Foundation Library
 * Copyright 2025 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Readable } from "node:stream";

////////////////////////////////////////////////////////////////////////////////

export class FileStoreError extends Error
{
    constructor(message: string) {
        super(message);
    }
}

/**
 * Interface for a file store implementation.
 */
export interface FileStore
{
    /**
     * Initializes the file store. Must be called before using the store.
     */
    initialize(): Promise<void>;

    /**
     * Writes the given buffer or readable stream to the store.
     * @param fileName The name of the file to write.
     * @param content  The buffer or readable stream to write.
     * @param contentType The optional content type of the file.
     */
    write(
        fileName: string, 
        content: Buffer | Readable, 
        contentType?: string
    ): Promise<void>;

    /**
     * Reads the file with the given name from the store and returns
     * its content as a buffer.
     * @param fileName The name of the file to read.
     */
    readBuffer(fileName: string): Promise<Buffer>;

    /**
     * Reads the file with the given name from the store and returns
     * its content as a readable stream.
     * @param fileName The name of the file to read.
     */
    readStream(fileName: string): Promise<Readable>;

    /**
     * Deletes the file with the given name from the store.
     * @param fileName The name of the file to delete.
     */
    delete(fileName: string): Promise<void>;
}