<?php

namespace App\Console\Commands;

use App\Services\GoogleImagesService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class TestGoogleImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:google-images {food?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test Google Images API integration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing Google Images API...');
        
        // Test configuration
        $apiKey = config('services.google.custom_search_api_key');
        $searchEngineId = config('services.google.custom_search_engine_id');
        
        $this->info("API Key: " . ($apiKey ? 'Set (' . substr($apiKey, 0, 10) . '...)' : 'NOT SET'));
        $this->info("Search Engine ID: " . ($searchEngineId ? 'Set (' . $searchEngineId . ')' : 'NOT SET'));
        
        if (!$apiKey || !$searchEngineId) {
            $this->error('Google API credentials not configured!');
            return 1;
        }
        
        // Test direct API call
        $this->info("\n--- Testing Direct API Call ---");
        $testQuery = $this->argument('food') ?? 'schnitzel food dish';
        $this->info("Search query: " . $testQuery);
        
        $params = [
            'key' => $apiKey,
            'cx' => $searchEngineId,
            'q' => $testQuery,
            'searchType' => 'image',
            'num' => 1,
            'safe' => 'active'
        ];
        
        try {
            $response = Http::withOptions([
                'verify' => false,  // Disable SSL verification for development
                'timeout' => 15
            ])->get('https://www.googleapis.com/customsearch/v1', $params);
            
            $this->info("Response Status: " . $response->status());
            
            if ($response->successful()) {
                $data = $response->json();
                $this->info("Response received successfully");
                
                if (isset($data['items']) && !empty($data['items'])) {
                    $this->info("Found " . count($data['items']) . " image(s)");
                    $firstImage = $data['items'][0];
                    $this->info("First image URL: " . $firstImage['link']);
                    $this->info("Title: " . $firstImage['title']);
                } else {
                    $this->warn("No images found in response");
                    $this->info("Response structure: " . json_encode(array_keys($data), JSON_PRETTY_PRINT));
                }
            } else {
                $this->error("API call failed with status: " . $response->status());
                $this->error("Response body: " . $response->body());
            }
            
        } catch (\Exception $e) {
            $this->error("Exception: " . $e->getMessage());
        }
        
        // Test GoogleImagesService
        $this->info("\n--- Testing GoogleImagesService ---");
        try {
            $googleImagesService = app(GoogleImagesService::class);
            $result = $googleImagesService->searchFoodImage($testQuery, false); // Don't use cache
            
            if ($result) {
                $this->info("Service returned image data:");
                $this->info("URL: " . $result['url']);
                $this->info("Title: " . $result['title']);
            } else {
                $this->warn("Service returned NULL");
            }
            
        } catch (\Exception $e) {
            $this->error("GoogleImagesService error: " . $e->getMessage());
        }
        
        return 0;
    }
}
