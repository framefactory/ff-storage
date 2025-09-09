/**
 * FF Typescript Foundation Library
 * Copyright 2025 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Readable } from "node:stream";

import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    CreateBucketCommand,
    HeadBucketCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

import { FileStore } from "./FileStore.js";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

////////////////////////////////////////////////////////////////////////////////

export { S3Client };

export class IOError extends Error
{
    constructor(message: string) {
        super(message);
    }
}

export type S3BucketStoreConfig = {
    client: S3Client;
    bucket: string;
}

/**
 * A store implementation based on an AWS S3 bucket.
 * Provides methods to write, read and delete files.
 * Calling `initialize` is required before using the store.
 * The bucket is created if it does not exist.
 */
export class S3BucketStore implements FileStore
{
    protected client: S3Client;
    protected bucket: string;

    constructor(config: S3BucketStoreConfig)
    {
        this.client = config.client;
        this.bucket = config.bucket;
    }

    /**
     * Creates the bucket if it does not exist.
     */
    async initialize(): Promise<void>
    {
        try {
            const command = new HeadBucketCommand({
                Bucket: this.bucket,
            });
            await this.client.send(command);
        }
        catch (error) {
            const command = new CreateBucketCommand({
                Bucket: this.bucket,
            });
    
            const response = await this.client.send(command);
    
            if (response.$metadata.httpStatusCode !== 200) {
                throw new IOError(`Failed to create bucket: ${this.bucket}`);
            }
        }
    }

    /**
     * Writes the given buffer or readable stream to a file
     * with the given name in the bucket.
     */
    async write(
        fileName: string, 
        content: Buffer | Readable, 
        contentType?: string
    ): Promise<void>
    {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: fileName,
            Body: content,
            ContentType: contentType,
        });

        const response = await this.client.send(command);

        if (response.$metadata.httpStatusCode !== 200) {
            throw new IOError(`Failed to write file: ${fileName} to bucket ${this.bucket}`);
        }
    }

    /**
     * Reads the file with the given name and returns its content as a buffer.
     */
    async readBuffer(fileName: string): Promise<Buffer>
    {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: fileName,
        });

        const response = await this.client.send(command);

        if (response.$metadata.httpStatusCode !== 200) {
            throw new IOError(`Failed to read file: ${fileName} from bucket ${this.bucket}`);
        }

        const byteArray = await response.Body.transformToByteArray()
        return Buffer.from(byteArray);    
    }

    /**
     * Reads the file with the given name and returns its content
     * as a readable stream.
     */
    async readStream(fileName: string): Promise<Readable>
    {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: fileName,
        });

        const response = await this.client.send(command);

        if (response.$metadata.httpStatusCode !== 200) {
            throw new IOError(`Failed to read file: ${fileName} from bucket ${this.bucket}`);
        }

        return response.Body as Readable;
    }

    /**
     * Deletes the file with the given name.
     */
    async delete(fileName: string): Promise<void>
    {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: fileName
        });

        const response = await this.client.send(command);

        if (response.$metadata.httpStatusCode !== 204) {
            throw new IOError(`Failed to delete file: ${fileName} from bucket ${this.bucket}`);
        }
    }

    /**
     * Returns a list of all file names in the store
     * matching the given prefix.
     * @param prefix The prefix to match.
     */
    async list(prefix?: string): Promise<string[]>
    {
        const command = new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
        });

        const response = await this.client.send(command);

        if (response.$metadata.httpStatusCode !== 200) {
            throw new IOError(`Failed to list files in bucket ${this.bucket}`);
        }

        const fileNames = response.Contents?.map(item => item.Key) || [];
        return fileNames;
    }

    /**
     * Checks if a file with the given name exists in the store.
     * @param fileName The name of the file to check.
     */
    async has(fileName: string): Promise<boolean>
    {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: fileName,
            });

            return true;
        }
        catch (error) {
            if (error.name === "NoSuchKey" || error.name === "NotFound") {
                return false;
            }
            throw new IOError(`Failed to check existence of file: ${fileName} in bucket ${this.bucket}`);
        }
    }

    /**
     * Deletes all files in the store.
     */
    async clear(): Promise<void>
    {
        const fileNames = await this.list();

        if (fileNames.length === 0) {
            return;
        }

        try {
            const objects = fileNames.map(name => ({ Key: name }));
            const command = new DeleteObjectsCommand({
                Bucket: this.bucket,
                Delete: {
                    Objects: objects,
                    Quiet: true,
                },
            });

            const response = await this.client.send(command);

            if (response.Errors?.length > 0) {
                const errorMessages = response.Errors.map(err => `${err.Key}: ${err.Message}`).join(", ");
                throw new IOError(`Failed to delete some files in bucket ${this.bucket}: ${errorMessages}`);
            }
        }
        catch (error) {
            throw new IOError(`Failed to clear bucket ${this.bucket}: ${error.message}`);
        }
    }

    /**
     * Checks if the store is empty.
     */
    async empty(): Promise<boolean>
    {
        const fileNames = await this.list();
        return fileNames.length === 0;
    }

    /**
     * Returns the type of the store.
     */
    type(): string
    {
        return "s3";
    }
}