<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class NextcloudDeckService
{
    private Client $client;
    private string $baseUrl;
    private string $username;
    private string $password;

    public function __construct()
    {
        $this->baseUrl = config('services.nextcloud.url', env('NEXTCLOUD_URL', 'https://your-nextcloud-server.com'));
        $this->username = config('services.nextcloud.username', env('NEXTCLOUD_USERNAME', 'your-username'));
        $this->password = config('services.nextcloud.password', env('NEXTCLOUD_PASSWORD', 'your-password'));
        
        $this->client = new Client([
            'timeout' => 30,
            'verify' => false, // Set to true in production with proper SSL
        ]);
    }

    /**
     * Get all boards from Nextcloud Deck
     * 
     * @return array
     * @throws \Exception
     */
    public function getBoards(): array
    {
        try {
            $deckUrl = rtrim($this->baseUrl, '/') . '/index.php/apps/deck/api/v1.0/boards';
            
            Log::info('Starting Nextcloud Deck API Request - Boards', [
                'url' => $deckUrl,
                'username' => $this->username,
                'method' => 'GET'
            ]);

            $startTime = microtime(true);
            $response = $this->client->get($deckUrl, [
                'auth' => [$this->username, $this->password],
                'headers' => [
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'OCS-APIRequest' => 'true',
                    'User-Agent' => 'Dashboard-API/1.0'
                ]
            ]);

            $duration = (microtime(true) - $startTime) * 1000;
            $statusCode = $response->getStatusCode();
            
            if ($statusCode !== 200) {
                throw new \Exception("Nextcloud Deck API returned status code: {$statusCode}");
            }

            $content = $response->getBody()->getContents();
            $boards = json_decode($content, true);

            Log::info('Nextcloud Deck API Request Complete - Boards', [
                'status_code' => $statusCode,
                'duration_ms' => round($duration, 2),
                'boards_count' => is_array($boards) ? count($boards) : 0,
                'content_length' => strlen($content)
            ]);

            return $boards ?? [];

        } catch (GuzzleException $e) {
            Log::error('Nextcloud Deck API Request Failed - Boards', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'url' => $deckUrl ?? 'unknown'
            ]);
            throw new \Exception("Failed to fetch boards from Nextcloud Deck: " . $e->getMessage());
        }
    }

    /**
     * Get all stacks for a specific board
     * 
     * @param int $boardId
     * @return array
     * @throws \Exception
     */
    public function getStacks(int $boardId): array
    {
        try {
            $deckUrl = rtrim($this->baseUrl, '/') . "/index.php/apps/deck/api/v1.0/boards/{$boardId}/stacks";
            
            Log::info('Starting Nextcloud Deck API Request - Stacks', [
                'url' => $deckUrl,
                'board_id' => $boardId,
                'username' => $this->username,
                'method' => 'GET'
            ]);

            $startTime = microtime(true);
            $response = $this->client->get($deckUrl, [
                'auth' => [$this->username, $this->password],
                'headers' => [
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'OCS-APIRequest' => 'true',
                    'User-Agent' => 'Dashboard-API/1.0'
                ]
            ]);

            $duration = (microtime(true) - $startTime) * 1000;
            $statusCode = $response->getStatusCode();
            
            if ($statusCode !== 200) {
                throw new \Exception("Nextcloud Deck API returned status code: {$statusCode}");
            }

            $content = $response->getBody()->getContents();
            $stacks = json_decode($content, true);

            Log::info('Nextcloud Deck API Request Complete - Stacks', [
                'status_code' => $statusCode,
                'duration_ms' => round($duration, 2),
                'board_id' => $boardId,
                'stacks_count' => is_array($stacks) ? count($stacks) : 0,
                'content_length' => strlen($content)
            ]);

            return $stacks ?? [];

        } catch (GuzzleException $e) {
            Log::error('Nextcloud Deck API Request Failed - Stacks', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'board_id' => $boardId,
                'url' => $deckUrl ?? 'unknown'
            ]);
            throw new \Exception("Failed to fetch stacks from Nextcloud Deck: " . $e->getMessage());
        }
    }

    /**
     * Get all cards for a specific stack
     * 
     * @param int $boardId
     * @param int $stackId
     * @return array
     * @throws \Exception
     */
    public function getCards(int $boardId, int $stackId): array
    {
        try {
            // Try the alternative endpoint format first - sometimes cards are included with stacks
            $deckUrl = rtrim($this->baseUrl, '/') . "/index.php/apps/deck/api/v1.0/boards/{$boardId}/stacks/{$stackId}";
            
            Log::info('Starting Nextcloud Deck API Request - Cards via Stack', [
                'url' => $deckUrl,
                'board_id' => $boardId,
                'stack_id' => $stackId,
                'username' => $this->username,
                'method' => 'GET'
            ]);

            $startTime = microtime(true);
            $response = $this->client->get($deckUrl, [
                'auth' => [$this->username, $this->password],
                'headers' => [
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'OCS-APIRequest' => 'true',
                    'User-Agent' => 'Dashboard-API/1.0'
                ]
            ]);

            $duration = (microtime(true) - $startTime) * 1000;
            $statusCode = $response->getStatusCode();
            
            if ($statusCode !== 200) {
                throw new \Exception("Nextcloud Deck API returned status code: {$statusCode}");
            }

            $content = $response->getBody()->getContents();
            $stackData = json_decode($content, true);

            // Extract cards from the stack data
            $cards = $stackData['cards'] ?? [];

            Log::info('Nextcloud Deck API Request Complete - Cards via Stack', [
                'status_code' => $statusCode,
                'duration_ms' => round($duration, 2),
                'board_id' => $boardId,
                'stack_id' => $stackId,
                'cards_count' => is_array($cards) ? count($cards) : 0,
                'content_length' => strlen($content)
            ]);

            return $cards;

        } catch (GuzzleException $e) {
            Log::warning('First attempt failed, trying alternative endpoint', [
                'error' => $e->getMessage(),
                'board_id' => $boardId,
                'stack_id' => $stackId
            ]);

            // Try the direct cards endpoint as fallback
            try {
                $deckUrl = rtrim($this->baseUrl, '/') . "/index.php/apps/deck/api/v1.0/boards/{$boardId}/stacks/{$stackId}/cards";
                
                Log::info('Starting Nextcloud Deck API Request - Cards Direct', [
                    'url' => $deckUrl,
                    'board_id' => $boardId,
                    'stack_id' => $stackId,
                    'username' => $this->username,
                    'method' => 'GET'
                ]);

                $startTime = microtime(true);
                $response = $this->client->get($deckUrl, [
                    'auth' => [$this->username, $this->password],
                    'headers' => [
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                        'OCS-APIRequest' => 'true',
                        'User-Agent' => 'Dashboard-API/1.0'
                    ]
                ]);

                $duration = (microtime(true) - $startTime) * 1000;
                $statusCode = $response->getStatusCode();
                
                if ($statusCode !== 200) {
                    throw new \Exception("Nextcloud Deck API returned status code: {$statusCode}");
                }

                $content = $response->getBody()->getContents();
                $cards = json_decode($content, true);

                Log::info('Nextcloud Deck API Request Complete - Cards Direct', [
                    'status_code' => $statusCode,
                    'duration_ms' => round($duration, 2),
                    'board_id' => $boardId,
                    'stack_id' => $stackId,
                    'cards_count' => is_array($cards) ? count($cards) : 0,
                    'content_length' => strlen($content)
                ]);

                return $cards ?? [];

            } catch (GuzzleException $e2) {
                Log::error('Both card endpoints failed', [
                    'first_error' => $e->getMessage(),
                    'second_error' => $e2->getMessage(),
                    'board_id' => $boardId,
                    'stack_id' => $stackId,
                    'url' => $deckUrl ?? 'unknown'
                ]);
                throw new \Exception("Failed to fetch cards from Nextcloud Deck: " . $e2->getMessage());
            }
        }
    }

    /**
     * Get a complete board with all stacks and cards
     * 
     * @param int $boardId
     * @return array
     * @throws \Exception
     */
    public function getBoardComplete(int $boardId): array
    {
        try {
            $deckUrl = rtrim($this->baseUrl, '/') . "/index.php/apps/deck/api/v1.0/boards/{$boardId}";
            
            Log::info('Starting Nextcloud Deck API Request - Complete Board', [
                'url' => $deckUrl,
                'board_id' => $boardId,
                'username' => $this->username,
                'method' => 'GET'
            ]);

            $startTime = microtime(true);
            $response = $this->client->get($deckUrl, [
                'auth' => [$this->username, $this->password],
                'headers' => [
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'OCS-APIRequest' => 'true',
                    'User-Agent' => 'Dashboard-API/1.0'
                ]
            ]);

            $duration = (microtime(true) - $startTime) * 1000;
            $statusCode = $response->getStatusCode();
            
            if ($statusCode !== 200) {
                throw new \Exception("Nextcloud Deck API returned status code: {$statusCode}");
            }

            $content = $response->getBody()->getContents();
            $boardData = json_decode($content, true);

            Log::info('Nextcloud Deck API Request Complete - Complete Board', [
                'status_code' => $statusCode,
                'duration_ms' => round($duration, 2),
                'board_id' => $boardId,
                'stacks_count' => isset($boardData['stacks']) ? count($boardData['stacks']) : 0,
                'content_length' => strlen($content)
            ]);

            return $boardData ?? [];

        } catch (GuzzleException $e) {
            Log::error('Nextcloud Deck API Request Failed - Complete Board', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'board_id' => $boardId,
                'url' => $deckUrl ?? 'unknown'
            ]);
            throw new \Exception("Failed to fetch board from Nextcloud Deck: " . $e->getMessage());
        }
    }

    /**
     * Get all tasks from all boards (aggregated view)
     * 
     * @param array $boardIds Optional array of specific board IDs to fetch. If empty, fetches from all boards.
     * @return array Structured array with boards, stacks, and cards
     * @throws \Exception
     */
    public function getAllTasks(array $boardIds = []): array
    {
        try {
            Log::info('Starting aggregated task fetch from Nextcloud Deck', [
                'specific_board_ids' => $boardIds,
                'fetch_all_boards' => empty($boardIds)
            ]);

            $result = [
                'boards' => [],
                'total_cards' => 0,
                'fetched_at' => now()->toISOString()
            ];

            // If no specific board IDs provided, get all boards
            if (empty($boardIds)) {
                $allBoards = $this->getBoards();
                $boardIds = array_column($allBoards, 'id');
                Log::info('Fetching from all available boards', ['board_count' => count($boardIds)]);
            }

            foreach ($boardIds as $boardId) {
                try {
                    // Try to get complete board data in one call
                    $boardData = $this->getBoardComplete($boardId);
                    
                    $board = [
                        'id' => $boardData['id'] ?? $boardId,
                        'title' => $boardData['title'] ?? 'Untitled Board',
                        'color' => $boardData['color'] ?? null,
                        'stacks' => [],
                        'total_cards' => 0
                    ];

                    // Process stacks from the complete board data
                    $stacks = $boardData['stacks'] ?? [];
                    $hasCardsInStacks = false;
                    
                    foreach ($stacks as $stack) {
                        $stackData = [
                            'id' => $stack['id'],
                            'title' => $stack['title'],
                            'order' => $stack['order'] ?? 0,
                            'cards' => []
                        ];

                        // Check if cards are included in the stack data
                        $cards = $stack['cards'] ?? [];
                        
                        if (!empty($cards)) {
                            $hasCardsInStacks = true;
                            foreach ($cards as $card) {
                                $stackData['cards'][] = [
                                    'id' => $card['id'],
                                    'title' => $card['title'],
                                    'description' => $card['description'] ?? '',
                                    'duedate' => $card['duedate'] ?? null,
                                    'labels' => $card['labels'] ?? [],
                                    'assignedUsers' => $card['assignedUsers'] ?? [],
                                    'createdAt' => $card['createdAt'] ?? null,
                                    'lastModified' => $card['lastModified'] ?? null,
                                    'archived' => $card['archived'] ?? false,
                                    'done' => $card['done'] ?? false,
                                    'order' => $card['order'] ?? 0,
                                    'type' => $card['type'] ?? 'plain'
                                ];
                            }
                        } else {
                            // Cards not included in stack data, fetch them individually
                            try {
                                $fetchedCards = $this->getCards($boardId, $stack['id']);
                                foreach ($fetchedCards as $card) {
                                    $stackData['cards'][] = [
                                        'id' => $card['id'],
                                        'title' => $card['title'],
                                        'description' => $card['description'] ?? '',
                                        'duedate' => $card['duedate'] ?? null,
                                        'labels' => $card['labels'] ?? [],
                                        'assignedUsers' => $card['assignedUsers'] ?? [],
                                        'createdAt' => $card['createdAt'] ?? null,
                                        'lastModified' => $card['lastModified'] ?? null,
                                        'archived' => $card['archived'] ?? false,
                                        'done' => $card['done'] ?? false,
                                        'order' => $card['order'] ?? 0,
                                        'type' => $card['type'] ?? 'plain'
                                    ];
                                }
                                $cards = $fetchedCards; // Update cards count
                            } catch (\Exception $cardError) {
                                Log::warning('Failed to fetch cards for stack', [
                                    'board_id' => $boardId,
                                    'stack_id' => $stack['id'],
                                    'error' => $cardError->getMessage()
                                ]);
                                // Continue with empty cards for this stack
                                $cards = [];
                            }
                        }

                        $board['stacks'][] = $stackData;
                        $board['total_cards'] += count($cards);
                    }

                    Log::info('Board processing complete', [
                        'board_id' => $boardId,
                        'board_title' => $board['title'],
                        'stacks_count' => count($board['stacks']),
                        'total_cards' => $board['total_cards'],
                        'cards_included_in_stacks' => $hasCardsInStacks
                    ]);

                    $result['boards'][] = $board;
                    $result['total_cards'] += $board['total_cards'];

                } catch (\Exception $e) {
                    Log::warning('Failed to fetch data for board, trying fallback method', [
                        'board_id' => $boardId,
                        'error' => $e->getMessage()
                    ]);

                    // Fallback to the original method
                    try {
                        $board = [
                            'id' => $boardId,
                            'stacks' => [],
                            'total_cards' => 0
                        ];

                        // Get stacks for this board
                        $stacks = $this->getStacks($boardId);
                        
                        foreach ($stacks as $stack) {
                            $stackData = [
                                'id' => $stack['id'],
                                'title' => $stack['title'],
                                'order' => $stack['order'] ?? 0,
                                'cards' => []
                            ];

                            // Get cards for this stack
                            $cards = $this->getCards($boardId, $stack['id']);
                            
                            foreach ($cards as $card) {
                                $stackData['cards'][] = [
                                    'id' => $card['id'],
                                    'title' => $card['title'],
                                    'description' => $card['description'] ?? '',
                                    'duedate' => $card['duedate'] ?? null,
                                    'labels' => $card['labels'] ?? [],
                                    'assignedUsers' => $card['assignedUsers'] ?? [],
                                    'createdAt' => $card['createdAt'] ?? null,
                                    'lastModified' => $card['lastModified'] ?? null,
                                    'archived' => $card['archived'] ?? false,
                                    'done' => $card['done'] ?? false,
                                    'order' => $card['order'] ?? 0
                                ];
                            }

                            $board['stacks'][] = $stackData;
                            $board['total_cards'] += count($cards);
                        }

                        $result['boards'][] = $board;
                        $result['total_cards'] += $board['total_cards'];

                    } catch (\Exception $e2) {
                        Log::warning('Fallback method also failed for board', [
                            'board_id' => $boardId,
                            'fallback_error' => $e2->getMessage()
                        ]);
                        // Continue with other boards even if this one fails completely
                        continue;
                    }
                }
            }

            Log::info('Aggregated task fetch complete', [
                'total_boards_processed' => count($result['boards']),
                'total_cards_fetched' => $result['total_cards']
            ]);

            return $result;

        } catch (\Exception $e) {
            Log::error('Failed to fetch aggregated tasks from Nextcloud Deck', [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Test connection to Nextcloud Deck API
     * 
     * @return array Connection status and basic info
     */
    public function testConnection(): array
    {
        try {
            $boards = $this->getBoards();
            return [
                'connected' => true,
                'boards_count' => count($boards),
                'boards' => array_map(function ($board) {
                    return [
                        'id' => $board['id'],
                        'title' => $board['title'] ?? 'Untitled Board'
                    ];
                }, $boards)
            ];
        } catch (\Exception $e) {
            return [
                'connected' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}