# Làm việc trên Đảo Đèn Lồng

- Đọc tab đang mở của lab board. Ghi tiêu chí và cách đo trong docs trước khi đổi luật.
- Chạy npm ci rồi npm test. Nếu test đỏ, sửa hoặc ghi rõ yêu cầu đã thay thế trước khi phát hành.
- Luật 60 Hz dùng chung cho giao diện và CLI. Đọc tuning từ game.contract.json.
- Scenario chỉ dựng trạng thái. Giữ RNG, ID, thứ tự sự kiện và input tái lập được.
- Chạy npm run proof để tạo lại JSONL. Không sửa tay output.
- Khi đổi giao diện, chơi thử và đối chiếu ảnh với bản chạy. Chỉ gắn tag cho phase đã đọc và kiểm tra.
- Kiểm tra trực quan chữ “Đèn Lồng” ở màn hình đầu. Chạy cả lượt thắng từ trạng thái mặc định qua tests/full-night.test.js.
- Kiểm tra mỗi đêm bằng scenario tái lập, kể cả pause khi các bộ đếm đang chạy. Giữ riêng tick và sim_tick.
