import { NextRequest, NextResponse } from "next/server";
import { NotesStore } from "../../../../src/lib/notes-store";
import { UpdateNoteRequest } from "../../../../src/types/notes";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/notes/:id - Get a specific note
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const note = NotesStore.getById(id);
    
    if (!note) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch note" },
      { status: 500 }
    );
  }
}

// PATCH /api/notes/:id - Update a specific note
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateNoteRequest = await request.json();
    
    const updatedNote = NotesStore.update(id, body);
    
    if (!updatedNote) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedNote);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

// DELETE /api/notes/:id - Delete a specific note
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deleted = NotesStore.delete(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
