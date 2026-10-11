# PLAN — Kết quả audit UI/UX + kế hoạch đẹp hơn Codex

Ngày: 2026-10-10. Audit READ-ONLY, chưa sửa file UI nào.
6 subagent chạy song song, mỗi agent một vùng file không overlap; mọi claim
quan trọng đã được tự kiểm chứng lại bằng code/CSS đã build + công thức WCAG
có calibrate.

## Bối cảnh quyết định cách đọc kết quả

Dự án CÓ design system cố ý. `DESIGN.md` mô tả hệ đang chạy, có 7 ràng buộc
cứng được `tests/design-system.test.ts` canh. App **light-only** là hợp đồng
(§7), không phải thiếu sót. Vì vậy "đẹp hơn Codex" **không** phải copy palette
tối của Codex — mà là: mật độ thông tin, giảm chrome, chiều sâu đọc được,
đúng nhịp 8px, một màu nhấn tiết chế.

Độ trưởng thành: **4/5** (cả 6 agent đồng ý). Không có mục nào "cần làm lại
từ đầu".

---

## Đã tự kiểm chứng (không tin báo cáo agent)

| Claim | Cách kiểm | Kết quả |
|---|---|---|
| `.uic` đè `font-semibold`/`tracking` | grep vị trí trong CSS đã build | **ĐÚNG.** `.uic` idx 67001 > `.font-semibold` 56693, `.tracking-[0.08em]` 57359. Unlayered thắng `@layer utilities`. **11 call site** đều mất weight/tracking: sidebar:550, vyen-logo:71,88, message-list:590, staging-panel:75, workspace-checkpoints:203, tool-approval-dialog:120… |
| Audit log bị Settings che | đọc `ui-z.ts` + 2 file dialog | **ĐÚNG.** Audit 90 vs Settings 100 (`system`), cùng portal `document.body`. Click rơi xuống backdrop Settings → `e.target === e.currentTarget` (settings-dialog.tsx:146) → **đóng luôn Settings**. |
| `.notice-warn` fail AA | tính lại bằng WCAG, calibrate `#767676`=4.54 / `#595959`=7.00 | **SAI ở chỗ tôi đo, ĐÚNG ở chỗ override.** `warning` trên `bg-raised` = 4.67:1 → pass AA, con số 4.38 trong comment là sai. NHƯNG `composer.tsx:1122` còn đổi nền sang `bg-warning/10`, và trên nền đó `text-warning` chỉ còn **4.11–4.46:1** (tuỳ nền gốc) → dưới ngưỡng. Override `text-primary` **vẫn cần**, giữ nguyên. Agent sửa đã bác bỏ đúng chỉ đạo sai của tôi. |
| `lift-md` không đọc ra chiều sâu | composite 2 lớp bóng lên `#ffffff` | **ĐÚNG.** Lớp tiếp xúc `0.06` đen → `#f0f0f0` (240), lớp quanh `-4px/0.08` → 235. Mờ 4–8% trên giấy trắng là dưới ngưỡng mắt. |
| Gửi trùng tin nhắn | grep `submittingRef` toàn file | **ĐÚNG.** Chỉ **1 lượt duy nhất** — khai báo ở `composer.tsx:677`, không đọc/ghi. Comment 670-676 mô tả đúng invariant rồi bỏ dở. |
| Quota 0% vẫn hiện thanh xanh | đọc `storage-quota-meter.tsx:96` | **ĐÚNG.** `Math.max(2, percentage)` → 2% lúc 0%. File cũng **không có trong** `TOKENIZED_COMPONENTS` nên không test nào canh. |
| Focus trap tranh nhau | đọc `use-focus-trap.ts` | **ĐÚNG.** `:93` chỉ guard Escape; nhánh `Tab` ở `:99` không có → hai dialog chồng cùng giành focus. |
| Escape hứa nhưng không chạy | grep `workspace-checkpoints.tsx` | **ĐÚNG.** Có `aria-modal` (`:191`) + chữ `$ Esc to cancel` (`:271`) nhưng **không** `useFocusTrap`, không `keydown`. |

---

## Bug thật (đã xác minh — nên sửa trước)

