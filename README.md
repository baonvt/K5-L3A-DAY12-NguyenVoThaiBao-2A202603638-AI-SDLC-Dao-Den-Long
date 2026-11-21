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

## Luật và điểm Đêm 1

Mây có 3 ngọn lửa, mang tối đa 10 đom đóm. Mỗi đèn cần 4 đom đóm, có thể nạp nhiều lần. Một lần tỏa sáng tốn 2 đom đóm. Bị Bóng Mực chạm sẽ mất 1 ngọn lửa và rơi một nửa số đom đóm mang theo, làm tròn xuống. Mây được miễn thương 2 giây sau mỗi lần chạm. Đường biên giữ Mây trên đảo (`fall_enabled: false`).

Nhặt một đom đóm được 10 điểm, thắp một đèn được 100 điểm và làm choáng một Bóng Mực được 15 điểm. Khi thắp sáng cả năm đèn, Mây được thưởng 2 điểm cho mỗi giây nguyên còn lại và 50 điểm cho mỗi ngọn lửa còn lại. Hết 240 giây hoặc mất ngọn lửa cuối thì thua.

## Kiểm chứng

```sh
npm test
npm run proof
node tools/headless.js --seed 17 --night 1 --ticks 14400 --inputs docs/proof/full-night/inputs.json --snapshot-every 300 --out full-night.jsonl
```

Lệnh cuối chơi từ trạng thái mặc định bằng chuỗi input đã lưu. Đầu ra kết thúc ở tick 1355 với `state: won` và 1344 điểm. Bỏ `--inputs` để thử đứng yên. Dùng `--scenario <file.json>` để đặt tình huống ban đầu. CLI chạy ở 60 tick/giây mô phỏng, không cần màn hình hoặc GPU. Mỗi dòng output là một đối tượng JSON. Snapshot đầu ở tick 0, dòng cuối là `end`. Inputs hoặc scenario sai định dạng trả mã 2.

| Muốn đối chiếu | Tệp |
|---|---|
| Lệnh chính thức và các hằng số đang dùng | [Test Contract v1.0](game.contract.json) |
| Tiêu chí, giả định, kết quả và giới hạn | [Ghi chép Phase 1](docs/phase-1.md) |
| Một lần nhặt, tỏa sáng, nạp và thắng | [Scenario](docs/proof/seed17/scenario.json), [inputs](docs/proof/seed17/inputs.json), [JSONL thực](docs/proof/seed17/actual.jsonl) |
| Thắng từ đầu màn ở seed 17 | [Inputs cả đêm](docs/proof/full-night/inputs.json), [kiểm tra thắng và thua](tests/full-night.test.js) |
| Quy trình AI và kiểm tra trên Linux/macOS | [AGENTS.md](AGENTS.md), [cấu hình CI](.github/workflows/verify.yml) |

## Sáng tạo của tôi

Năm đường đá tỏa từ tâm đảo giúp người chơi tìm đường đến từng đèn. Âm chuông cao dần theo số đom đóm trong túi. Cả hai nằm trong phần hiển thị và âm thanh. Có thể đối chiếu cảnh chơi thật với một lần chạy logic xác định. [Video](docs/demo/demo.mp4) · [JSONL](docs/proof/seed17/actual.jsonl)

[Nguồn tài sản và công cụ](CREDITS.md) · [Giấy phép mã nguồn](LICENSE)
