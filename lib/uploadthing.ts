import { UTApi } from "uploadthing/server";

/**
 * Uploadthing server-side client.
 * Reads UPLOADTHING_TOKEN from environment.
 */
export const utapi = new UTApi();
