import { NextRequest, NextResponse } from "next/server";
import { NotesStore } from "../../../src/lib/notes-store";
import { CreateNoteRequest } from "../../../src/types/notes";

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const body: CreateNoteRequest = await request.json();
    
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const note = NotesStore.create({
      title: body.title,
      content: body.content,
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}

// GET /api/notes - Get all notes
export async function GET() {
  try {
    const notes = NotesStore.getAll();
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}
