"use client";

import { useState, useEffect } from "react";
import { Note, CreateNoteRequest, UpdateNoteRequest } from "../../../src/types/notes";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "" });

  // Fetch notes
  const fetchNotes = async () => {
    try {
      const response = await fetch("/api/notes");
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create note
  const createNote = async (noteData: CreateNoteRequest) => {
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });
      
      if (response.ok) {
        const newNote = await response.json();
        setNotes(prev => [newNote, ...prev]);
        setFormData({ title: "", content: "" });
        setShowForm(false);
      }
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  // Update note
  const updateNote = async (id: string, noteData: UpdateNoteRequest) => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });
      
      if (response.ok) {
        const updatedNote = await response.json();
        setNotes(prev => prev.map(note => note.id === id ? updatedNote : note));
        setEditingNote(null);
        setFormData({ title: "", content: "" });
      }
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  // Delete note
  const deleteNote = async (id: string) => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setNotes(prev => prev.filter(note => note.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNote) {
      updateNote(editingNote.id, formData);
    } else {
      createNote(formData);
    }
  };

  // Handle edit
  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({ title: note.title, content: note.content });
    setShowForm(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setEditingNote(null);
    setFormData({ title: "", content: "" });
    setShowForm(false);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            New Note
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingNote ? "Edit Note" : "Create New Note"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  {editingNote ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notes List */}
        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No notes yet. Create your first note!</p>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{note.title}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(note)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{note.content}</p>
                <div className="text-sm text-gray-500">
                  Created: {new Date(note.createdAt).toLocaleString()}
                  {note.updatedAt !== note.createdAt && (
                    <span> • Updated: {new Date(note.updatedAt).toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Back to App */}
        <div className="mt-8">
          <a
            href="/app"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            ← Back to App
          </a>
        </div>
      </div>
    </div>
  );
}
