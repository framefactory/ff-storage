/**
 * FF Typescript Foundation Library
 * Copyright 2025 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Readable } from "node:stream";

import {
    S3Client,
    PutObjectCommand,
    CreateBucketCommand,
    HeadBucketCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";

import { FileStore } from "./FileStore.js";

////////////////////////////////////////////////////////////////////////////////

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

    type(): string
    {
        return "s3";
    }
}