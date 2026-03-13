import { NextResponse } from 'next/server';
import path from 'path';
import { safeRead, atomicUpdate } from '@/lib/storage';

const filePath = path.join(process.cwd(), 'employees.json');

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const updated = await request.json();

        let updatedItem = null;
        await atomicUpdate(filePath, (employees: any[]) => {
            const index = employees.findIndex((e: any) => e.id === id);
            if (index !== -1) {
                employees[index] = { ...employees[index], ...updated };
                updatedItem = employees[index];
            }
            return employees;
        });

        if (!updatedItem) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(updatedItem);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await atomicUpdate(filePath, (employees: any[]) => {
            return employees.filter((e: any) => e.id !== id);
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
