<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    public function index(Request $request)
    {
        $q = Certificate::where('user_id', $request->user()->id);
        if ($request->filled('itemType')) $q->where('item_type', $request->integer('itemType'));
        $res = $q->orderByDesc('issued_at')->paginate((int) $request->query('pageSize', 20));
        return response()->json(['certificates' => $res->items(), 'total' => $res->total(), 'hasMore' => $res->hasMorePages()]);
    }

    public function show(int $id, Request $request)
    {
        $c = Certificate::where('user_id', $request->user()->id)->findOrFail($id);
        return response()->json($c);
    }

    public function generate(Request $request)
    {
        $data = $request->validate([
            'itemType' => ['required','integer','in:1,2'],
            'itemId' => ['required','integer','min:1'],
        ]);
        $c = Certificate::create([
            'user_id' => $request->user()->id,
            'item_type' => $data['itemType'],
            'item_id' => $data['itemId'],
            'certificate_number' => 'CERT-'.date('Y').'-'.str_pad((string) (Certificate::max('id') + 1), 6, '0', STR_PAD_LEFT),
            'completion_percentage' => 100,
            'final_score' => 100,
            'certificate_url' => null,
            'is_valid' => true,
        ]);
        return response()->json(['success' => true, 'certificate' => $c], 201);
    }

    public function download(int $id, Request $request)
    {
        $c = Certificate::where('user_id', $request->user()->id)->findOrFail($id);
        return response()->json(['success' => true, 'url' => $c->certificate_url]);
    }

    public function verify(string $number)
    {
        $c = Certificate::where('certificate_number', $number)->first();
        return response()->json(['valid' => (bool) $c, 'certificate' => $c]);
    }
}