1. **`composer.tsx:677` — double-send.** `submittingRef` không được dùng. `submitDraft`
   await `onSubmit` (~15s gather context) trước khi append; `isLoading` là closure cũ
   nên không chặn Enter thứ hai. → gửi trùng, tính phí trùng, 2 lượt trả lời.
2. **`audit-viewer-dialog.tsx:205` — z 90 vs Settings 100.** Mở nhật ký kiểm toán
   từ trong Cài đặt → bị backdrop phủ, click ăn vào backdrop Settings và **đóng
   Cài đặt**. Tính năng an toàn mở ra như không có gì xảy ra.
3. **`globals.css:326` `.uic` unlayered.** Đè mọi `font-*`/`tracking-*` khi đứng
   cạnh. Sửa 1 dòng → nhãn section + wordmark về đúng weight trên toàn shell.
4. **`storage-quota-meter.tsx:96`** thanh 2% lúc 0% + thiếu `role="progressbar"`.
5. **`workspace-checkpoints.tsx:188`** khai `aria-modal` nhưng không trap focus,
   Escape không hoạt động — trong khi UI hứa có.
6. **`message-list.tsx:770`** nút "xuống tin mới nhất" là `absolute` không có
   ancestor positioned → rơi **dưới composer**, tức vô dụng đúng lúc cần nhất.
7. **`message-item.tsx:650`** chỉ truyền `status="aborted"` → nhánh `error` trong
   `MessageStatusBadge` không bao giờ chạy; lỗi chỉ hiện ở đáy transcript.
8. **`use-focus-trap.ts:99`** thiếu guard đỉnh-stack cho nhánh Tab.

## Làm đẹp (làm sau, cần soi bằng mắt)

- **Chiều sâu** (token, chưa ai đo): `lift-md` mờ 4–8% trên nền gần trắng.
  Đề xuất: lớp tiếp xúc `0 1px 2px rgb(24 24 27 / 0.07)`. Đây là thay đổi
  nâng cảm nhận chất lượng lớn nhất, và là **token** → phải sửa `globals.css` +
  `tailwind.config.ts` + `tests/design-system.test.ts` cùng lượt.
- **Giảm chrome mỗi lượt** — hiện có 3 thẻ viền/tô màu mỗi lượt (reasoning,
  subagent, orchestrator), đúng cái "everything is a card" mà §13.1 cảnh báo.
  Reasoning → 1 dòng phẳng; subagent → cùng rail `pl-[34px]`; orchestrator →
  `rounded-lg`.
- **Bỏ `$` trong sidebar** — `globals.css:336-339` tự phê bình "giao diện đọc
  như một cửa sổ terminal"; `$` lặp ở mọi nhóm ngày mang thông tin bằng 0.
- **Gộp gutter sidebar** — hiện có 3 lề trái 12/16/24px.
- **`tracking` chưa có thang** — 165 call site `tracking-[...]` tự chế, đây là
  trục duy nhất chưa có thang; thêm `wide`/`caps` sẽ thay 165 magic number.
- **Sửa số sai trong comment** `composer.tsx:1115` và `:1546` (4.38:1 → 4.67:1;
  và 4.01:1 → số thật của `text-warning` trên `bg-warning/10`). Override
  `text-primary` giữ nguyên — nó vẫn cần thiết, chỉ mô tả lại lý do.

## Không làm (có chủ đích)

- Dark mode — vi phạm ràng buộc #6.
- Thêm shadow source thứ 5 — ràng buộc #1.
- Đổi `accent #2a7360` — đạt AA ở mọi nền, đúng lựa chọn 1 màu nhấn.

## Trạng thái sửa (cập nhật cuối)

**Xong + verify xanh:**
- **(1) Double-send** — khoá `submittingRef`, nhưng phải bỏ qua `queueAs` (xem ghi chú
  Thứ tự đề xuất). typecheck sạch, 125/125.
- **(2) Audit log bị Settings che** — `Z_CLASS.navigation` → `Z_CLASS.system`.
  Bất biến `approval < approvalCritical < navigation < system` giữ nguyên vì
  `lib/ui-z.ts` không đổi; `tests/a11y-contract.test.ts` canh nó và xanh.
