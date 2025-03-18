/**
 * FF Typescript Foundation Library
 * Copyright 2025 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Readable } from "node:stream";

////////////////////////////////////////////////////////////////////////////////

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

    /**
     * Returns a list of all file names in the store
     * matching the given prefix.
     * @param prefix The prefix to match.
     */
    list(prefix?: string): Promise<string[]>;

    /**
     * Checks if a file with the given name exists in the store.
     * @param fileName The name of the file to check.
     */
    has(fileName: string): Promise<boolean>;

    /**
     * Returns the type of the store.
     */
    type(): string;
}