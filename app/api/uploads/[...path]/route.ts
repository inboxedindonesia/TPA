import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: Request, { params }: any) {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      ...params["path"]
    );

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "application/octet-stream";

    switch (ext) {
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".gif":
        contentType = "image/gif";
        break;
      case ".webp":
        contentType = "image/webp";
        break;
    }

    // Convert Buffer to ArrayBuffer for NextResponse
    // Make sure to only send ArrayBuffer, not SharedArrayBuffer
    const arrayBuffer =
      fileBuffer instanceof Buffer
        ? fileBuffer.buffer.slice(
            fileBuffer.byteOffset,
            fileBuffer.byteOffset + fileBuffer.byteLength
          )
        : fileBuffer;
    return new NextResponse(arrayBuffer as ArrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
