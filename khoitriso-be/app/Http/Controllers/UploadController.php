<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function image(Request $request)
    {
        $file = $request->file('file');
        if (! $file || ! $file->isValid()) return response()->json(['success' => false, 'message' => 'Invalid file'], 400);
        $path = $file->store('images', 'public');
        return response()->json(['success' => true, 'url' => Storage::disk('public')->url($path), 'filename' => basename($path), 'size' => $file->getSize()]);
    }

    public function video(Request $request)
    {
        $file = $request->file('file');
        if (! $file || ! $file->isValid()) return response()->json(['success' => false, 'message' => 'Invalid file'], 400);
        $path = $file->store('videos', 'public');
        return response()->json(['success' => true, 'url' => Storage::disk('public')->url($path), 'filename' => basename($path), 'size' => $file->getSize(), 'duration' => null]);
    }

    public function document(Request $request)
    {
        $file = $request->file('file');
        if (! $file || ! $file->isValid()) return response()->json(['success' => false, 'message' => 'Invalid file'], 400);
        $path = $file->store('docs', 'public');
        return response()->json(['success' => true, 'url' => Storage::disk('public')->url($path), 'filename' => basename($path), 'size' => $file->getSize()]);
    }

    public function ebook(Request $request)
    {
        $file = $request->file('file');
        if (! $file || ! $file->isValid()) return response()->json(['success' => false, 'message' => 'Invalid file'], 400);
        $path = $file->store('ebooks', 'public');
        return response()->json(['success' => true, 'url' => Storage::disk('public')->url($path), 'filename' => basename($path), 'size' => $file->getSize()]);
    }
}


