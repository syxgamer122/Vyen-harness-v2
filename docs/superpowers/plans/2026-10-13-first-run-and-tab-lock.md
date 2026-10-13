# Kế hoạch: lối vào cho người mới + tự giành lại lock + câu của Scheduler

Ngày: 2026-10-13. Bắt nguồn từ review UI (xem `PLAN.md` §11) và phần còn treo ở
§11.6. Kế hoạch này thay thế phần "chưa làm" của §11.3.

**Nguyên tắc chung**

- TDD bắt buộc: viết test, chạy đỏ, mới viết code.
- Repo **không có DOM** (`vitest.config.mts:11` đặt `environment: 'node'`), nên phần
  JSX được test bằng cách đọc source — đúng convention của `scheduler-panel-honesty.test.ts`.
- Chạy test bằng `./node_modules/.bin/vitest` (không `npx`: đi tải mạng và treo).
  Không pipe output vào `tail` — ghi ra file rồi đọc file.
- Mỗi task kết thúc bằng `npm run typecheck` + `npm run lint` + test liên quan.
- Không có spec riêng. Ruling đã chốt nằm trong ledger.

**Hai test đỏ có sẵn, không phải của kế hoạch này:**
`tests/observer-banner-affordance.test.ts` và `tests/evidence-badge.test.ts:511`.
Mục tiêu là **không làm chúng đỏ hơn**, không sửa chúng ở đây.

---

## Task 1: Thẻ "Thêm nhà cung cấp" ở màn trống khi chưa có model

**Vấn đề:** người mới mở app thấy logo, mô tả và 2 thẻ gợi ý — không có lối vào nào.
Muốn gửi thì phải gõ, bấm gửi, rồi mới nghe "Thêm nhà cung cấp ở Cài đặt"
(`react/use-chat-orchestration.ts:5474`). Không có nút, không có chỗ nào bấm được.

**Sửa:** khi danh sách model rỗng, màn trống hiện một thẻ dẫn dắt có nút bấm mở
thẳng Cài đặt → tab Model & Nhà cung cấp.

**Ruling 1 — điều kiện lấy từ prop, không đọc store trong component.**
`components/chat/message-list.tsx` hiện **không** import `useAppStore`; nó là
component trình bày. `components/chat-interface.tsx` đã có `orch.MODELS` (đang truyền
cho `StatusLine`). Truyền `hasModels: boolean` xuống. — *Lý do:* giữ message-list
thuần; *nếu sai:* thêm một prop thừa, không nguy hiểm.

**Ruling 2 — giữ nguyên 2 thẻ gợi ý, đặt thẻ dẫn dắt Ở TRÊN.**
Người dùng chưa trả lời câu hỏi "ẩn hay giữ". Tôi chọn **giữ**: chúng vẫn dùng
được sau khi thêm provider, và bấm chúng chỉ điền vào ô nhập chứ không gửi (không hứa
hẹn điều người dùng chưa làm được). — *Nếu sai:* người mới thấy 3 mục thay vì 1.

**Ruling 3 — không thêm nút vào toast.** `showNotice(text, duration)`
(`lib/notice-store.ts:50`) chỉ nhận chuỗi. Thẻ ở màn trống đã bắt người dùng
*trước khi* họ gõ, nên thông báo có nút là thừa. — *Nếu sai:* người đã gõ rồi vẫn
phải tự mở Cài đặt.

**Files**
- `components/chat-interface.tsx` — truyền `hasModels={orch.MODELS.length > 0}`
- `components/chat/message-list.tsx` — prop + thẻ dẫn dắt trong nhánh màn trống
- `tests/first-run-empty-state.test.ts` (mới)

**Steps**
1. Viết `tests/first-run-empty-state.test.ts`: đọc source `message-list.tsx`, assert
   thẻ dẫn dắt nằm trong nhánh màn trống, có nút gọi `openSettings('providers')`,
   và chỉ render khi `hasModels === false`. Strip comment trước khi so.
2. Chạy `./node_modules/.bin/vitest run tests/first-run-empty-state.test.ts`.
   **Expected:** FAIL, các assert về thẻ và `hasModels` đỏ; assert "giữ 2 thẻ gợi ý" xanh.
3. Sửa `chat-interface.tsx` + `message-list.tsx`.
4. Chạy lại. **Expected:** PASS toàn bộ.
5. Mutation: bỏ điều kiện `!hasModels` → **Expected:** đúng 1 assert đỏ. Khôi phục.
6. `./node_modules/.bin/vitest related components/chat/message-list.tsx components/chat-interface.tsx --run`.
   **Expected:** exit 0.
7. `npm run typecheck` **Expected:** exit 0. `npm run lint` **Expected:** 0 lỗi.
8. Commit: `feat(chat): the dan day nguoi moi toi thiet bi nha cung cap`

---

## Task 2: Tự giành lại lock khi tab ĐANG HIỆN và tab chính đã đóng băng

