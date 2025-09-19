<?php

namespace App\Http\Controllers;

use App\Services\MensaService;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MensaController extends Controller
{
    private MensaService $mensaService;

    public function __construct(MensaService $mensaService)
    {
        $this->mensaService = $mensaService;
    }

    /**
     * Get current and next day menu data
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            $data = $this->mensaService->getMenuData();
            
            return response()->json($data, 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'data' => null
            ], 500);
        }
    }
}