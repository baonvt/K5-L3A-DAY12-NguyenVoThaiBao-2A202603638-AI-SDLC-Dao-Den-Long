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

## Kết quả

| Tiêu chí | Đã quan sát | Chạy lại hoặc xem bằng chứng |
|---|---|---|
| Di chuyển, nhảy, giới hạn sức chứa, bán kính, miễn thương, tỏa sáng và nạp đèn | Các ca biên và thời điểm kích hoạt đạt trong bộ 13 bài test | `npm test`, [test luật](../tests/world.test.js), [test CLI](../tests/cli.test.js) |
| Thắng từ đầu màn | Seed 17, thắp lần lượt L1 đến L5, thắng ở tick 1355, 1344 điểm. Cùng seed, đứng yên thì thua sau ba lần bị chạm | [Inputs](proof/full-night/inputs.json), [test cả đêm](../tests/full-night.test.js) |
| Kịch bản cô lập và tính tất định | Hai lượt trả JSONL đồng nhất, thắng ở tick 10, 307 điểm. Lỗi dữ liệu trả mã 2 | `npm run proof`, [output gốc](proof/seed17/actual.jsonl) |
| Chơi thật | Đi theo lối đá đến L1, nhặt 6 đom đóm. Sau khi nạp, HUD hiện 1/5 đèn, 160 điểm và còn 2 đom đóm. Nhấn F làm choáng một Bóng Mực và tăng lên 175 điểm | [Ảnh trong game](proof/first-light.jpg), [video và kết quả test](demo/demo.mp4) |
| Hình ảnh, không khí và chỉ đường | Mây đội nón lá có đèn treo, đèn đã nạp tỏa sáng vàng, năm lối đá dẫn từ tâm tới đèn | [Toàn cảnh](proof/title.jpg), [đèn đã sáng](proof/first-light.jpg) |

Ca thắng đủ năm đèn và hai lý do thua được kiểm bằng mô phỏng. Video quay một đoạn chơi bàn phím đến đèn đầu tiên. Bộ test ẩn và điểm chấm thuộc giảng viên.

## Nhật ký AI và retro

Codex đọc PRD-0, ghi bảng nghiệm thu, xây bộ mô phỏng 60 Hz, rồi dựng giao diện dùng chung bộ luật đó. Một lượt soát lại dùng CLI như người chấm, chỉ cấp seed và inputs. Nhờ vậy có thể chứng minh thắng được từ đầu màn, ngoài scenario dựng sẵn bốn đèn sáng. Phần bàn phím được kiểm trong trình duyệt.

Lỗi nhìn thấy khi chơi thử là dấu tiếng Việt ở chữ “Lồng” bị tách trong phông dự phòng ban đầu. Sau khi đổi phông, ảnh chụp tiêu đề hiển thị đúng. Đã bổ sung bước kiểm tra chữ có dấu vào hướng dẫn cho agent. Nếu làm lại, sẽ kiểm tra tiêu đề và đường đi đủ năm đèn ngay từ bản chơi đầu tiên.

Ước lượng thô phần nội dung AI viết cho Phase 1 là khoảng 18–25 nghìn token, dựa trên khoảng 70 nghìn ký tự mã và tài liệu trước khi chốt. Ước lượng này chỉ bao phủ phần đầu ra lưu được. Tổng token đầu vào, lượt đọc lại và chi phí tài khoản chưa đo được. Việc dùng chung logic và giữ hai kịch bản ngắn giúp giảm khối lượng mã và quá trình dò sai.
