<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FileParserController;
use App\Http\Controllers\MensaController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'service' => 'laravel-dashboard-api'
    ]);
});

// File parsing endpoints
Route::get('/proposals', [FileParserController::class, 'parse']);
Route::get('/parser/health', [FileParserController::class, 'health']);

// Mensa endpoints
Route::get('/mensa', [MensaController::class, 'getMenuData']);