- **(5) Escape chết** — thêm `useFocusTrap` cho `workspace-checkpoints.tsx`,
  `onEscape` bọc `useCallback` (nằm trong deps effect trap, arrow inline sẽ gắn
  lại listener mỗi lần mở diff).
- **Focus trap tranh Tab** — guard đỉnh-stack nâng lên trên cả hai nhánh.
- **Toast im lặng với screen reader** — vùng `aria-live` luôn trong DOM.
- **Toast ghi đè** — `notice-store.ts` thành FIFO (trần 5, bỏ trùng), chữ ký
  `showNotice`/`clearNotice`/`useNotice` không đổi nên 76 call site không phải
  sửa. Thêm `resetNotices()` cho unmount.
- **(7) Lỗi không hiện cạnh tin** — truyền `m.status` thật (nhánh `error` chạy
  được), banner lỗi ghim ra khỏi container cuộn, `role="alert"` + nút Thử lại.
- **(4) Quota 0%** — bỏ `Math.max(2, …)`, thêm `role="progressbar"`, migrate alias
  → token thật, và **thêm file vào `TOKENIZED_COMPONENTS`** (trước đó không ai canh).
- **Hàng rỗng** có nhãn SR — `rowIsEmpty` lấy từ đúng hàm mỗi khối con tự dùng.
- **Giảm chrome mỗi lượt** — reasoning thành dòng phẳng (bo đều, preview dòng
  ĐẦU để bề rộng ổn định khi stream), subagent vào cột `pl-[34px]` trên cùng rail
  `ToolChip`, orchestrator `rounded-lg`, evidence badge lên `text-meta`,
  `highlight.tsx` về `bg-accent-soft text-accent`, code block/blockquote về đúng
  thang bo góc + viền 1px.

**Verify gộp:** 5 file test UI **167/167 pass** · design-system **47/47** ·
a11y-contract **17/17** · lint **0 error, 8 warning** (baseline 9, giảm 1 vì
session trước đã xoá `tests/telemetry-tab.test.ts` — không phải do đợt này).

- **`.uic` cascade (BUG 3) — XONG, có bằng chứng build thật.** Chuyển vào
  `@layer components`. Tôi build CSS và đo lại: `.uic` **19160** <
  `.font-semibold` **47287** < `.tracking-[0.08em]` **47841** → `.uic` **thua**,
  đúng như mong đợi. Thêm assertion chặn cả hai đường lách; **tôi đã tự phá thử**
  (dịch `.uic` ra ngoài layer) và test đỏ đúng dòng thông điệp → không phải test
  rỗng. Đã khôi phục.
- **Chiều sâu — XONG, nhưng đề xuất của tôi SAI và đã bị bác bỏ.** Tôi đề xuất
  `0 1px 2px rgb(24 24 27/.07)`. Agent dựng bóng thật (Gaussian) và đo: bản đó
  **yếu hơn** bản cũ. Tôi tô phỏng lại độc lập và xác nhận **agent đúng, tôi sai**
  — nén blur 3→2px thu hẹp vùng tích luỹ alpha, `/.07` không bù kịp; vấn đề là
  **TỔNG alpha** chứ không phải blur. Giá trị đã áp dụng:
  `0 1px 3px rgb(24 24 27/.08), 0 6px 16px -4px rgb(24 24 27/.10)`.
  Lưu ý thang: `lift-lg` đang ở 9.5% nên biên trên của `lift-md` còn **1.4 điểm**
  — nâng tiếp phải nâng cả `lift-lg`, nếu không đảo thang.
- **2 comment sai** (`16.4:1`→`17.72:1`, `6.4:1`→`7.81:1`) đã sửa.

## Thứ tự đề xuất

1. **Ba bug nghiêm trọng (1, 2, 3)** → verify: typecheck + test liên quan; sửa
   token thì sửa cả 3 file cùng lượt.
   - **(1) Double-send — XONG.** typecheck exit 0, composer + design-system
     **125/125 pass**. Nhưng khoá phải **bỏ qua `queueAs`**: Alt+Enter xếp
     follow-up là hành vi cố ý (Alt+↑ lấy lại tin đã queue) và phải dùng được khi
     lượt trước đang chờ context. Khoá chung sẽ nuốt mất tính năng đó. `finally`
     cũng phải có điều kiện, nếu không một lượt queue kết thúc sau sẽ xoá khoá
     của lượt đang gửi thật → mở lại đúng cửa sổ double-send.
