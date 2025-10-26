<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

# KhoiTriSo Backend API

Laravel backend API cho hệ thống KhoiTriSo với **Multi-Language Response System**.

## 🎉 PROJECT STATUS: 100% COMPLETE!

✅ **All 28 Controllers Converted** to Multi-Language Response System!

## 📚 Documentation

### ⭐ Quick Start
- **[RESPONSE_FORMAT.md](RESPONSE_FORMAT.md)** - Response format chi tiết (BẮT ĐẦU TỪ ĐÂY!)
- **[QUICK_START.md](QUICK_START.md)** - Hướng dẫn nhanh sử dụng
- **[FINAL_STATUS.md](FINAL_STATUS.md)** - Tổng quan hoàn thành 100%

### 📖 Complete Guides
- **[🎉_100_PERCENT_COMPLETE.md](🎉_100_PERCENT_COMPLETE.md)** - Chi tiết completion (All 28 controllers)
- **[PROJECT_MIGRATION_COMPLETE_GUIDE.md](PROJECT_MIGRATION_COMPLETE_GUIDE.md)** - Complete migration guide
- **[MULTI_LANGUAGE_USAGE.md](MULTI_LANGUAGE_USAGE.md)** - Hướng dẫn đầy đủ
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Implementation summary

## 🚀 Response System

### Success Response (Đơn giản)
```json
{
    "success": true,
    "message": "Thành công",
    "data": {...}
}
```
**Note:** KHÔNG có messageCode, chỉ có message đơn giản

### Error Response (Chi tiết)
```json
{
    "success": false,
    "messageCode": "USER_NOT_FOUND",
    "message": "Không tìm thấy người dùng"
}
```
**Note:** CÓ messageCode để biết lỗi cụ thể

## 🎯 Quick Example

```php
class UserController extends BaseController
{
    public function show($id)
    {
        $user = User::find($id);
        
        if (!$user) {
            // Error: Trả về message code cụ thể
            return $this->notFound('User');
        }
        
        // Success: Chỉ trả message đơn giản
        return $this->success($user);
    }
}
```

## 🌍 Multi-Language Support

API tự động detect ngôn ngữ từ `Accept-Language` header:
- `vi` - Tiếng Việt (mặc định)
- `en` - English

```bash
# Tiếng Việt
curl -H "Accept-Language: vi" http://localhost:8000/api/users

# English
curl -H "Accept-Language: en" http://localhost:8000/api/users
```

---

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

You may also try the [Laravel Bootcamp](https://bootcamp.laravel.com), where you will be guided through building a modern Laravel application from scratch.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