**Vấn đề:** `attachVisibilityRecovery` chỉ chạy ở `visibilitychange`
(`core/agent-runtime/tab-lock.ts`). Nếu tab đã hiện sẵn rồi mà tab chính im quá 5s
(vòng kiểm tra `startObserverWatch` chỉ bật cờ + banner), người dùng vẫn phải bấm
tay. Mở tab mới khi tab cũ đã đóng băng cũng rơi vào đây.

**Sửa:** trong vòng kiểm tra của observer, khi **cả ba** đúng — tab này đang hiện,
tab chính đã đóng băng, và lần đóng băng này **chưa thử giành** — thì giành một lần.

**Ruling 4 — chống lặp bằng cờ, không bằng hẹn giờ.**
Mỗi lần đóng băng chỉ thử giành **một** lần; cờ `stealAttemptedForFreeze` reset khi
nhận HEARTBEAT (tức là một lần đóng băng mới). — *Lý do:* hẹn giờ sẽ tạo ping-pong
khi hai tab đều không nhận được heartbeat; *nếu sai:* một lần bấm tay là đủ.

**Files**
- `core/agent-runtime/tab-lock.ts`
- `tests/tab-lock-visibility-recovery.test.ts` (bổ sung test)

**Steps**
1. Thêm test: observer, tab **đang hiện**, không có `visibilitychange`, đợi hết 5s
   → phải có `request` với `steal: true`. **Expected:** FAIL.
2. Thêm test: sau một lần giành thất bại, cờ chặn lần thứ hai trong cùng một lần
   đóng băng. **Expected:** FAIL (hiện tại không có cờ).
3. Chạy test, xác nhận đúng 2 assert đỏ mới và các test cũ vẫn xanh.
4. Sửa `tab-lock.ts`: thêm cờ, đặt/tắt cờ đúng chỗ, tách một hàm `tryStealIfVisibleAndFrozen()`
   để timer và `visibilitychange` dùng chung (một nơi quyết định, một nơi gọi).
5. Chạy lại. **Expected:** PASS.
6. Mutation: bỏ điều kiện `document.visibilityState === 'visible'` trong hàm mới →
   **Expected:** đúng các assert về "tab ẩn" đỏ. Khôi phục.
7. `npm run typecheck` **Expected:** exit 0. `npm run lint` **Expected:** 0 lỗi.
8. Commit: `fix(tabs): tu lai lock khi tab dang hien va tab chinh dong bang`

---

## Task 3: Câu của Scheduler + nút trung tính khi chưa biết

**Vấn đề:** trạng thái chưa biết đã được tô xám ở icon (Task trước), nhưng chữ in
hoa "KHÔNG ĐỌC ĐƯỢC", từ "Bridge"/"kill-switch", và nút viền đỏ vẫn giữ nguyên.
Trạng thái chưa biết vẫn trông như cảnh báo.

**Sửa:** một câu tiếng thường nói đúng sự thật, không thuật ngữ; nút trung tính khi
chưa biết, viền đỏ chỉ khi **đã biết** là đang tạm dừng... nghĩa là nút đỏ khi
đang bật/tạm dừng theo nghĩa hành động. Cập nhật test honesty cho khớp.

**Ruling 5 — KHÔNG đụng vào nhánh "không có scheduler".**
`tests/scheduler-panel-honesty.test.ts:120` đang khoá nhãn đó và nó đã trung thực.

**Ruling 6 — nút đỏ khi `killSwitch === true` (đang tạm dừng), xám khi `null`.**
Nút đỏ hiện dành cho hành động "Dừng khẩn cấp" — tức trạng thái **đang chạy**. Khi
chưa biết thì không có hành động nào chắc chắn, nên trung tính. — *Nếu sai:* mất
tín hiệu "nút này nguy hiểm".

**Files**
- `components/scheduler/scheduler-panel.tsx`
- `tests/scheduler-kill-switch-card.test.ts`

**Steps**
1. Cập nhật test: khoá câu mới (chữ thường, không "Bridge", không "kill-switch")
   và khoá việc nút không mang `text-danger` khi `killSwitch === null`.
   **Expected:** FAIL (code cũ).
2. Sửa chuỗi và class của nút trong `scheduler-panel.tsx`.
3. Chạy lại. **Expected:** PASS.
4. `./node_modules/.bin/vitest related components/scheduler/scheduler-panel.tsx --run`.
   **Expected:** exit 0.
5. `npm run typecheck` **Expected:** exit 0. `npm run lint` **Expected:** 0 lỗi.
6. Commit: `fix(settings): noi san scheduler chua biet, nut trung tinh`

---

## Sau cả 3 task

- `./node_modules/.bin/vitest run` toàn bộ. **Expected:** không file đỏ nào ngoài
  `observer-banner-affordance` và `evidence-badge` (có sẵn từ trước).
- Ghi kết quả vào `PLAN.md` §12.
- Review toàn nhánh bằng subagent reviewer rồi xử lý Critical/Important.