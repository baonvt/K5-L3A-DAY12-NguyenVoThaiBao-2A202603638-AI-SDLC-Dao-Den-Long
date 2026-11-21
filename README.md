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

## Giữ đảo sáng tới bình minh · Contract v1.2

Đêm 1/2/3 kéo dài 240/270/300 giây. Nhặt đom đóm để thắp đèn (10), thắp lại (5) hoặc châm dầu (10 dầu/đom đóm). Mỗi đèn sáng hao 1 dầu/s. Dưới 30 dầu, đèn mất vùng an toàn và có thể bị Bóng Mực hút thêm 5 dầu/s mỗi con. Giữ ít nhất 3/5, 4/6 hoặc 5/7 đèn sáng và còn Ngọn Lửa ở bình minh để thắng. Mở Cài đặt để bật bảng màu dễ phân biệt. Shift để lướt, Esc/P để tạm dừng. Túi tăng 2 ô mỗi lần thắp tới 20 ô.

Mỗi đom đóm nạp được 5 điểm, thắp lần đầu +100, thắp lại +40. Tỏa Sáng +5 mỗi bóng, +15 nếu đang hút. Mỗi đèn còn sáng khi thắng thưởng 50 + phần nguyên của dầu, mỗi Ngọn Lửa +50. Tổng điểm chỉ cộng từ các đêm đã thắng.

```sh
npm test
npm run proof
node tools/headless.js --seed 17 --night 1 --ticks 21600 --inputs docs/proof/phase-3/inputs.json --scenario docs/proof/phase-3/scenario.json --out trace.jsonl
```

[ADR Phase 3](docs/phase-3.md) · [Changelog](CHANGELOG.md) · [Tiêu chí Phase 2](docs/phase-2.md) · [Các số liệu game](game.contract.json) · [Bằng chứng v1.1](docs/proof/phase-2) · [Ghi chép Phase 1](docs/phase-1.md)

## Sáng tạo của tôi

Đường đá chỉ hướng và chuông khi nhặt đom đóm nằm ở lớp hiển thị. Kịch bản headless xác định kiểm tra riêng bộ luật. [Nguồn](CREDITS.md) · [Giấy phép](LICENSE)
