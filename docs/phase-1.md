# Phase 1 · Đêm 1 – Đảo Bến

## Kế hoạch nghiệm thu trước khi viết mã

| Nguồn | Thử nghiệm | Kỳ vọng |
|---|---|---|
| PRD-0, Đêm 1 | Chơi bằng bàn phím từ màn hình đầu | Camera theo Mây, nón lá và đèn nhỏ nhìn được, HUD hiện mục tiêu, giờ, máu và điểm |
| Contract B/C | Đi chéo, xoay 90°, giữ và nhả nút rồi nhảy lần nữa | Tốc độ khớp tuning, Y trở về 0, mỗi cạnh lên kích hoạt một lần |
| Contract D | Dựng sẵn đèn, đom đóm, Bóng Mực và thời gian | Tick 0 đủ năm đèn, không điểm hoặc sự kiện khởi tạo |
| PRD-0, gom và nạp | Nhặt ở rìa bán kính, nạp khi chỉ thiếu một, nạp phần còn lại | Không vượt sức chứa, đèn sáng đúng ngưỡng, giữ nguyên số đom đóm dư |
| PRD-0, Bóng Mực | Đặt bóng ở rìa vùng, chạm nhiều tick, tỏa sáng, trú quanh đèn sáng | Đúng máu, số rơi, thời gian miễn thương, bán kính an toàn và trạng thái choáng |
| PRD-0, kết thúc | Thắp đèn cuối, hết giờ, mất ngọn lửa cuối | Đúng reason, đúng điểm và dừng sớm. Có thể bắt đầu lại trong bản 3D |
| Contract E | Chạy CLI hai lần cùng seed và thay seed ở lượt thứ ba | Hai file đầu đồng nhất từng byte, seed khác đổi cách rải vật thể |
| Contract B/E | 0 tick, sai JSON, sai kiểu, frame trùng, đường dẫn output lỗi | Snapshot 0, end cuối cùng, mã thoát và stderr phù hợp |

## Giả định thiết kế

Đảo tròn bán kính 27 m, có đường biên giữ Mây trên đảo. Đèn sáng tạo vùng an toàn. Nhấn nạp chuyển tối đa số còn thiếu vào đèn chưa sáng gần nhất. Nhặt đủ túi thì đom đóm còn lại vẫn ở trên đảo. Bị chạm làm rơi phần nguyên của tỉ lệ khai báo. Hồi đom đóm và xuất hiện Bóng Mực theo thời gian khi scenario cho phép. Tỏa sáng tốn năng lượng kể cả khi không có bóng trong vùng. Thưởng thời gian và máu còn lại khi thắng. Ưu tiên thắp đèn cuối trước bình minh nếu trùng tick.
