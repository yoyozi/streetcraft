import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/auth";

const f = createUploadthing();

export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
    },
  })
    
    .middleware(async () => {
      const session = await auth();
    
      if (!session) throw new UploadThingError("Unauthorized");

      return { userId: session?.user?.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),

  // Public upload for crafter registration work samples (no auth required)
  crafterWorkSample: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 3,
    },
  })
    .middleware(async () => {
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      console.log("[UploadThing] Crafter work sample uploaded:", file.ufsUrl);
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;
export type OurFileRouter = typeof ourFileRouter;