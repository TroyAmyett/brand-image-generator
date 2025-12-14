import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { imageUrl } = await request.json();

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'Missing imageUrl' },
                { status: 400 }
            );
        }

        const imageResponse = await fetch(imageUrl);

        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }

        const blob = await imageResponse.blob();
        const headers = new Headers();
        headers.set('Content-Type', 'image/png');
        
        // We return the raw image data
        return new NextResponse(blob, {
            status: 200,
            headers: headers,
        });

    } catch (error) {
        console.error('Download proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to download image' },
            { status: 500 }
        );
    }
}
