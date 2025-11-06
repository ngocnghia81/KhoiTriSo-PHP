<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cookie;

class LanguageController extends Controller
{
    /**
     * Get current language
     * GET /api/language
     */
    public function getCurrent(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'current' => App::getLocale(),
                'default' => config('app.locale'),
                'fallback' => config('app.fallback_locale'),
                'supported' => $this->getSupportedLanguages(),
            ]
        ]);
    }

    /**
     * Get supported languages
     * GET /api/language/supported
     */
    public function getSupported()
    {
        return response()->json([
            'success' => true,
            'data' => $this->getSupportedLanguages()
        ]);
    }

    /**
     * Set language preference
     * POST /api/language/set
     */
    public function setLanguage(Request $request)
    {
        $request->validate([
            'language' => 'required|in:vi,en'
        ]);

        $language = $request->input('language');
        
        // Set application locale
        App::setLocale($language);

        // Create response with cookie
        $response = response()->json([
            'success' => true,
            'message' => __('messages.success'),
            'data' => [
                'language' => $language
            ]
        ]);

        // Set cookie for 1 year
        $cookie = Cookie::make('locale', $language, 525600, '/', null, false, false);

        return $response->cookie($cookie);
    }

    /**
     * Get translations for current language
     * GET /api/language/translations
     */
    public function getTranslations(Request $request)
    {
        $locale = App::getLocale();
        $namespace = $request->input('namespace', 'messages');

        try {
            $translations = __("{$namespace}", [], $locale);

            if (is_array($translations)) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'locale' => $locale,
                        'translations' => $translations
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Translations not found for namespace: ' . $namespace
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load translations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all translations for all supported languages
     * GET /api/language/translations/all
     */
    public function getAllTranslations(Request $request)
    {
        $namespace = $request->input('namespace', 'messages');
        $supportedLanguages = ['vi', 'en'];
        $translations = [];

        foreach ($supportedLanguages as $lang) {
            try {
                $trans = __("{$namespace}", [], $lang);
                if (is_array($trans)) {
                    $translations[$lang] = $trans;
                }
            } catch (\Exception $e) {
                // Skip if translation file doesn't exist
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'translations' => $translations,
                'supported_languages' => $supportedLanguages
            ]
        ]);
    }

    /**
     * Helper method to get supported languages with details
     */
    private function getSupportedLanguages()
    {
        return [
            [
                'code' => 'vi',
                'name' => 'Tiếng Việt',
                'name_en' => 'Vietnamese',
                'flag' => '🇻🇳',
                'direction' => 'ltr',
            ],
            [
                'code' => 'en',
                'name' => 'English',
                'name_en' => 'English',
                'flag' => '🇬🇧',
                'direction' => 'ltr',
            ],
        ];
    }
}
