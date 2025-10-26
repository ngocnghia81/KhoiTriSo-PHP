<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;

/**
 * Service để quản lý messages đa ngôn ngữ
 */
class MessageService
{
    /**
     * Lấy message theo message code và ngôn ngữ
     *
     * @param string $messageCode Mã thông báo
     * @param string $language Ngôn ngữ (mặc định là 'vi')
     * @param array $params Tham số để thay thế trong message
     * @return string Message đã được dịch
     */
    public function getMessage(string $messageCode, string $language = 'vi', array $params = []): string
    {
        $messages = Config::get("messages.{$language}");
        
        if (!$messages || !isset($messages[$messageCode])) {
            // Fallback về ngôn ngữ mặc định nếu không tìm thấy
            $defaultLanguage = Config::get('messages.default', 'vi');
            $defaultMessages = Config::get("messages.{$defaultLanguage}");
            
            if (!$defaultMessages || !isset($defaultMessages[$messageCode])) {
                return "Message not found: {$messageCode}";
            }
            
            return $this->replaceParams($defaultMessages[$messageCode], $params);
        }
        
        return $this->replaceParams($messages[$messageCode], $params);
    }

    /**
     * Lấy message với ngôn ngữ từ request header
     *
     * @param string $messageCode Mã thông báo
     * @param string|null $acceptLanguage Header Accept-Language từ request
     * @param array $params Tham số để thay thế trong message
     * @return string Message đã được dịch
     */
    public function getMessageFromHeader(string $messageCode, ?string $acceptLanguage = null, array $params = []): string
    {
        $language = $this->parseAcceptLanguage($acceptLanguage);
        return $this->getMessage($messageCode, $language, $params);
    }

    /**
     * Parse Accept-Language header để lấy ngôn ngữ ưu tiên
     *
     * @param string|null $acceptLanguage Header Accept-Language
     * @return string Ngôn ngữ được hỗ trợ
     */
    public function parseAcceptLanguage(?string $acceptLanguage = null): string
    {
        if (!$acceptLanguage) {
            return Config::get('messages.default', 'vi');
        }

        // Parse Accept-Language header (ví dụ: "vi-VN,vi;q=0.9,en;q=0.8")
        $languages = [];
        $parts = explode(',', $acceptLanguage);
        
        foreach ($parts as $part) {
            $part = trim($part);
            $qValue = 1.0;
            
            if (strpos($part, ';q=') !== false) {
                [$code, $q] = explode(';q=', $part);
                $qValue = (float) $q;
            } else {
                $code = $part;
            }
            
            // Lấy phần đầu (vi từ vi-VN)
            $code = explode('-', $code)[0];
            
            $languages[] = [
                'code' => $code,
                'quality' => $qValue
            ];
        }
        
        // Sắp xếp theo quality giảm dần
        usort($languages, function($a, $b) {
            return $b['quality'] <=> $a['quality'];
        });

        // Tìm ngôn ngữ được hỗ trợ đầu tiên
        $supportedLanguages = Config::get('messages.supported', ['vi', 'en']);
        foreach ($languages as $lang) {
            if (in_array($lang['code'], $supportedLanguages)) {
                return $lang['code'];
            }
        }

        return Config::get('messages.default', 'vi');
    }

    /**
     * Thay thế tham số trong message template
     *
     * @param string $template Template message
     * @param array $params Tham số để thay thế
     * @return string Message đã được thay thế tham số
     */
    private function replaceParams(string $template, array $params = []): string
    {
        if (empty($params)) {
            return $template;
        }

        $result = $template;
        foreach ($params as $key => $value) {
            $placeholder = "{{$key}}";
            $result = str_replace($placeholder, (string) $value, $result);
        }

        return $result;
    }

    /**
     * Lấy tất cả messages cho một ngôn ngữ
     *
     * @param string $language Ngôn ngữ
     * @return array Object chứa tất cả messages
     */
    public function getAllMessages(string $language = 'vi'): array
    {
        return Config::get("messages.{$language}", []);
    }

    /**
     * Kiểm tra xem message code có tồn tại không
     *
     * @param string $messageCode Mã thông báo
     * @return bool True nếu tồn tại
     */
    public function hasMessage(string $messageCode): bool
    {
        $defaultLanguage = Config::get('messages.default', 'vi');
        $messages = Config::get("messages.{$defaultLanguage}", []);
        return isset($messages[$messageCode]);
    }

    /**
     * Lấy danh sách các ngôn ngữ được hỗ trợ
     *
     * @return array Array các ngôn ngữ được hỗ trợ
     */
    public function getSupportedLanguages(): array
    {
        return Config::get('messages.supported', ['vi', 'en']);
    }
}

