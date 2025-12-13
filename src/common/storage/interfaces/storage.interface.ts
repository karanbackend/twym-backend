export interface UploadResult {
    filePath: string;
    publicUrl: string;
    /**
     * Presigned (signed) URL for accessing the file. May be returned for private buckets.
     * Validity is provider-specific; when using Supabase this is returned by createSignedUrl().
     */
    signedUrl?: string;
}

export interface IStorageService {
    /**
     * Upload a file to storage
     */
    uploadFile(
        bucketName: string,
        basePath: string,
        file: Express.Multer.File,
        filePrefix?: string,
    ): Promise<UploadResult>;

    /**
     * Delete a file from storage
     */
    deleteFile(bucketName: string, filePath: string): Promise<void>;

    /**
     * Get a public or signed URL for a file. Implementations may return a signed URL
     * for private buckets. Returns a promise that resolves to a URL string.
     *
     * @param bucketName string
     * @param filePath string
     * @param expiresInSeconds optional expiration in seconds for signed URLs (provider-specific)
     */
    getPublicUrl(bucketName: string, filePath: string, expiresInSeconds?: number): Promise<string>;
}