2. Bug 4–8 → verify: mở app thử (empty input, double submit, refresh) theo AGENTS.md §5.
3. Đợt chiều sâu + giảm chrome → verify: chụp 375/1024/1440 trước–sau, đo 0px tràn ngang.

## Ghi chú

- Không phải git repo → file sửa copy vào `.audit-backup-20261010/ui-fixes/` trước.
- **Đã xoá** 2 file `.bak` (`react/use-chat-orchestration.ts.bak-…`,
  `app/api/chat/route.ts.bak-…`) sau khi xác minh: không import ở đâu, và `tsc`
  không đưa chúng vào program (loại `.bak`). Backup vẫn còn trong
  `.audit-backup-20261010/ui-fixes/`.
- **Sửa** `scripts/check-docs-sync.cjs:61` — nó loại `node_modules`/`.git`/`.next`
  nhưng không loại `.audit-backup-*`, nên đợt này dựng lên 30 lỗi docs giả từ bản
  backup đã lỗi thời. Đây là script quét cây thư mục vì dự án không có git.
- `npm run docs:check` VẪN đỏ sau khi sửa trên, vì còn lệch dòng thật có sẵn
  từ session dead-code trước (chủ yếu do `DOCS_TSX_ARCHITECTURE.md` đã bị gỡ
  2026-10-11, nên các điểm lệch thuộc về doc đó đã hết; phần còn lại là số file
  test ghi 220 thực tế 224). **Không sửa ở đợt này** — cần một đợt riêng cập nhật docs.
- `react/use-streaming-text.ts`: không có call site nào. Trước đây được giữ lại vì
  `DOCS_TSX_ARCHITECTURE.md:442` mô tả nó như một tầng kiến trúc; doc đó đã gỡ
  nên lý do giữ không còn. **Cần user quyết** — xoá hay giữ.

## Còn lại — cần user quyết

1. **`tests/message-item-timeline.test.ts:75,77` khoá vị trí cũ của reasoning**
   ("dời nó lên trên là ĐỎ", "phải là khối cuối cùng"). §15.1 yêu cầu reasoning ở
   TRÊN tool trace. Đợt này giữ vị trí cũ vì sửa test là việc khác.
2. **`.field-label` cùng loại lỗi tiềm ẩn** — `globals.css:319` cũng khai ngoài
   layer và vẫn khai `font-weight`/`letter-spacing`. Chưa nổ vì chưa call site nào
   ghép nó với `font-*`/`tracking-*` (grep 74 chỗ, 0 khớp), nhưng lần ghép tới sẽ
   hỏng im lặng y hệt `.uic`.
3. **`use-chat-orchestration.ts:3047`** provider trả rỗng thì chỉ ghi annotation
   `{error:'EMPTY_RESPONSE'}`, KHÔNG đặt `status:'error'` → badge lỗi ở cấp tin không
   bắt được trường hợp này.
4. **`use-chat-orchestration.ts:801`** `showNotice` nằm trong `for` loop ghi hàng
   loạt file → một đợt có thể đẩy hàng chục thông báo. Đã có trần 5 ở store nhưng
   gốc rễ nên gom lỗi rồi báo một thông báo.
5. **Chiều sâu chưa nghiệm thu bằng mắt** — §12/§14.9 vẫn chưa đạt. Con số đo
   được trên mã, chưa có ảnh. Cần chụp 375/1024/1440 và soi.
6. **`npm run typecheck` đang đỏ ~9 lỗi ở `lib/teamwork/` + `tests/teamwork-*`** —
   session khác đang sửa song song, **không phải lỗi đợt này** (timestamp cho thấy
   file bị ghi đúng lúc tôi kiểm, và lỗi đổi từ `temporalContext` sang module
   `context` không tồn tại). Phần UI verify độc lập: 167/167 xanh.