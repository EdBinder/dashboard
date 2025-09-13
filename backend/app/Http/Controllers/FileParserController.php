<?php

namespace App\Http\Controllers;

use App\Services\NextcloudService;
use App\Services\CsvParserService;
use App\Services\XmlParserService;
use App\Services\ExcelParserService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class FileParserController extends Controller
{
    private NextcloudService $nextcloudService;
    private CsvParserService $csvParser;
    private XmlParserService $xmlParser;
    private ExcelParserService $excelParser;

    public function __construct(
        NextcloudService $nextcloudService,
        CsvParserService $csvParser,
        XmlParserService $xmlParser,
        ExcelParserService $excelParser
    ) {
        $this->nextcloudService = $nextcloudService;
        $this->csvParser = $csvParser;
        $this->xmlParser = $xmlParser;
        $this->excelParser = $excelParser;
    }

    /**
     * Parse CSV/XML file from Nextcloud and return structured JSON data
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function parse(Request $request): JsonResponse
    {
        try {
            Log::info('Starting file parsing request');

            // Get file path from environment or request
            $filePath = env('NEXTCLOUD_FILE_PATH', '/Documents/proposals.csv');
            
            Log::info('Fetching file from Nextcloud', ['file_path' => $filePath]);

            // Test Nextcloud connection first
            if (!$this->nextcloudService->testConnection()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unable to connect to Nextcloud server',
                    'message' => 'Please check Nextcloud credentials and server availability'
                ], 503);
            }

            // Fetch file content from Nextcloud
            $fileContent = $this->nextcloudService->getFileContent($filePath);
            
            if (empty($fileContent)) {
                return response()->json([
                    'success' => false,
                    'error' => 'File is empty or could not be read',
                    'file_path' => $filePath
                ], 404);
            }

            // Determine file type and parse accordingly
            $fileExtension = pathinfo($filePath, PATHINFO_EXTENSION);
            $parsedData = null;

            switch (strtolower($fileExtension)) {
                case 'csv':
                    Log::info('Parsing CSV file');
                    $delimiter = $this->csvParser->detectDelimiter($fileContent);
                    $parsedData = $this->csvParser->parse($fileContent, $delimiter);
                    break;

                case 'xml':
                    Log::info('Parsing XML file');
                    $parsedData = $this->xmlParser->parse($fileContent);
                    break;

                case 'xlsx':
                case 'xls':
                    Log::info('Parsing Excel file', ['extension' => $fileExtension]);
                    $parsedData = $this->excelParser->parse($fileContent);
                    break;

                default:
                    return response()->json([
                        'success' => false,
                        'error' => 'Unsupported file format',
                        'supported_formats' => ['csv', 'xml', 'xlsx', 'xls'],
                        'detected_format' => $fileExtension
                    ], 400);
            }

            Log::info('File parsing completed successfully', [
                'file_type' => $fileExtension,
                'records_count' => isset($parsedData['data']) ? count($parsedData['data']) : 0
            ]);

            return response()->json([
                'success' => true,
                'file_info' => [
                    'path' => $filePath,
                    'type' => $fileExtension,
                    'size' => strlen($fileContent)
                ],
                'parsing_result' => $parsedData,
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            Log::error('File parsing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'File parsing failed',
                'message' => $e->getMessage(),
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    /**
     * Health check endpoint to verify all services are working
     * 
     * @return JsonResponse
     */
    public function health(): JsonResponse
    {
        $status = [
            'nextcloud_connection' => false,
            'services_loaded' => true,
            'timestamp' => now()->toISOString()
        ];

        try {
            $status['nextcloud_connection'] = $this->nextcloudService->testConnection();
        } catch (\Exception $e) {
            Log::warning('Health check - Nextcloud connection failed', [
                'error' => $e->getMessage()
            ]);
        }

        $overallStatus = $status['nextcloud_connection'] && $status['services_loaded'];

        return response()->json([
            'status' => $overallStatus ? 'healthy' : 'degraded',
            'checks' => $status
        ], $overallStatus ? 200 : 503);
    }
}
