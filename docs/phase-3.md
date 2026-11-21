# ADR · Dầu, vùng an toàn và bình minh

Mỗi đèn giữ số nguyên bằng 60 lần lượng dầu. Bộ mô phỏng trừ một đơn vị mỗi bước đang sáng, thêm năm đơn vị cho từng Bóng Mực đang hút. Các thao tác ở chế độ tạm dừng giữ toàn bộ số đếm. Snapshot chuyển sang đơn vị dầu với một chữ số thập phân. Ghi riêng ever_lit, relit_count và số lần Mây thắp trong đêm để phân biệt chi phí thắp lại, sức chứa và điểm. Đèn cấu hình trong scenario chỉ khởi tạo trạng thái.

Ở bước 2, tính hao và hút rồi tắt đèn cạn trước khi xử lý tương tác. Bởi vậy đèn mở đầu với 100 dầu đã tiêu hao 1/60 khi lượt nạp kế tiếp diễn ra. Ngưỡng an toàn dùng giá trị đầy đủ. Kết quả xét sau mọi cập nhật, ưu tiên hết lửa, rồi kiểm số đèn sáng ở bình minh bằng ceil(0,6 × tổng số).

Kiểm chứng trước tag: áp dụng 1 và nhiều bóng hút cùng lúc, thử 30 và dưới 30, châm dầu khi có bóng, thắp lại chỉ tốn 5, tăng sức chứa đến trần, làm choáng bóng đang hút, chờ bình minh cho đủ ba đêm, mất lửa ở tick cuối. Lưu một lượt từ CLI, lặp so từng byte.

Test thắng all_lit ở v1.1 được thay bằng bảo đảm tiếp tục chơi và kiểm tra dawn_survived. Test tính điểm nạp, pulse và thưởng cuối đêm dùng công thức v1.2. Bài test pause, TTL, chuyển động, bản đồ và Gió Lạc tiếp tục chạy.

25 test đạt trên máy phát triển. [Kịch bản CLI](proof/phase-3/scenario.json) vừa tắt một đèn vừa thắp lại một đèn, thắng ở tick 3 với 573 điểm. [Output](proof/phase-3/actual.jsonl).
