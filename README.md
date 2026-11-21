# Đảo Đèn Lồng

**[Xem video chơi thử và kiểm chứng Phase 1](docs/demo/demo.mp4)** · [Xem ảnh trong game](docs/proof/first-light.jpg)

Nguyễn Võ Thái Bảo · 2A202603638 · L3A

Trong Đêm 1, hãy dẫn Mây đi theo những lối đá của Đảo Bến, nhặt đom đóm và mang về thắp năm Đèn Lồng Lớn. Bóng Mực đuổi theo Mây trong sương. Vùng sáng quanh một chiếc đèn đã thắp là nơi trú an toàn.

## Chơi trên máy

Cần Node.js 20 trở lên, npm và trình duyệt hỗ trợ WebGL 2. Từ terminal trên macOS, Linux hoặc Windows, chạy ba dòng sau. Nếu trình duyệt chưa tự mở, truy cập địa chỉ mà máy chủ in ra, mặc định là [127.0.0.1:4173](http://127.0.0.1:4173).

```sh
git clone https://github.com/baonvt/K5-L3A-DAY12-NguyenVoThaiBao-2A202603638-AI-SDLC-Dao-Den-Long.git dao-den-long
cd dao-den-long
npm ci && npm start
```

| Thao tác | Điều khiển |
|---|---|
| Di chuyển, nhặt đom đóm khi đi ngang | WASD hoặc phím mũi tên |
| Nhảy | Space |
| Xoay camera | Giữ và kéo trên cảnh, hoặc Z / X |
| Nạp đom đóm vào đèn gần nhất | E |
| Tỏa sáng để đẩy và làm choáng Bóng Mực | F |
| Hướng dẫn, tạm dừng | Nút **?** hoặc Esc |
| Chơi lại | Nút **Chơi lại** sau khi thắng hoặc thua |

Màn hình cảm ứng có các nút di chuyển và hành động. Nút ♪ bật tiếng chuông tổng hợp.

## Ba đêm · Contract v1.1

Đếm giờ 300 / 330 / 360 giây. Mỗi đèn cần 10 đom đóm. Mây mang tối đa 10, có 3 Ngọn Lửa. Nhấn Shift để lướt, P hoặc Esc để tạm dừng. Nhặt Bùa Gió để chạy nhanh và lướt liên tiếp. Đêm 2 có cầu, bục nhảy và Gió Lạc. Đêm 3 có các tầng, tháp và gió mạnh. Thắng khi tất cả đèn sáng trước hoặc đúng bình minh. Mỗi đom đóm nạp +10, thắp đèn +100, mỗi Bóng Mực trúng xung +5. Khi thắng cộng 2 điểm mỗi giây nguyên còn lại và 50 mỗi Ngọn Lửa.

```sh
npm test
npm run proof
node tools/headless.js --seed 17 --night 2 --ticks 21600 --inputs docs/proof/phase-2/inputs.json --scenario docs/proof/phase-2/scenario.json --out trace.jsonl
```

[Tiêu chí Phase 2](docs/phase-2.md) · [Các số liệu game](game.contract.json) · [Bằng chứng v1.1](docs/proof/phase-2) · [Ghi chép Phase 1](docs/phase-1.md)

## Sáng tạo của tôi

Đường đá chỉ hướng và chuông khi nhặt đom đóm nằm ở lớp hiển thị. Kịch bản headless xác định kiểm tra riêng bộ luật. [Nguồn](CREDITS.md) · [Giấy phép](LICENSE)
