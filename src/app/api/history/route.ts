import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const historyPath = path.join(process.cwd(), 'data', 'history.json');

        if (!fs.existsSync(historyPath)) {
            return NextResponse.json([]);
        }

        const fileContent = fs.readFileSync(historyPath, 'utf-8');
        const history = JSON.parse(fileContent);

        return NextResponse.json(history);
    } catch (error) {
        console.error('Error fetching history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch history' },
            { status: 500 }
        );
    }
}
