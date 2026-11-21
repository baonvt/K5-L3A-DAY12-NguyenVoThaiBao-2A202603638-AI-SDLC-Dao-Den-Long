# Retro · Đảo Đèn Lồng

## Từ một màn đến ba đêm

Phase 1 cho thấy một kịch bản ngắn và một lượt từ đầu màn trả lời hai câu hỏi khác nhau. Kịch bản ngắn giúp dò lỗi tick, điểm và sự kiện. Chuỗi điều khiển từ đầu màn xác nhận người chơi có thể thu thập đủ đom đóm để thắng. Ảnh chơi thật còn phát hiện phông dự phòng làm tách dấu trong tên game, trong khi toàn bộ test logic vẫn xanh. Kết quả Phase 1 gồm 13 test, một lượt thắng đủ năm đèn và video.

Sang Phase 2, tọa độ đèn, giá thắp, điểm và quy tắc nhảy thay đổi. Đường chạy v1.0 không thể dùng nguyên làm đáp án cho v1.1. Nhóm test chuyển động vẫn giữ, các ca phụ thuộc luật cũ có tiêu chí mới trong ghi chép phase. Ban đầu văn bản dán từ board thiếu hai bảng. Ba ảnh người dùng gửi giúp xác định nhặt theo XZ kèm chênh cao, còn pulse theo hình cầu tâm ở chân Mây cộng 0,8 m. Một ca kiểm chiều cao và một ca biên xung được thêm để bảo vệ hai quy tắc đó. Phase 2 có 20 test và đo khung hình trong bản chơi.

Phase 3 thay hẳn điều kiện kết thúc. Điểm dễ sai là trừ dầu, châm dầu, nhận sát thương và xét bình minh đều có thể xảy ra trong một tick. Mỗi đèn lưu dầu bằng đơn vị nguyên 1/60, đủ để tính đúng cả hao tự nhiên lẫn nhiều bóng hút đồng thời. Thời gian, trạng thái hiện tại và việc đèn đã từng sáng được lưu riêng. Test xét cả hai phía của ngưỡng thắng trong từng đêm. 25 test đạt, kịch bản đã lưu kết thúc ở bình minh với 573 điểm.

## Bài học từ kiểm chứng

Phase 4 đo 200 Bóng Mực bằng cùng hình học và vật liệu của game, gộp các bộ phận cùng kiểu để GPU vẽ nhiều bản sao trong một lượt. Soak đầu tiên ghi khoảng 52,32 → 64,06 MiB RSS, vượt ngưỡng tăng 20%. Việc so thứ tự ID và cấp phát danh sách mới trong mỗi tick là chi phí lặp. Sau khi chỉ sắp ID lúc thêm bóng và tái sử dụng các danh sách, cùng seed hoàn thành nhanh hơn. Các con số cuối nằm trong bench.json và soak.json. Kết quả đo trên máy chấm có thể khác theo GPU, driver, màn hình và chế độ nguồn.

Kiểm tra trình duyệt cũng từng báo HUD biến mất. Kiểm tra ảnh cho thấy HUD vẫn hiện. Phần tử bao quanh các khối định vị tuyệt đối có kích thước bằng 0; assertion được đổi sang đồng hồ mà người chơi nhìn thấy. Lượt kiểm phát hành còn đổi phím, xác nhận báo trùng, khôi phục mặc định, tải lại cài đặt, thua một đêm bằng thao tác di chuyển rồi lưu điểm. Dữ liệu CLI đọc lại trùng với bảng xếp hạng của game. Mỗi lượt QA dùng thư mục dữ liệu riêng.

## Harness và chi phí

AGENTS.md chỉ giữ các quy ước chi phối mọi thay đổi. CI chạy test và tạo lại JSONL trên Ubuntu, macOS. Mỗi tag giữ bộ luật tại thời điểm đó. Giá trị lớn nhất của harness là phát hiện đầu ra thay đổi khi sửa thứ tự xử lý, cùng việc bắt buộc chạy game thật cho những tiêu chí giao diện. Các test do Codex viết và chạy; chưa có báo cáo test ẩn hoặc biên bản phản biện độc lập của giảng viên.

Ước tính phần **đầu ra văn bản** dựa trên lượng ký tự mã và tài liệu đã thêm, khoảng 3–4 ký tự/token, tính tròn để phản ánh sai số. Phase 1 khoảng 18–25 nghìn token, Phase 2 khoảng 12–16 nghìn, Phase 3 khoảng 4–5 nghìn, Phase 4 khoảng 11–16 nghìn. Tổng khoảng 45–62 nghìn token đầu ra, chưa tính ngữ cảnh đọc, các lần thử và phần suy luận. Không có dữ liệu hóa đơn để quy đổi ra chi phí. Dùng cùng module cho WebGL, headless và soak giúp tránh sinh lại ba phiên bản luật.

Nếu làm lại, sẽ lưu nguyên các bảng số liệu ngay từ đầu, thêm ca chuyển trạng thái giữa hai đêm sớm hơn và đo bộ nhớ sau vòng chơi đầu. Một bảng thông số có đơn vị rõ ràng tiết kiệm nhiều lượt chỉnh hơn một mô tả dài về cảm giác chơi.
