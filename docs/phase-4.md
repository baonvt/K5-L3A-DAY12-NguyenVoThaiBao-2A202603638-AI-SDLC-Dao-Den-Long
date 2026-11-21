# Phase 4 · Kế hoạch phát hành

- Dựng cảnh thật 1280×720, kiểm 200 bóng, 100 đom đóm, 3 đèn sáng; chạy 3 giây khởi động rồi đo 30 giây. Đo rAF từ trình duyệt và tính cả đoạn tải đầu tiên theo đồng hồ tiến trình.
- Chạy 10 đêm cùng tiến trình với input theo seed. Ghi số đêm, lỗi, RSS đầu/cuối và thời gian thực. So ngưỡng 1,2 lần.
- Lưu điểm từ giao diện, đóng và mở lại game, đối chiếu kết quả xuất CLI; kiểm tên, thời điểm và top 10. Đổi phím trùng, khôi phục mặc định, giữ tùy chọn sau khi tải lại.
- Clone sạch, chạy test và bằng chứng, giải nén bản phát hành để mở game, đối chiếu file công khai và tag với commit cuối.

## Kết quả trên máy phát triển

Máy Windows 11 (build 26200), Intel Core i7-12700H, Intel Iris Xe qua ANGLE Direct3D 11, RAM 15,68 GiB, chế độ nguồn Balanced. Cảnh đo tắt đường đá trang trí, cầu tàu, dây đèn phụ và nhạc. Mẫu benchmark seed 42 chạy đủ 30 giây đo sau 3 giây khởi động. Ghi 4.325 khung, trung bình 144,15 FPS, 1% thấp 138,93 FPS, p95 7,1 ms và tải 2.039 ms. Các chỉ số vượt ngưỡng quy định trên máy này. [Output benchmark](../bench.json) · [Ảnh cảnh chuẩn](proof/phase-4/benchmark.jpg)

Lượt soak seed 7 chạy 10 đêm luân phiên trong cùng tiến trình, 0 crash. RSS 54,98 → 63,63 MiB, tăng khoảng 15,7%. Mười kết quả đều là thua với bộ input ngẫu nhiên. [Output soak](../soak.json)

Bài kiểm trình duyệt dùng bàn phím thật để di chuyển, thử lướt, mở pause, cập nhật phím và cảnh báo trùng, khôi phục, bật chữ lớn và chế độ dễ phân biệt rồi tải lại. Sau khi Mây rơi ba lần, lưu May_QA ở màn kết quả, đọc lại từ menu và xuất bằng CLI ở cùng thư mục dữ liệu tạm. [Giao diện](proof/phase-4) · [Trình kiểm](../tools/check-play.js).

Bộ test phát hành có 26 ca đạt. File ZIP đã giải nén sang thư mục trống, chạy bằng Node và mở được Đảo Bến trong Chromium, không cài thêm npm. Video MP4 1280×720 gồm thao tác trực tiếp, kết quả kiểm chứng và cảnh benchmark.
