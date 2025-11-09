<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StaticPagesSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        
        $pages = [
            [
                'slug' => 've-chung-toi',
                'title' => 'Về chúng tôi - Khởi Trí Số',
                'meta_description' => 'Khởi Trí Số là nền tảng giáo dục trực tuyến hàng đầu Việt Nam, cung cấp khóa học, sách điện tử và tài liệu học tập chất lượng cao.',
                'meta_keywords' => 'về chúng tôi, giáo dục trực tuyến, học trực tuyến, khóa học online, sách điện tử',
                'content' => '<div class="space-y-6">
                    <section>
                        <h2>Giới thiệu về Khởi Trí Số</h2>
                        <p>Khởi Trí Số là nền tảng giáo dục trực tuyến hàng đầu Việt Nam, được thành lập với sứ mệnh mang đến cơ hội học tập chất lượng cao cho mọi người.</p>
                        <p>Chúng tôi cung cấp:</p>
                        <ul>
                            <li><strong>Khóa học trực tuyến</strong> với video bài giảng chất lượng cao</li>
                            <li><strong>Sách điện tử</strong> với nội dung phong phú và câu hỏi tương tác</li>
                            <li><strong>Hệ thống bài tập</strong> và đánh giá tự động</li>
                            <li><strong>Cộng đồng học tập</strong> sôi động</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h2>Tầm nhìn</h2>
                        <p>Trở thành nền tảng giáo dục số hàng đầu Đông Nam Á, giúp hàng triệu người Việt Nam tiếp cận với giáo dục chất lượng cao.</p>
                    </section>
                    
                    <section>
                        <h2>Sứ mệnh</h2>
                        <p>Democratize giáo dục - Mang giáo dục chất lượng đến với mọi người, mọi nơi, mọi lúc.</p>
                    </section>
                    
                    <section>
                        <h2>Giá trị cốt lõi</h2>
                        <ul>
                            <li><strong>Chất lượng:</strong> Nội dung được kiểm duyệt kỹ lưỡng</li>
                            <li><strong>Tiện lợi:</strong> Học mọi lúc, mọi nơi</li>
                            <li><strong>Hiệu quả:</strong> Phương pháp học tập tối ưu</li>
                            <li><strong>Hỗ trợ:</strong> Đội ngũ hỗ trợ 24/7</li>
                        </ul>
                    </section>
                </div>',
                'template' => 'about',
                'is_published' => DB::raw('true'),
                'is_active' => DB::raw('true'),
                'view_count' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'huong-dan-su-dung',
                'title' => 'Hướng dẫn sử dụng - Khởi Trí Số',
                'meta_description' => 'Hướng dẫn chi tiết cách sử dụng nền tảng Khởi Trí Số: đăng ký tài khoản, mua khóa học, kích hoạt sách, làm bài tập và nhiều hơn nữa.',
                'meta_keywords' => 'hướng dẫn, cách sử dụng, đăng ký, mua khóa học, kích hoạt sách',
                'content' => '<div class="space-y-6">
                    <section>
                        <h2>Bắt đầu với Khởi Trí Số</h2>
                        <p>Chào mừng bạn đến với Khởi Trí Số! Dưới đây là hướng dẫn chi tiết để bạn có thể tận dụng tối đa nền tảng của chúng tôi.</p>
                    </section>
                    
                    <section>
                        <h2>1. Đăng ký tài khoản</h2>
                        <ol>
                            <li>Truy cập trang đăng ký</li>
                            <li>Điền thông tin: email, mật khẩu, tên</li>
                            <li>Xác nhận email</li>
                            <li>Đăng nhập và bắt đầu học</li>
                        </ol>
                    </section>
                    
                    <section>
                        <h2>2. Mua khóa học</h2>
                        <ol>
                            <li>Duyệt danh sách khóa học</li>
                            <li>Xem chi tiết và đánh giá</li>
                            <li>Thêm vào giỏ hàng</li>
                            <li>Thanh toán qua VNPay hoặc COD</li>
                            <li>Tự động được ghi danh sau khi thanh toán</li>
                        </ol>
                    </section>
                    
                    <section>
                        <h2>3. Kích hoạt sách điện tử</h2>
                        <ol>
                            <li>Mua sách từ cửa hàng</li>
                            <li>Nhận mã kích hoạt qua email</li>
                            <li>Vào trang kích hoạt sách</li>
                            <li>Nhập mã và bắt đầu đọc</li>
                        </ol>
                    </section>
                    
                    <section>
                        <h2>4. Làm bài tập</h2>
                        <ol>
                            <li>Vào khóa học đã mua</li>
                            <li>Chọn bài học</li>
                            <li>Làm bài tập và nộp bài</li>
                            <li>Xem kết quả và nhận phản hồi</li>
                        </ol>
                    </section>
                </div>',
                'template' => 'default',
                'is_published' => DB::raw('true'),
                'is_active' => DB::raw('true'),
                'view_count' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'chinh-sach-bao-mat',
                'title' => 'Chính sách bảo mật - Khởi Trí Số',
                'meta_description' => 'Chính sách bảo mật thông tin của Khởi Trí Số. Cam kết bảo vệ thông tin cá nhân và dữ liệu người dùng.',
                'meta_keywords' => 'chính sách bảo mật, bảo vệ thông tin, quyền riêng tư, dữ liệu cá nhân',
                'content' => '<div class="space-y-6">
                    <section>
                        <h2>Cam kết bảo mật</h2>
                        <p>Khởi Trí Số cam kết bảo vệ thông tin cá nhân của người dùng. Chúng tôi tuân thủ nghiêm ngặt các quy định về bảo mật dữ liệu.</p>
                    </section>
                    
                    <section>
                        <h2>Thông tin thu thập</h2>
                        <p>Chúng tôi thu thập các thông tin sau:</p>
                        <ul>
                            <li>Thông tin đăng ký: tên, email, số điện thoại</li>
                            <li>Thông tin thanh toán: được mã hóa và bảo mật</li>
                            <li>Dữ liệu học tập: tiến độ, điểm số, bài làm</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h2>Cách sử dụng thông tin</h2>
                        <p>Thông tin của bạn được sử dụng để:</p>
                        <ul>
                            <li>Cung cấp dịch vụ học tập</li>
                            <li>Cải thiện trải nghiệm người dùng</li>
                            <li>Gửi thông báo quan trọng</li>
                            <li>Hỗ trợ kỹ thuật</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h2>Bảo vệ thông tin</h2>
                        <p>Chúng tôi sử dụng các biện pháp bảo mật tiên tiến để bảo vệ thông tin của bạn khỏi truy cập trái phép.</p>
                    </section>
                </div>',
                'template' => 'default',
                'is_published' => DB::raw('true'),
                'is_active' => DB::raw('true'),
                'view_count' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'dieu-khoan-su-dung',
                'title' => 'Điều khoản sử dụng - Khởi Trí Số',
                'meta_description' => 'Điều khoản và điều kiện sử dụng dịch vụ Khởi Trí Số. Quy định về quyền và nghĩa vụ của người dùng.',
                'meta_keywords' => 'điều khoản, điều kiện, quy định, quyền lợi, nghĩa vụ',
                'content' => '<div class="space-y-6">
                    <section>
                        <h2>Điều khoản sử dụng</h2>
                        <p>Bằng việc sử dụng dịch vụ của Khởi Trí Số, bạn đồng ý với các điều khoản sau:</p>
                    </section>
                    
                    <section>
                        <h2>1. Quyền sử dụng</h2>
                        <ul>
                            <li>Bạn có quyền truy cập và sử dụng nội dung đã mua</li>
                            <li>Không được chia sẻ tài khoản với người khác</li>
                            <li>Không được sao chép hoặc phân phối nội dung trái phép</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h2>2. Thanh toán</h2>
                        <ul>
                            <li>Thanh toán được thực hiện qua VNPay hoặc COD</li>
                            <li>Sau khi thanh toán thành công, bạn sẽ được cấp quyền truy cập</li>
                            <li>Không hoàn tiền sau khi đã thanh toán (trừ trường hợp đặc biệt)</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h2>3. Bản quyền</h2>
                        <p>Tất cả nội dung trên nền tảng đều được bảo vệ bởi luật bản quyền. Việc sao chép hoặc phân phối trái phép sẽ bị xử lý theo pháp luật.</p>
                    </section>
                </div>',
                'template' => 'default',
                'is_published' => DB::raw('true'),
                'is_active' => DB::raw('true'),
                'view_count' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'lien-he',
                'title' => 'Liên hệ - Khởi Trí Số',
                'meta_description' => 'Thông tin liên hệ với Khởi Trí Số. Hotline, email, địa chỉ và form liên hệ. Chúng tôi luôn sẵn sàng hỗ trợ bạn.',
                'meta_keywords' => 'liên hệ, hỗ trợ, hotline, email, địa chỉ, customer service',
                'content' => '<div class="space-y-6">
                    <section>
                        <h2>Liên hệ với chúng tôi</h2>
                        <p>Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy liên hệ với chúng tôi qua các kênh sau:</p>
                    </section>
                    
                    <section>
                        <h2>Thông tin liên hệ</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3>Hotline</h3>
                                <p class="text-2xl font-bold text-blue-600">1900-xxxx</p>
                                <p class="text-sm text-gray-600">Thứ 2 - Chủ nhật: 8:00 - 22:00</p>
                            </div>
                            <div>
                                <h3>Email</h3>
                                <p class="text-lg">contact@khoitriso.com</p>
                                <p class="text-sm text-gray-600">Phản hồi trong vòng 24h</p>
                            </div>
                            <div>
                                <h3>Địa chỉ</h3>
                                <p>123 Đường ABC, Quận XYZ, TP.HCM</p>
                            </div>
                            <div>
                                <h3>Giờ làm việc</h3>
                                <p>Thứ 2 - Thứ 6: 8:00 - 17:30</p>
                                <p>Thứ 7 - Chủ nhật: 9:00 - 12:00</p>
                            </div>
                        </div>
                    </section>
                    
                    <section>
                        <h2>Form liên hệ</h2>
                        <p>Bạn cũng có thể gửi tin nhắn cho chúng tôi qua form liên hệ trên trang web.</p>
                    </section>
                </div>',
                'template' => 'contact',
                'is_published' => DB::raw('true'),
                'is_active' => DB::raw('true'),
                'view_count' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        foreach ($pages as $page) {
            DB::table('static_pages')->updateOrInsert(
                ['slug' => $page['slug']],
                $page
            );
        }
    }
}

