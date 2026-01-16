import { NextResponse } from 'next/server';

const ACCEPTED_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'MISSING_URL',
                        message: 'URL is required'
                    }
                },
                { status: 400 }
            );
        }

        // Validate URL
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_URL',
                        message: 'Invalid URL format'
                    }
                },
                { status: 400 }
            );
        }

        // Only allow HTTP/HTTPS
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_PROTOCOL',
                        message: 'Only HTTP and HTTPS URLs are supported'
                    }
                },
                { status: 400 }
            );
        }

        // Fetch the image with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch(parsedUrl.toString(), {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; ImageFetcher/1.0)',
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: 'FETCH_FAILED',
                            message: `Failed to fetch image: HTTP ${response.status}`
                        }
                    },
                    { status: 400 }
                );
            }

            // Check content type
            const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
            if (!contentType || !ACCEPTED_CONTENT_TYPES.includes(contentType)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_CONTENT_TYPE',
                            message: `Invalid content type: ${contentType}. Only PNG, JPG, and WEBP are supported.`
                        }
                    },
                    { status: 400 }
                );
            }

            // Check content length if available
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: 'FILE_TOO_LARGE',
                            message: 'Image file is too large. Maximum size is 10MB.'
                        }
                    },
                    { status: 400 }
                );
            }

            // Read the image data
            const arrayBuffer = await response.arrayBuffer();

            // Double-check size after downloading
            if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: 'FILE_TOO_LARGE',
                            message: 'Image file is too large. Maximum size is 10MB.'
                        }
                    },
                    { status: 400 }
                );
            }

            // Convert to base64
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const mimeType = contentType === 'image/jpg' ? 'image/jpeg' : contentType;
            const dataUrl = `data:${mimeType};base64,${base64}`;

            return NextResponse.json({
                success: true,
                imageBase64: dataUrl,
                contentType: mimeType,
                size: arrayBuffer.byteLength
            });

        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: 'TIMEOUT',
                            message: 'Request timed out. Please try again.'
                        }
                    },
                    { status: 408 }
                );
            }
            throw fetchError;
        }

    } catch (error) {
        console.error('[FetchImage] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'An error occurred'
                }
            },
            { status: 500 }
        );
    }
}
