# Phase 2 · Contrat v1.1

| Mục của Ticket-02 | Tiêu chí chấp nhận và cách kiểm |
|---|---|
| Bản đồ và di chuyển | So tọa độ từng đèn, độ cao mặt đất, mép cầu, dốc, bục nhảy và vách. Lướt 12 tick, kiểm cooldown, rơi và hồi sinh. |
| Gió Lạc | Dựng một con ở sát Mây, kiểm cướp trước hit, flee, trả đủ số bị cướp sau pulse. |
| Bùa Gió | Nhặt tại cầu, kiểm 600 tick hiệu lực, lướt hai lần, xuất hiện lại sau 2700 tick. |
| Chuỗi đêm | Thắng dẫn tới đêm tiếp, thua được thử lại, tổng điểm chỉ cộng các đêm thắng một lần. |
| Tạm dừng | So snapshot trước và sau nhiều tick paused, cả thời gian, vị trí, TTL và sim_tick giữ nguyên. |
| Cài đặt và âm thanh | Đổi âm lượng và độ nhạy, mở lại kiểm giá trị; nghe nhạc và các âm theo sự kiện. |
| HUD và ánh sáng | Kiểm giờ, lửa, 10 ô, số đèn, hồi chiêu, chỉ hướng và ánh sáng thay đổi theo tỉ lệ đèn. |
| Gió trời | Kiểm cảnh báo trước 2 s, đẩy tại giây 30, hết sau 5 s; cùng seed cùng hướng. |
| CLI | Chạy cả 3 đêm, JSONL đúng schema, hai lần giống byte, kiểm snapshot đầu và biên pause/resume. |

Bản đồ, lịch sinh và thứ tự xử lý dùng chung giữa CLI và WebGL. Những giá trị không thấy trong bản dán được theo dõi khi đối chiếu bảng chuẩn.
