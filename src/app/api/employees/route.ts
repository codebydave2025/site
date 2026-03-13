import { NextResponse } from 'next/server';
import path from 'path';
import { safeRead, atomicUpdate } from '@/lib/storage';

const filePath = path.join(process.cwd(), 'employees.json');

export async function GET() {
    const employees = await safeRead(filePath);
    return NextResponse.json(employees);
}

export async function POST(request: Request) {
    try {
        const newEmp = await request.json();

        if (!newEmp.id) {
            newEmp.id = `EMP-${Date.now()}`;
        }

        const employees = await atomicUpdate(filePath, (data: any[]) => {
            data.push(newEmp);
            return data;
        });

        return NextResponse.json(newEmp);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
