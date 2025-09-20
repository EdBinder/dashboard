<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class GoogleImagesService
{
    private const GOOGLE_CUSTOM_SEARCH_API_URL = 'https://www.googleapis.com/customsearch/v1';
    private const CACHE_TTL = 86400; // 24 hours in seconds
    private const MAX_RETRIES = 3;
    private const REQUEST_TIMEOUT = 15;

    private string $apiKey;
    private string $searchEngineId;

    public function __construct()
    {
        $this->apiKey = config('services.google.custom_search_api_key');
        $this->searchEngineId = config('services.google.custom_search_engine_id');
        
        if (empty($this->apiKey) || empty($this->searchEngineId)) {
            throw new Exception('Google Custom Search API credentials not configured');
        }
    }

    /**
     * Search for an image of the given food item
     *
     * @param string $foodName The name of the food to search for
     * @param bool $useCache Whether to use cached results
     * @return array|null Returns array with image URL and metadata, or null if no image found
     */
    public function searchFoodImage(string $foodName, bool $useCache = true): ?array
    {
        if (empty(trim($foodName))) {
            return null;
        }

        $cacheKey = 'google_food_image_' . md5(strtolower(trim($foodName)));
        
        // Try to get from cache first
        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $imageData = $this->performImageSearch($foodName);
            
            // Cache the result (even if null) to avoid repeated API calls
            Cache::put($cacheKey, $imageData, self::CACHE_TTL);
            
            return $imageData;
        } catch (Exception $e) {
            Log::warning('GoogleImagesService search failed', [
                'food_name' => $foodName,
                'error' => $e->getMessage()
            ]);
            
            // Return null on error, don't cache errors
            return null;
        }
    }

    /**
     * Search for multiple food images in batch
     *
     * @param array $foodNames Array of food names to search for
     * @param bool $useCache Whether to use cached results
     * @return array Associative array with food names as keys and image data as values
     */
    public function searchMultipleFoodImages(array $foodNames, bool $useCache = true): array
    {
        $results = [];
        
        foreach ($foodNames as $foodName) {
            $results[$foodName] = $this->searchFoodImage($foodName, $useCache);
            
            // Add a small delay between requests to be respectful to the API
            if (count($foodNames) > 1) {
                usleep(100000); // 100ms delay
            }
        }
        
        return $results;
    }

    /**
     * Perform the actual image search using Google Custom Search API
     *
     * @param string $foodName
     * @return array|null
     * @throws Exception
     */
    private function performImageSearch(string $foodName): ?array
    {
        $searchQuery = $this->buildSearchQuery($foodName);
        
        $params = [
            'key' => $this->apiKey,
            'cx' => $this->searchEngineId,
            'q' => $searchQuery,
            'searchType' => 'image',
            'num' => 3, // Get 3 results to have fallbacks
            'safe' => 'active',
            'imgType' => 'photo',
            'imgSize' => 'medium',
            'imgColorType' => 'color',
            'fileType' => 'jpg,png',
            'rights' => 'cc_publicdomain,cc_attribute,cc_sharealike,cc_noncommercial'
        ];

        $retries = 0;
        while ($retries < self::MAX_RETRIES) {
            try {
                $response = Http::withOptions([
                    'verify' => false,  // Disable SSL certificate verification for development
                    'timeout' => self::REQUEST_TIMEOUT
                ])->get(self::GOOGLE_CUSTOM_SEARCH_API_URL, $params);

                if ($response->successful()) {
                    $data = $response->json();
                    return $this->extractBestImage($data, $foodName);
                }

                if ($response->status() === 429) {
                    // Rate limit hit, wait and retry
                    sleep(pow(2, $retries)); // Exponential backoff
                    $retries++;
                    continue;
                }

                throw new Exception('API request failed with status: ' . $response->status());
            } catch (Exception $e) {
                $retries++;
                if ($retries >= self::MAX_RETRIES) {
                    throw $e;
                }
                sleep(1);
            }
        }

        return null;
    }

    /**
     * Build an optimized search query for food images
     *
     * @param string $foodName
     * @return string
     */
    private function buildSearchQuery(string $foodName): string
    {
        // Simply use the food name as-is with just basic food context
        $searchTerms = [
            trim($foodName),
            'food'
        ];

        return implode(' ', $searchTerms);
    }

    /**
     * Extract the best image from Google Custom Search results
     *
     * @param array $searchData
     * @param string $originalFoodName
     * @return array|null
     */
    private function extractBestImage(array $searchData, string $originalFoodName): ?array
    {
        if (!isset($searchData['items']) || empty($searchData['items'])) {
            return null;
        }

        foreach ($searchData['items'] as $item) {
            if (!isset($item['link'])) {
                continue;
            }

            // Validate that it's a reasonable image URL
            if ($this->isValidImageUrl($item['link'])) {
                return [
                    'url' => $item['link'],
                    'title' => $item['title'] ?? '',
                    'width' => $item['image']['width'] ?? null,
                    'height' => $item['image']['height'] ?? null,
                    'thumbnail' => $item['image']['thumbnailLink'] ?? null,
                    'source_page' => $item['image']['contextLink'] ?? '',
                    'search_query' => $originalFoodName,
                    'cached_at' => now()->toISOString()
                ];
            }
        }

        return null;
    }

    /**
     * Validate if a URL is a reasonable image URL
     *
     * @param string $url
     * @return bool
     */
    private function isValidImageUrl(string $url): bool
    {
        // Basic URL validation
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        // Check if it's likely an image based on extension or content type
        $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $extension = strtolower(pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION));
        
        if (in_array($extension, $imageExtensions)) {
            return true;
        }

        // If no extension, it might still be an image (some APIs return images without extensions)
        // We'll accept it and let the frontend handle validation
        return true;
    }

    /**
     * Clear cached images for a specific food name
     *
     * @param string $foodName
     * @return bool
     */
    public function clearFoodImageCache(string $foodName): bool
    {
        $cacheKey = 'google_food_image_' . md5(strtolower(trim($foodName)));
        return Cache::forget($cacheKey);
    }

    /**
     * Clear all cached food images
     *
     * @return bool
     */
    public function clearAllFoodImageCache(): bool
    {
        // This is a simple implementation - in production you might want to use cache tags
        return Cache::flush();
    }
}