# Kế hoạch nâng cấp UI Vyen Harness (P0–P5) — Lấy cảm hứng từ DeepSeek Harness

Ngày cập nhật: 11/10/2026 (bản 2 — đã đối chiếu với mã nguồn thật).
Logo chính thức: `Downloads/Gemini_Generated_Image_wfrhj5wfrhj5wfrh.png`.

> **Bản 2 sửa lại 8 điểm của bản 1** sau khi đọc code, đo màu từ ảnh logo và
> chạy phép tính tương phản. Mục tiêu giữ nguyên; phần hiện thực phải theo các
> số đo ở §1.

---

## 1. Kết quả rà soát: bản 1 sai ở đâu

| # | Bản 1 nói | Thực tế đã kiểm tra |
|---|---|---|
| 1 | P0 logo **cần làm** | **Đã xong.** 3 SVG + `app/icon.svg` + 4 PNG + `favicon.ico` (16+32) đều có, và `icon.svg` đã không còn chữ K. Xem §2. |
| 2 | Logo là "bướm vi mạch" | Ảnh gốc là **não/bọt sóng** (đám mây tròn) có 2 mắt và 1 miệng nối bằng vạch. Vector hiện có vẽ đúng hình học này. Giữ nguyên, chỉ chỉnh màu. |
| 3 | `$` xuất hiện ở `sidebar.tsx:491,505,558` | **Đúng cả 3.** Đã xác nhận. |
| 4 | Composer có chip "Hỏi khi ghi" **và** "Tự chạy lệnh đọc…" là 2 setting | **Sai.** Là **cùng một setting** hiện 2 lần ở 2 breakpoint (`APPROVAL_COPY.smart.short` composer.tsx:146 ở dải trên, `.long` :147 ở footer `hidden lg:flex`). Không cần gộp — nó vốn đã là một. |
| 5 | "Năng lực chuẩn" nằm trong composer | **Sai.** Nó là **thanh trạng thái trên cùng**: `components/chat/status-line.tsx`. Composer không chứa dòng đó. Sửa nhầm file sẽ hỏng layout. |
| 6 | Có "banner đóng băng tab thu" cần thu gọn 28px | **Sai — không tồn tại.** Cái duy nhất là `ObserverBanner` (chat-interface.tsx:42-85) báo nhiều tab, không phải tab đóng băng. Hạng mục này **xoá khỏi kế hoạch**. |
| 7 | Chuỗi class 300+ ký tự ở `sidebar.tsx` và `tool-trace.tsx` | **Phần lớn sai.** Sidebar dài nhất 264 ký tự (:457); tool-trace chỉ **85** ký tự (:841). Chỉ `composer.tsx` vượt 300 (:1556, template literal). Lý do dựng `components/ui/` vì độ dài chuỗi class **yếu hơn bản 1 nói** — xem §3. |
| 8 | "Viền hairline là đánh đổi với WCAG 1.4.11" | **Câu này đúng, nhưng bỏ sót tiền đề:** app **đã** dùng viền không đạt 1.4.11 (`subtle` `#e5e5e5` = **1.26:1**). Xem §4. |

### Số đo đã tự chạy

Ảnh logo 2048×2048, khung nghệ thu `x 342..1855, y 406..1855` (1514×1450, tỉ lệ 1.044 — **không phải hình vuông**, cần canh lại khi khai báo viewBox).

| Màu | Đo được | Dùng làm gì |
|---|---|---|
| Lime sáng nhất | `#81EE61` (1.46:1) | **chỉ trang trí** — không làm chữ, không làm viền |
| Lime chủ đạo | `#6BD265` (1.90:1) | **chỉ trang trí** |
| Xanh đậm trên logo | `#11835F` (**4.73:1**) | nền nút, đạt AA |
| Miệng/mắt | `#138762` (4.50:1) | sát ngưỡng — **không dùng làm nền chữ trắng** |
| Chữ/link | `#0B7A53` (**5.35:1**) | accent cho chữ |
| Accent hiện tại | `#2a7360` (5.65:1) | sẽ đổi sang họ `#11835F` |

---

## 2. P0 — Logo: **đã xong**, chỉ còn 3 việc vỡ

PLAN.md bản 1 ghi "HOÀN THÀNH" và điều đó **gần đúng**. Xác minh từng mục:

- ✅ `public/icons/vyen-logo-full.svg` (2781 B), `-mark.svg` (1470 B), `-mono.svg` (1256 B) — đều vẽ hình não, không còn chữ V.
- ✅ `app/icon.svg` (1601 B) — chữ K đã bị thay.
- ✅ `components/vyen-logo.tsx` (209 dòng) — có `MARK_D`, gradient, mắt/miệng.
- ✅ `public/favicon.ico` — ICO count=2, đúng frame 16×16 + 32×32.
- ✅ PNG 180/192/512/maskable — nhất quán với SVG.
- ➖ **Lệch đường dẫn:** không có `public/manifest.webmanifest` tĩnh và không có `components/manifest.ts`. Thực tế là `app/manifest.ts` (Next `MetadataRoute`) — **chạy đúng chức năng**, chỉ sai mô tả. Không cần sửa.

**3 việc còn lại của P0:**

1. **Dead code.** `resolvedVariant` (vyen-logo.tsx:21) có 3 nhánh nhưng `variant` **không được truyền ở đâu cả** (`grep variant=` → 0 hit). Chỉ call site là :167 `<VyenMark size={isLarge ? 34 : 16} />` → luôn rơi vào nhánh `mark`. Nhánh `full` và `mono` **không bao giờ render**. → hoặc truyền `variant` thật, hoặc xoá 2 nhánh. Không để lại.
2. **`sharp` là dependency không khai báo.** `scripts/generate-png-icons.cjs` `require('sharp')` nhưng sharp **không có trong `package.json`** — chỉ resolve được vì Next khai nó là optionalDependency. `npm ci --omit=optional` là script chết. → thêm vào `devDependencies` pin chính xác, rồi `npm install --package-lock-only --ignore-scripts`. (AGENTS.md §9: dep có install script phải review + thêm ALLOWLIST trước.)
3. **`PiMark` / `PiLogo` không còn dùng.** Export còn, 0 usage. → xoá.

> ⚠️ **Không có git.** `C:/Users/huumanh/Downloads/Vyen-harness-main/.git` **không tồn tại**; `git status` → `fatal: not a git repository`. Có các thư mục backup cũ (`.audit-backup-20261010/`, `.audit-backup-phase0-2026-10-11/`, `.backup/`, `.pre-ui-fix-backup/`) nhưng **không có lịch sử**. Đây là refactor 8–12 ngày. **Việc đầu tiên phải làm là `git init` + commit trạng thái hiện tại** — không có lưới an toàn thì "surgical change" chỉ là ý tưởng.

---

## 3. P1 — Token và primitives

### 3.1 Token: **đừng làm bước chuyển hex → CSS var**

Bản 1 nói token đang "khai hai nơi" nên sửa một chỗ là lệch. Đọc code thì không đúng như vậy:

- `tailwind.config.ts:20-61` khai `hex` (29 giá trị) → đẩy vào `theme.extend.colors`.
- `tailwind.config.ts:14` có `token = (name) => 'rgb(var(--name) / <alpha-value>)'` cho **14 alias** đã đọc CSS var.
- `app/globals.css:25-107` khai `--token: R G B`.
- Tailwind config **đã có comment** (dòng 7-13) giải thích đúng lý do chia 2 nguồn: dạng channel RGB là để Tailwind vẫn áp `/60` modifier, còn token không cần alpha thì khai hex cho gọn.

Vậy đây là **phân tách có chủ đích**, không phải trùng lặp. Chuyển hết sang CSS var sẽ **làm hỏng `tests/design-system.test.ts:453`** (đòi `configHexes.size === 20` và so sánh hai chiều với `PALETTE_TOKENS`) và `:497` (đòi mọi `--token` trong globals.css nằm trong palette). → **Bỏ hạng mục này.** Thay bằng: sửa `accent` + 3 token viền, đi theo luật 3-file.

### 3.2 Thứ thực sự cần đổi

| Token | Hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `accent` | `#2a7360` (teal xỉn) | `#0B7A53` (5.35:1) | Khớp họ màu logo |
| `accent` (nền nút) | — | `#11835F` (4.73:1) | Trích từ logo, đạt AA |
| `border-subtle` | `#e5e5e5` | `rgba(0,0,0,0.06)` | Lớp trang trí, đã không đạt 1.4.11 sẵn |
| `border-default` | `#949494` (**3.03:1**) | `rgba(0,0,0,0.12)` | Xem §4 — đây là quyết định lớn nhất |
| `border-strong` | `#525252` | `rgba(0,0,0,0.20)` | |

**Luật bất di bất dịch:** sửa token ⇒ sửa **cùng một lượt** `tailwind.config.ts` + `app/globals.css` + `tests/design-system.test.ts` (DESIGN.md:22-24).

### 3.3 `components/ui/` — làm, nhưng vì lý do khác

Lý do đúng không phải chuỗi class dài (xem §1 #7), mà là: hiện có **0 primitive**, phần trùng lặp nằm rải ở `.btn-*` / `.icon-btn` / `.menu-item` trong `globals.css:344-408`, và `tool-trace.tsx` đang dựng 5 lớp trang trí cho 1 dòng.

Ưu tiên theo thứ tự giá trị, **không dựng cả 11 cái một lượt**:
1. `DisclosureRow.tsx` — dùng ngay ở P3 (tool row).
2. `TextShimmer.tsx` — dùng ngay ở P3 (trạng thái đang chạy).
3. `Button` / `IconButton` / `Pill` — gom class lặp ở sidebar + composer.
4. `Input` / `Menu` / `Dialog` / `Tooltip+Kbd` — để P4.

⚠️ **Chi phí ẩn:** `design-system.test.ts:643` và `:791` quét **toàn bộ** `components/` + `app/`; file mới phải nằm trong allow-list `TOKENIZED_COMPONENTS` (:42-100) và `:824` đòi mỗi file dùng ít nhất 1 semantic token. Mỗi primitive mới = 1 dòng allow-list + phải thoát quy tắc viền-kèm-màu ở `:615`. Tính vào trước khi làm.

### 3.4 Chi tiết lấy từ DeepSeek (đã đọc mã nguồn họ)

- **Hairline:** `border-width: 0.5px` thật, **hoặc** đưa vào box-shadow dạng `0 0 0 0.5px` cho mặt phẳng nổi (họ dùng cả hai; `--dsw-elevation-stroke`).
- **Hover/active:** `rgba` trên nền trong suốt — `--interactive-bg-hover: rgba(38,49,72,.06)`, `-hover-accent: .14`, `-active: .10`. Họ có thêm biến `-hover-solid` và **ghi rõ lý do**: token trong mờ làm nội dung lọt qua.
- **Focus:** `:focus-visible { outline-width: 2px }` + `html[data-input-modality='pointer']` → ẩn ring khi dùng chuột. Vyen đã có outline 2px ở `globals.css:154-157`; chỉ cần thêm script ~10 dòng.
- **`corner-shape`:** `@supports (corner-shape: superellipse(1.5))` trên `*, *::before, *::after`; **bắt buộc** phải opt-out `corner-shape: round` cho hình tròn (họ làm vậy ở ToolRow, StateDot, scrollbar) — bỏ sót thì mọi bo góc thành siêu elip.
- **Scrollbar:** `5px`, thumb `border-radius: 999px` + `background-clip: content-box`. Họ gate nhánh Firefox bằng `@supports not selector(::-webkit-scrollbar)` và **ghi chú phải như vậy** — trộn cả hai cách sẽ giết hover.
- **Thang bo góc:** xs 4, sm 8, md 12, lg 16, xl 20, panel 28.

> **Giấy phép:** DeepSeek Harness là **MIT, Copyright (c) 2026 DeepSeek** — tham chiếu code thì phải giữ notice. `BRAND_GUIDELINES.md` của họ là **chính sách thương hiệu, không phải giấy phép**: cấm dùng "DeepSeek Harness" trong tên dự án và cấm hàm ý bảo trợ chính thức. Họ dùng CSS Modules, ta dùng Tailwind → **lấy giá trị token và kỷ luật, không port công nghệ, không dùng tên hay bảng màu của họ.**

---

## 4. Quyết định đã chốt

### Q1. Viền hairline — chấp nhận, có điều kiện

Đã đo (bảng §4 ở phần trên): **mọi** bậc hairline của DeepSeek đều **không đạt** WCAG 1.4.11 — 0.04 → 1.11:1, 0.06 → 1.14:1, 0.10 → 1.25:1, 0.12 → 1.32:1, 0.16 → 1.45:1, 0.20 → 1.61:1. Ngưỡng là 3:1.

Nhưng bối cảnh bản 1 bỏ sót: **`border-subtle` hiện tại `#e5e5e5` đã chỉ 1.26:1** — tức app *đã* dùng viền trang trí không đạt. `border-default` `#949494` (3.03:1) là nơi duy nhất đang đạt.

→ **Quyết định:** giữ một tầng đạt 3:1 cho **form control trong Settings** (nơi cần phân biệt ranh giới ô nhập), các nơi khác dùng hairline. Bù bằng placeholder, icon, và focus ring 2px. Ghi rõ sự đánh đổi này vào DESIGN.md §2.3 kèm số đo — không sửa token rồi im lặng.

### Q2. Dark mode — **để sau** (theo chỉ đạo)

DESIGN.md §7 khoá light-only; `design-system.test.ts:1700` cấm mọi biến thể `dark:`; `tool-trace.test.ts:772` lặp lại điều đó. (Hai test này **đặt tên trái nhau** — một nói "dark-only", một nói "một theme sáng" — nhưng cùng cấm `dark:`, và `.dark` ở `globals.css:121-123` là no-op `color-scheme: light`.) Sau P1 thì chi phí thêm thấp, nhưng **không phải việc của đợt này.**

### Q3. Logo — **giữ vector hiện có**

Vector đã có khớp hình học ảnh gốc. Chỉ chỉnh **màu accent** sang họ `#11835F`/`#0B7A53`, và sửa viewBox cho đúng tỉ lệ **1.044:1** (đang giả định vuông). Lime `#6BD265`/`#81EE61` chỉ để trang trí. Ba bản full / mark / mono giữ nguyên chiến lược (≥48px 2 lớp viền; 16–32px 1 lớp + màu đặc vì 2 lớp mảnh sẽ nhoè ở favicon).

### Q4. Titlebar — **làm kiểu "tấm main nổi"**

Launcher chạy Edge `--app` (kiểm tra lại `scripts/launch-desktop.cjs` trước khi đụng), nên không cần custom titlebar: sidebar khác nền, main bo góc nổi lên.

---

## 5. Các giai đoạn còn lại

> Mọi hạng mục đã bị bác ở §1 (mục 4, 5, 6) **không quay lại**. Bỏ hẳn.

### P1 — Token + primitives *(1–2 ngày)*
1. `git init` + commit nền. *(Làm trước mọi thứ.)*
2. Đổi `accent` + 3 token viền — **3 file cùng lượt**.
3. Ghép `lift-*`/`.well` thêm lớp hairline, **giữ đúng 4 nguồn bóng** (test `:245` đòi đúng 4, `:428` đòi đúng key set).
4. `corner-shape` + `data-input-modality` + scrollbar 5px, có `prefers-reduced-motion`.
5. `DisclosureRow` + `TextShimmer` + `Button`/`IconButton`/`Pill`.
6. Dọn P0: xoá `PiMark`/`PiLogo`, xử lý nhánh `full`/`mono` chết, khai `sharp`.

**Chứng minh:** `npx vitest run tests/design-system.test.ts` xanh · `npm run typecheck` 0 lỗi · `npm run lint` 0 lỗi.

### P2 — Shell *(1–2 ngày)*
- `components/sidebar.tsx`: bỏ `$` ở **:491, :505, :558**; nhóm ngày (`h2` :557) đổi sang chữ thường 12px xám — hiện là `uppercase tracking-[0.08em] text-accent`, tức **đang tranh chấp màu với nút chính**; nút New session (:485) `bg-primary` full-width → ghost 36px.
- `components/backup-reminder.tsx`: hiện là `notice-warn` **trong sidebar**, ~110–130px. → toast, hoặc chấm báo cạnh Cài đặt. Nhớ nó tự ẩn sau 1 ngày (`SNOOZE_DAYS`).
- `components/chat/status-line.tsx`: pill ACT (:164) là toggle plan/act thật — làm thành segmented control; context meter (:250) `h-1.5 w-12` + tooltip `7.7k / 200k` (hiện thiếu khoảng trắng quanh `/` ở :260).

### P3 — Lõi chat *(2–3 ngày)*
- **Hero** (`message-list.tsx:737-778`): `VyenLogo` 34px trong tile 64px → ~40px; bỏ pill `agent` và dòng `AI Innovations`; gợi ý thành ghost chip.
- **Composer** (`composer.tsx`): dải chip trên :1217 + toolbar :1503 + dòng phím tắt :1673 → **còn 1 hàng**. Giữ nguyên cơ chế 2-breakpoint của chip quyền (chỉ đổi nhãn).
- **Tool trace** (`tool-trace.tsx:841`): bỏ 5 lớp trang trí (shadow + nền + vạch trái 2px + hover) → dòng 24px không nền, trạng thái chạy = shimmer, chữ "đang chạy" (`statusLabel` :815) thành `.visuallyHidden`.
- **Gom cụm tool call**: hiện **không có** (`lib/agent-tools.ts:694` ghi rõ guard dedupe đã bị gỡ) và `groupByPhase` (`lib/tool-phases.ts:119`) chỉ nhóm **theo phase**, không gộp dòng. Đây là **tính năng mới**, không phải sửa lại — và DeepSeek dùng cơ chế liên kết linked-list + flush buffer (`process-groups.ts:153-179`), phức tạp hơn vẻ ngoài. **Đề xuất: bỏ khỏi đợt này**, làm sau. "đang chạy" xuất hiện 13 lần trong file nhưng **chỉ 1 là code thật** (:815), 12 cái còn lại là comment.
- **Bong bóng user** (`message-item.tsx:299`): `max-w-[76%]` → ~70%, `.user-note` (`globals.css:652`) `rounded-xl` → bo 20px. Assistant cố ý **không** có bọng — giữ nguyên.

### P4 — Settings, menu, trạng thái *(1–2 ngày)*
Nền mờ trong suốt cho menu/popover, settings dialog theo primitive P1, skeleton + empty/error state.

### P5 — Hoàn thiện *(1–2 ngày)*
Motion 150–200ms + `prefers-reduced-motion`, rà tương phản lại (**đo, không ước lượng**), chụp before/after ở 375/768/1024/1440 vào `docs/design-qa/YYYY-MM-DD-<kebab>/` theo đúng convention sẵn có (3 thư mục mẫu: `2026-10-06-type-scale`, `2026-10-07-turns`, `2026-10-08-composer`).

---

## 6. Ràng buộc kiểm thử — đọc trước khi sửa

`tests/design-system.test.ts` **1709 dòng, ~47 khối `it()`, toàn bộ là regex trên mã nguồn** (không render DOM). Đổi những thứ sau **chắc chắn làm đỏ**:

| Sửa cái này | Test nào đỏ |
|---|---|
| `border-default` / bất kỳ hex nào | `:453` (đòi đúng 20 hex + so hai chiều), `:497`, `:1254` (đo lại tương phản), và `composer-contrast.test.ts:386` (hardcode `#f9f9f9`) |
| Hex → CSS var | `:453` + `:497` ngay lập tức |
| Thang bo góc | `:369` (đơn vị px, tăng nghiêm ngặt), `:842`, `:897`, `:909`, `:926` |
| Bóng | `:245` (đúng 4 nguồn), `:428` (đúng key set) |
| Thêm file vào `components/ui/` | `:643`, `:791`, `:824` — phải thêm vào allow-list `TOKENIZED_COMPONENTS` (:42-100) |
| Viền trong input | `:1144` cấm `outline-none`/`focus:ring-0` trên input (trừ `composer.tsx` + `settings-dialog.tsx`) |
| Transition | `:1230` cấm `duration-(0\|50\|75\|100)`, `:1420` cấm `<150ms` |
| Bất kỳ `dark:` nào | `:1700` |

Ngoài ra: `composer-affordances.test.ts:466` đòi chip có `rounded-lg`; `tool-trace.test.ts:772` cấm `dark:`. **Không có file `.snap`** nào → không rủi ro snapshot.

Lệnh: `npm run typecheck` → `npm run lint` → `npx vitest run tests/<file>.test.ts`. `npm test` là **225 file cả bộ**. Vòng lặp nhanh dùng `--related <files>`.

---

## 7. Nghiệm thu

1. Cùng trạng thái với 2 ảnh gốc, so before/after ở 4 bề rộng.
2. Composer: 3 tầng chrome → 1.
3. Tool row: hết nền, hết viền, cao 24px.
4. Sidebar: hết `$`.
5. Tương phản **đo lại và đính kèm số**, test xanh, typecheck + lint sạch.
6. `git log` cho thấy từng bước tách được.

## 8. Việc chưa làm, ghi để khỏi quên

- **Gom cụm tool call** — bỏ khỏi đợt này (§5 P3), làm sau.
- **Dark mode** — để sau theo chỉ đạo.
- **Chi tiết hoàn thiện khác** (tooltip có phím tắt, skeleton, empty/error state) — P4.
- `DESIGN.md` 117 KB **chưa được cập nhật**. Mọi quyết định ở §4 (đặc biệt là đánh đổi 1.4.11) phải được ghi vào §2.3 kèm số đo, nếu không lần sau lại đọc một spec nói điều không còn đúng.

---

## 9. Đợt "dễ dùng lần đầu" — 2026-10-12

Nguồn: đánh giá của người dùng trên ảnh QA `docs/design-qa/` (06–08/10), đã đối
chiếu lại với mã nguồn. **5/8 claim trong bản đánh giá đã được sửa trước 10/10**
(`$`, trùng nhãn trạng thái tool, banner sao lưu 130px, số "0" cạnh tên phiên,
nhãn tab Settings bị cắt — xem `PLAN.md` §5 + chính comment trong từng file).
Đợt này chỉ làm 3 việc **còn đúng** trong mã hiện tại.

### Bước 1 — Dấu `·` treo lơ lửng trên mobile (bug thật, chưa ai canh)

| Việc | Cách chứng minh |
|---|---|
| `components/chat/status-line.tsx:228` — `<Sep />` của workspace không `hidden`, span sau nó lại `hidden … lg:inline` → dưới `lg` hiện `·` không có nội dung phía sau | Test mới `tests/status-line-copy.test.ts`: đọc source, đoạn `workspace` phải có `<Sep />` **và** span cùng chịu chung một điều kiện hiển thị. Đảo ngược (bỏ `hidden` ở Sep) là ĐỎ |

Sửa: cho `<Sep />` đó `hidden lg:inline-flex` — cùng breakpoint với span nó
phân cách. Không đổi `Sep` dùng chung vì 2 chỗ còn lại (`:212`, `:255`) phải hiện
ở mọi bề rộng.

### Bước 2 — Nhãn tiếng Việt, bỏ thuật ngữ terminal

| Việc | Cách chứng minh |
|---|---|
| `status-line.tsx:194` in `act`/`plan` + class `uppercase` → ra "ACT"/"PLAN" | Test: `copyLiterals` không còn `act`/`plan`; nhãn mới là `Thực hiện`/`Khảo sát` |
| `status-line.tsx:136` `'rảnh'` → `'sẵn sàng'` | Cập nhật `tests/evidence-badge.test.ts:428` (đang khoá `'rảnh'`), giữ nguyên assert cấm `idle`/`running` |
| `settings/appearance-tab.tsx:120-130` `aria-label="Chế độ steering"`, option `Steering: từng tin` → `Tin nhập thêm: gửi ngay` / `Tin chờ AI rảnh`; `:115` câu giải thích bỏ chữ "steering"/"follow-up" | Test mới: không còn chuỗi `steering`/`follow-up`/`Steering`/`Follow-up` trong `appearance-tab.tsx` |

**Không đổi** `settings.steeringMode` / `followUpMode` (key store + `isQueueMode`
trong `lib/message-queue.ts`) — đây là đổi copy, không đổi hợp đồng dữ liệu. Đổi
key sẽ phải migrate dữ liệu đã lưu của người dùng, ngoài phạm vi đợt này.

### Bước 3 — Ngữ cảnh vượt 100% phải nói rõ đang vượt trần

| Việc | Cách chứng minh |
|---|---|
| `status-line.tsx:276` in `196k / 128k` không giải thích gì khi `percent > 100` | Test mới: khi `computeMeter(used > max)` thì chuỗi hiển thị phải kèm chữ `vượt trần`, và `title` phải nói rõ cần nén |
| Giữ nguyên quyết định **không clamp percent** (`context-meter.tsx`, khoá bởi `tests/context-meter.test.ts:49`) | Test cũ vẫn xanh — chỉ thêm lớp hiển thị, không đổi số học |

Quy ước chữ: `196k / 128k · vượt trần`. Màu đã là `error` nên không thêm màu mới.

### Kết quả thi công (2026-10-12)

| Bước | Đã sửa | File |
|---|---|---|
| 1 | `<Sep />` của workspace nhận `hidden lg:inline-flex`; `Sep` nhận thêm prop `className?: string` | `components/chat/status-line.tsx` |
| 2 | Pill mode `Khảo sát`/`Thực hiện`, bỏ `uppercase tracking-[0.08em]`; `runLabel` `rảnh` → `sẵn sàng`; Settings bỏ "steering"/"follow-up", hai `aria-label` + option đổi sang tiếng Việt | `components/chat/status-line.tsx`, `components/settings/appearance-tab.tsx` |
| 3 | Chuỗi ngữ cảnh kèm ` · vượt trần` khi `ratio > 1`; `title` phân nhánh, nói rõ cần bấm nút nén | `components/chat/status-line.tsx` |
| Test | Mới `tests/status-line-copy.test.ts` (4 describe / 11 `it`); cập nhật `tests/evidence-badge.test.ts:428` (`rảnh` → `sẵn sàng`, và thêm `rảnh` vào danh sách CẤM) | — |

**Không đổi** `settings.steeringMode` / `followUpMode` — đó là key store đã lưu
(`lib/message-queue.ts`, `lib/store.ts:461`), đổi key phải migrate dữ liệu.

### Đã kiểm chứng được / CHƯA kiểm chứng được

- ✅ **82/82 assert pass** bằng cách chạy đúng logic của
  `tests/status-line-copy.test.ts` qua một shim `expect`/`describe` tự viết
  (vitest không cài được — xem dưới).
- ✅ **Mutation test**: đảo ngược cả 5 lỗi (`<Sep />` bỏ `hidden`, nhãn về
  `plan`/`act`, `runLabel` về `rảnh`, bỏ chữ `vượt trần`, `aria-label` về "Chế
  độ steering") → **9 assert ĐỎ**. Không phải test xanh giả.
- ❌ **CHƯA chạy được** `npm run typecheck`, `npm run lint`, `npx vitest run`:
  sandbox không có mạng, `npm ci --offline` chết với `ENOTCACHED` (thiếu
  `zwitch-2.0.4.tgz` trong cache), `node_modules` rỗng. Cú pháp file test đã
  kiểm bằng `node --check` (hợp lệ), và mọi assert đã đối chiếu bằng tay, nhưng
  **đó không thay được ba lệnh trên**. Cần chạy lại khi có mạng:
  `npm ci --ignore-scripts` → `npm run typecheck` → `npm run lint` →
  `npx vitest related components/chat/status-line.tsx components/settings/appearance-tab.tsx --run`.
- ❌ **Chưa soi bằng mắt ở 375px**: con số ~62px cho pill trong comment là phép
  ước, chưa đo DOM. Cần chụp lại `docs/design-qa/` ở 375 để xác nhận hàng trạng
  thái không tràn ngang với nhãn mới dài hơn.

---

## 10. Đợt "lượt bị ngắt không được nói là xong" — 2026-10-13

Sửa nốt lỗi đo ở `docs/design-qa/2026-10-07-turns/`: tải lại trang giữa lúc
lượt đang chờ quyền thì lượt đọc thành `xong`. Đây là hạng mục cuối của đợt 12/10,
không thuộc P1–P5.

### Bản sửa gốc (đã có trong cây, chưa commit)

| File | Sửa |
|---|---|
| `lib/db.ts` `sanitizeToolInvocations` | invocation `state !== 'result'` **giữ nguyên** thay vì `continue` (xoá sạch) |
| `lib/turns.ts` `turnStatusOf` | đọc `status` của row để tách "phiên còn sống" với "phiên đã chết" |

Ràng buộc sống còn: mọi đường gửi model phải loại invocation chưa có kết quả.
**Đã truy đủ 3 tầng**, không chỉ tầng mà test soi:
`attachToolResultParts` (`route.ts:996`) chỉ dựng `parts` từ `state:'result'`;
`normalizeMessageToolInvocations` (`route.ts:1476`/`:1482`) gắn kết quả tổng hợp
cho phần còn lại trước `convertToCoreMessages`; zod schema (`:710`) nhận
`state:'call'` không kết quả. `lib/context-compaction.ts` và `lib/context-budget.ts`
đều xử lý được invocation treo, không ném lỗi.

### Việc làm thêm ở đợt này

| Việc | Chứng minh |
|---|---|
| Lượt bị ngắt → **`cancelled`**, không phải `stopping` | §15.5 cấm `stopping` khi "đã chắc chắn mọi tool đã ngừng"; sau tải lại trang thì chắc chắn đã ngừng. `cancelled` khớp điều kiện dương của bảng và là trạng thái cuối (gập được) |
| Xoá điều kiện chết `row.status === 'waiting_approval'` | đó là `TurnStatus`, không phải `status` của row; grep không có chỗ nào ghi giá trị đó lên message |
| `TURN_STATUS_MEANING.cancelled` nói rõ cả hai nguyên nhân | lượt đóng vì bấm Dừng, tải lại trang, hay đóng tab — và phải gửi lại yêu cầu |
| `tests/turns.test.ts` viết bằng tín hiệu sống thật (`streaming`) | bản cũ dùng `status:'waiting_approval'` nên xanh với đầu vào không bao giờ xảy ra, và giữ một nhánh điều kiện chết sống dai |
| `DESIGN.md` §15.5: "lỗ đã biết, chưa sửa" → đã sửa + ghi luật mới | spec đọc sai thì lần sau sửa tiếp theo nhầm lần nữa |
| `isOpenTurnRow` **giữ nguyên**, chỉ ghi rõ hệ quả bằng comment | thử bỏ dấu hiệu "tool treo" thì test `turns.test.ts:103` đỏ — luật này có chủ đích, không sửa trong một bản vá lỗi |

### Kết quả

- ✅ 13 file test liên quan: **327/327 pass** (chạy sau khi hoàn tất sửa).
- ✅ **Mutation test**: đảo `return isLive ? 'waiting_approval' : 'cancelled'` thành
  `return 'waiting_approval'` → **2 assert ĐỎ** đúng dòng. Không phải test rỗng.
- ⚠️ `npm run typecheck` và `npm run lint` **chạy được và XANH trước khi sửa**
  (typecheck exit 0; lint 0 lỗi / 8 warning). **Sau khi sửa thì chưa chạy lại
  được** — máy bị swap nặng và `tsc` treo >10 phút. Chạy lại trước khi commit.

### Còn lại, cần chốt riêng (không gộp vào bản vá lỗi)

- **`isOpenTurnRow` giữ lượt mở khi row `complete` + tool treo.** Sau tải lại
  trang, tin người dùng kế tiếp nối vào lượt đang ghi "đã hủy" cho tới khi trợ lý
  mới chạy. Sửa là **đổi luật ranh giới lượt** (luật này có test riêng và comment
  biện minh), không phải sửa lỗi — cần một đợt riêng.
- **Chưa soi bằng mắt**: mở app, vào một lượt đang chờ quyền, F5, xác nhận header
  hiện "đã hủy" và dòng tool hiện "bị bỏ dở".


---

## 11. Đợt "ba lỗi đã kiểm chứng bằng path:line" — 2026-10-13

Bản đánh giá UI (chấm 6.5/10, P0–P2) được đưa vào để đối chiếu. **5 subagent đọc
lại từng claim** — kết quả là **5 claim sai, 2 mục P0 sai cơ chế**, nên đã sửa
theo bằng chứng chứ không theo đề bài. Danh sách claim sai ở §11.2.

### 11.1 Ba việc đã làm

| Việc | Cách chứng minh | Kết quả |
|---|---|---|
| Trạng thái `null` (chưa biết) của kill-switch tô màu trung tính thay vì màu cảnh báo | `tests/scheduler-kill-switch-card.test.ts` (đọc source — repo không có DOM) | ĐỎ 3/5 → xanh |
| Nút chọn model bị khoá mà không lời: thêm nhánh "chưa có model nào → Thêm nhà cung cấp ở Cài đặt", và nhánh "chưa chọn model" cũng có lời | `tests/model-selector-title.test.ts` (7 assert) | ĐỎ 4/7 → xanh |
| Tab quay lại hiện thì **tự giành lại lock**, chỉ khi tab chính đã đóng băng | `tests/tab-lock-visibility-recovery.test.ts` (4 test hành vi thật, dựng document/navigator.locks/BroadcastChannel) | ĐỎ 2/4 → xanh |

**Luật của việc 3** (ghi để lần sau không sửa sai): chỉ tự giành khi **CẢ HAI** —
tab này đang hiện **và** tab chính đã đóng băng. Thiếu điều kiện thứ hai là
ping-pong: hai tab cùng hiện (chia đôi màn hình) đều còn heartbeat, mỗi tab cướp
lại của tab kia mãi. **Không sửa**: điều kiện hiện băng `!isLeader` và nút "Chiếm
quyền điều khiển" — chúng vẫn là đường thoát thủ công hợp lệ.

### 11.2 Claim sai của bản đánh giá (đã loại)

| Claim | Thực tế |
|---|---|
| "Banner khoá tab báo giả liên tục" | Sai. Heartbeat 2s tự tắt cờ frozen (tab-lock.ts:191, :61-63). Vấn đề thật là **thiếu tự phục hồi** — đó là việc 3. |
| "Nút gửi mù vì chưa chọn model" | Sai. composer.tsx:855-859 khoá vì ô nhập rỗng; thiếu model thì vẫn bấm được, chặn muộn ở use-chat-orchestration.ts:5474. Chỗ mù thật là **nút chọn model** — việc 2. |
| "Cảnh báo kill-switch báo trạng thái giả" | Sai một nửa. Nó **trung thực**: bridge không có lệnh đọc (scheduler-panel.tsx:154-159), và tests/scheduler-panel-honesty.test.ts:120 đang khoá nhãn đó. Sai ở chỗ **lúc nào hiện** và **tô màu thế nào** — việc 1. |
| "data-tab.tsx:169 lẫn Anh–Việt" | Sai cả path lẫn nội dung. File ở components/settings/data-tab.tsx:169, dòng đó là "Thống kê tiêu thụ Token". |
| "recipes-panel.tsx:458 lẫn Anh–Việt" | Sai ý. Đúng là text-disabled, nhưng chữ trong đó thuần tiếng Việt. |

Con số đúng sau khi tự đếm: text-micro 84 chỗ, text-meta 195 chỗ (khớp bản đánh
giá); tương phản text-disabled là **2.52:1** (bản đánh giá ghi 2.3–2.5); mảng lẫn
ngôn ngữ thật ~25 chỗ, tập trung ở mẫu "Tiếng Việt (English)" trong 15 tiêu đề tab
(settings-tabs.ts:69-91).

### 11.3 CHƯA làm — còn chờ một quyết định

**Onboarding ở màn trống.** Bản đánh giá chấm mảng này 3/10 và nói đúng phần
"không có lối vào": không có component onboarding nào trong repo. Nhưng cách sửa
phụ thuộc câu hỏi **người mở app lần đầu phải xong gì trong 5 phút đầu** — chưa có
câu trả lời nên chưa đụng. Khi có: chat-interface.tsx không có wiring `settings`
nào (grep rỗng), nên mở hộp Cài đặt từ màn trống tốn một chuỗi prop. Đó là phần
tốn công — đừng làm nửa vời.

### 11.4 Ràng buộc phát hiện khi làm

- **Không dùng `npx`** để chạy vitest: `npx vitest` đi tải mạng và treo >3 phút.
  Dùng `./node_modules/.bin/vitest`. Tương tự **không pipe vitest vào `tail`** — nó
  giữ pipe nên lệnh treo; ghi ra file rồi đọc file.
- Bản vá đầu tiên **ẩn** thẻ kill-switch khi Dexie rỗng. Đã bỏ — xem §11.5.

### 11.5 Sau review: một lỗi Critical do chính bản vá này tạo ra

Reviewer subagent tìm ra một lỗi **do bản vá tự sinh**, kiểu thầm lặng hơn lỗi
đang chữa: `forceStealLock` chỉ set `currentChatId` mà không set `leaderCallbacks`
(tab-lock.ts:128). Hệ quả: người dùng bấm "Chiếm quyền điều khiển" một lần, lần
cướp thất bại; tab chính đóng băng, tab quay lại tự giành **thành công thật**
(giữ Web Lock, bump epoch, heartbeat) nhưng `applyLockGrant` mang `requestId` cũ
nên `reduceTabRuntimeState` bỏ — **tab giữ lock thật mà UI vẫn kẹt ở OBSERVER**,
không log, và vòng tự phục hồi hỏng vĩnh viễn trong phiên đó. Đã sửa (một dòng) và
khoá bằng test `tab-lock-visibility-recovery.test.ts`.

Ngoài ra, một test trong bản vá đầu **bắn vòng lặp rỗng** (`visibilityListeners = []`
rồi duyệt chính mảng vừa xoá) — xanh kể cả khi guard "tab ẩn" bị xoá. Đã viết lại,
và **mutation check** xác nhận không còn test rỗng:

| Mutation | Kết quả |
|---|---|
| Xoá `if (document.visibilityState !== 'visible') return;` (tab-lock.ts:236) | đúng 1 assert ĐỎ (test "tab ẩn thì không giành") |
| Xoá `leaderCallbacks` trong `forceStealLock` | đúng 1 assert ĐỎ (test "callback mới nhất") |

**Đã bỏ phần ẩn thẻ kill-switch.** Reviewer chỉ ra hai nguồn sự thật: panel đọc
`db.schedules` (Dexie) còn daemon đọc `.vyen/schedules.json`
(`lib/scheduler/runner.ts:52`). Lịch do CLI thêm vào file, hoặc IndexedDB bị xoá,
vẫn chạy trong khi Dexie rỗng — ẩn thẻ lúc đó là **xoá van an toàn duy nhất khỏi
UI**. Muốn ẩn thì phải hỏi `scheduler.list()` (`lib/desktop-bridge.ts:610`, đã có
sẵn) trước; đó là một đợt riêng, không gộp vào bản vá 3 lỗi. Phần giữ lại: tô màu
trung tính cho trạng thái chưa biết.

**Ý kiến phản biện với reviewer** (không làm theo, có lý do):

- "Steal có thể không settle nên mất vĩnh viễn khả năng tự phục hồi" — suy đoán.
  Theo Web Locks, `steal: true` cấp lock ngay; `forceStealLock` resolve trong
  callback. Nhánh không thành công vốn đã gọi `startObserverWatch` nên tự vũ trang
  lại. Thêm timeout là sửa theo nỗi lo không có bằng chứng.
- Guard `typeof document` trong `stopObserverWatch` — thừa: `visibilityHandler`
  chỉ khác null khi `attachVisibilityRecovery` đã thấy `document` tồn tại.
- Thêm `startObserverWatch` vào nhánh `FORCE_YIELD` — đúng là khoảng trống thật,
  nhưng nó đổi hành vi (tab bị hạ xuống sẽ bắt đầu theo dõi và có thể hiện băng
  "tab chính đóng băng"), ngoài phạm vi bản vá này. Ghi lại ở đây.

### 11.6 Chưa kiểm được, cần soi bằng mắt

- **Tooltip của nút model khi `disabled`.** Chromium/Electron có thể không bắt
  hover trên form control bị vô hiệu hoá ⇒ `title` mới thêm không hiện đúng ở
  trường hợp nó nhắm tới. Nếu vậy thì dùng `aria-disabled` + chặn `onClick`, hoặc
  bọc trigger trong thẻ mang `title`. Test không soi được cái này.
- **Tự giành lại lock với hai tab thật**: mở app ở hai tab, đóng băng tab A, quay
  lại tab B, xác nhận B tự gõ được. Logic đã có test, hành vi thật thì chưa.
- **Hai test đỏ có sẵn từ trước đợt này** (không phải do bản vá):
  `tests/observer-banner-affordance.test.ts` (đòi 25 màu hex, `tailwind.config.ts`
  có 29 từ commit `60b7eea`) và `tests/evidence-badge.test.ts:511` (dấu gạch dài
  ở `components/chat/status-line.tsx:317`, từ `dbd671a`). Cần quyết định riêng:
  số hex đúng hay 4 màu đó lẽ ra phải chuyển sang CSS var theo luật 3-file ở §3.1.
  → Đã giải quyết ở §12.5 và §12.6.

---

## 12. Đợt "4 lỗi còn mở + 2 test đỏ có sẵn" — 2026-10-13

Bản đánh giá UI 6.5/10 được đưa vào. Đợt này KHÔNG sửa lại toàn bộ bản đánh giá:
người duyệt chốt phạm vi = **4 lỗi còn mở + 2 test đỏ có sẵn**.

### 12.0 Đối chiếu lại: mục đã xong không phải mục còn mở

| Mục của bản đánh giá | Thực tế trong repo |
|---|---|
| P0 "màn trống không có lối vào thêm nhà cung cấp" | **ĐÃ XONG** — `message-list.tsx:785-800` (thẻ + nút), `chat-interface.tsx:180` nối `openSettings('providers')`, commit `c5df013` |
| Chip model khoá không có lời | ĐÃ XONG — §11.1 việc 2 |
| Scheduler nút đỏ khi chưa biết trạng thái | ĐÃ XONG — commit `ffa1033` |
| "Cuộn xuống" hiện ở màn trống | CÒN MỞ — §12.1 việc 1 |

**§11.3 ("onboarding ở màn trống CHƯA làm, còn chờ một quyết định") đã lỗi thời**
— việc đó đã làm. Câu hỏi "người mới phải xong gì trong 5 phút đầu" vẫn chưa có
câu trả lời, nhưng phần đã có (thẻ + nút) không cần chờ nó nữa.

### 12.1 Bốn lỗi còn mở

Mọi lỗi đều là **hiển thị sai điều kiện**, không phải logic hỏng sâu. Vì repo
không có DOM (`vitest.config.mts` environment `node`, không jsdom), mỗi việc
được chặn bằng HAI lớp đúng như `tests/composer-affordances.test.ts` đã làm:
test hàm thuần (import helper export từ component, gọi thật) + test soi source
bắt đúng dòng JSX gọi helper đó. Lớp 2 là lớp quan trọng: helper đúng mà
không ai gọi thì lỗi vẫn sống.

| # | Việc | Chỗ sửa | Cách chứng minh |
|---|---|---|---|
| 1 | Nút "cuộn xuống" hiện ở màn trống | `message-list.tsx:957` | `showJumpToLatest()` thuần + source test chặn dòng JSX |
| 2 | "Xuất" hiện ở chat rỗng (Nén/Xoá đã có điều kiện) | `status-line.tsx:363` | source test: cả ba hành động header cùng chịu `hasMessages` |
| 3 | Gợi ý phím nói "Enter để gửi" trên thiết bị cảm ứng | `composer.tsx:1700`, `:1704` | `keyHint(sendOnEnter, isTouchDevice)` thuần + source test |
| 4 | Nút "Chiếm quyền điều khiển" nhỏ hơn vùng chạm | `chat-interface.tsx:98` | thêm vào `observer-banner-affordance.test.ts` |

**Không sửa cờ `isAtBottom` cho chat rỗng.** Cờ đó chỉ có MỘT chỗ tiêu thụ
(`chat-interface.tsx:165` → `message-list.tsx:957`; grep `isAtBottom` xác nhận),
nên chặn hiển thị là hết lỗi. Thêm reset state là việc không ai dùng tới.

**Luật của việc 3** (đừng sửa sai sau này): `handleKeyDown` không gửi khi
`isTouchDevice` (`composer.tsx:994`), và `Alt+Enter` cũng bị chặn (`:980`), nên
trên cảm ứng KHÔNG còn đường bàn phím nào gửi được. Dòng gợi ý vì thế phải nói
"Enter xuống dòng" và chỉ ra nút Gửi — không được hứa một phím không tồn tại.
Cùng luật này áp cho máy tính bảng có bàn phím (`(pointer: coarse)`).

### 12.2 Hai test đỏ có sẵn

| # | Test đỏ | Nguyên nhân thật | Cách sửa |
|---|---|---|---|
| 5 | `observer-banner-affordance.test.ts:49` | Đếm **key** (29) trong khi `design-system.test.ts:519` đếm **giá trị đã khử trùng** (25). 4 key thừa là 3 cặp trùng giá trị (`#ffffff`: surface/overlay/on-fill, `#575757`: secondary/diff-ctx, `#b3261e`: danger/diff-del) | Đổi sang đếm giá trị khử trùng — cùng bất biến với test khoá bảng màu, miễn nhiễm với việc thêm key có chủ đích |
| 6 | `evidence-badge.test.ts:511` | Em dash trong `title` của thanh ngữ cảnh: `status-line.tsx:317` | Đổi em dash thành dấu hai chấm |

Lưu ý độ nghiêm trọng của #5: assert đó đứng ở **cấp file**, nên nó làm hỏng
cả suite (0 test chạy) ⇒ toàn bộ phần khoá "băng quan sát không phải ngõi cụt
+ tương phản WCAG" đang không chạy, không phải một assert lẻ.

### 12.3 Ràng buộc khi làm

- **Không `npx`** (`./node_modules/.bin/vitest`), không pipe vào `tail` — §11.4.
- **CRLF**: file trên đĩa là CRLF, mọi regex có `\n` cứng phải chuẩn hoá trước
  (như `composer-affordances.test.ts:36-38`).
- **Mutation check** cho cả sáu việc (§11.5 đã làm một lần, giữ thói đó).
  Script mutation phải có `timeout` CỨNG cho từng lần chạy vitest và phải hoàn
  tác **trước khi** in kết quả: lần đầu không có, lệnh bị giết giữa chừng và
  bỏ lại sáu mutation trong cây, phải sửa tay (`/tmp/opencode/undo-mutations.cjs`).
- `npm run typecheck` chạy >10 phút không xong trên máy này (không in gì). Nếu
  hết giờ thì báo "chưa xác minh", không coi là xanh. → **ĐÃ XÁC MINH**: cho
  chạy một mình với 25 phút là xong, `tsc --noEmit` exit 0. Lần chạy hụt là do
  tranh CPU với vitest chứ không phải do lỗi kiểu.

### 12.4 Ngoài phạm vi, ghi lại không làm

- `tailwind.config.ts:12` ghi "Ứng dụng DARK-ONLY" trong khi bảng màu là
  light-only và `design-system.test.ts:1750` khoá "một theme sáng". Comment sai
  — nhưng sửa comment là việc riêng, không gộp vào bản vá lỗi.
- `vyen-logo.tsx:110` "chạy hoàn toàn trên máy bạn" sai với BYOK. Cần chốt
  câu mới trước khi viết.
- `composer.tsx:1673` và `:1697` là hai `div` lồng nhau có **cùng bộ class**
  (cả hai đều `mt-3 … sm:block`) ⇒ vùng gợi ý thừa 24px khoảng cách. Bỏ `div`
  ngoài sẽ đổi khoảng cách nhìn thấy, nên để người duyệt quyết.
- Banner sao lưu có ba cách đóng trùng nghĩa (`backup-reminder.tsx:107-127`).
- 15 tiêu đề tab lẫn Anh–Việt (`settings-tabs.ts:69-91`).
- Không có `<h1>` ở màn chính (chỉ `error.tsx`/`global-error.tsx`).

### 12.5 Đã làm — bằng chứng

Sáu việc, mỗi việc đã xem **ĐỎ trước** rồi mới sửa, và mỗi việc có một mutation
riêng đã xem **ĐỎ sau khi hoàn tác bản vá**:

| # | Việc | Test đỏ trước | Mutation xác nhận |
|---|---|---|---|
| 1 | Nút cuộn ở màn trống | `showJumpToLatest is not a function` + dòng JSX chưa gọi | Bỏ `hasMessages` → đúng 2 assert lớp source đỏ |
| 2 | Xuất ở chat rỗng | `hành động "Xuất" không nằm trong {hasMessages && …}` | Gỡ guard → đúng 1 assert đỏ |
| 3 | Gợi ý phím cảm ứng | `keyHints is not a function` (4 test) | `if (false)` thay cho `if (isTouchDevice)` → 2 assert đỏ |
| 4 | Vùng chạm nút chiếm quyền | `nút không nới vùng chạm bằng after:` + `nhãn nút vẫn ở 10px` | Bỏ `after:-inset-2` → đúng 1 assert đỏ |
| 5 | Đếm bảng màu | `expected 29 to be 25` (hỏng cả suite) | Thêm 1 màu mới → `expected 26 to be 25` |
| 6 | Em dash trong tooltip | `copy còn dấu gạch dài: status-line.tsx:317` | Trả em dash vào → đúng 1 assert đỏ |

**Một assert của chính tôi phải sửa lại.** Bản đầu khoá "chỗ dùng `isAtBottom`
phải đúng 3" — bản vá làm nó thành 5, tức tôi đã đoán sai số. Đổi thành assert
có nghĩa: không được tồn tại `{!isAtBottom` ở đâu trong JSX.

**Một test khác phải sửa neo, không phải nới assert.**
`tests/composer-contrast.test.ts` neo bằng chuỗi `"Shift+Enter xuống dòng"` để
tìm thẻ bao nó; chuỗi đó dời vào hàm `keyHints` ở cấp module nên
`enclosingClassOf` không còn thấy thẻ bao ⇒ suite đỏ 0 test. Đổi neo sang
`{hints.short}` (biểu thức JSX in dòng gợi ý). ý của test giữ nguyên: dòng gợi
ý phải nằm trong thẻ mang class, tách ra là đỏ.

### 12.6 Kiểm chứng cuối

| Lệnh | Kết quả |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | 0 lỗi, 8 cảnh báo có sẵn, không có ở file đã sửa |
| `vitest run` (231 file) | 5 file đỏ, **không file nào do đợt này** |

Năm file đỏ đều là **ngân sách thời gian** trên máy chậm, và tập hợp đỏ **đổi
giữa hai lần chạy** (secret-registry đỏ 2 ca ở lần 1, 3 ca ở lần 2;
`teamwork-enhanced-engine` chỉ đỏ ở lần 2):

| File | Assert | Số đo |
|---|---|---|
| `redteam-picker.test.ts:191` | `toBeLessThan(500)` | 2509ms |
| `secret-registry.test.ts:327` | `toBeLessThan(BUDGET_MS)` | 2659ms, 4081ms |
| `teamwork-enhanced-engine.test.ts:165` | `afterAll` timeout | 30079ms |
| `web-bridge.test.ts:316` | timeout spawn CLI | 69407ms |

Không file nào trong số đó import `composer` / `message-list` / `status-line` /
`chat-interface` / `tailwind.config` (grep rỗng), nên diff này không thể chạm
tới chúng.

### 12.7 Vòng code review — hai pass, và những chỗ review đúng hơn tôi

Hai reviewer subagent, tách theo file sửa và file test (một reviewer duy nhất bị
nuốt mất output hai lần — phải chia nhỏ thì mới trả lời được). Cả hai **chỉ báo
cáo, không sửa gì**.

**Pass 1 (mã production) — không có Critical.** Một Important thật:

| Phát hiện | Bằng chứng | Cách sửa |
|---|---|---|
| Claim "45px, qua ngưỡng 44px" SAI ~2px | Băng là con đầu của `flex h-full flex-col overflow-hidden` và có `py-1.5` (6px); nới 8px thì nhô 2px ra ngoài mép trên và bị cắt ⇒ vùng bấm thật ~43px | Băng `py-1.5` → `py-2`. **Và thêm assert** "băng chừa đủ padding cho phần nới", vì assert 45px ≥ 44 chỉ đọc class của nút nên không bắt được lỗi cắt |

**Pass 2 (test) — ba Important, đều thật:**

| Phát hiện | Cách sửa |
|---|---|
| Không assert nào khoá `after:content-['']` — bỏ đúng class đó thì `after` không sinh phần tử giả, vùng bấm rút về 29px mà **mọi assert vẫn xanh** | Khoá riêng tiền đề này (mutation đã xác nhận) |
| Assert tương phản mới là bộ dò đổi thuần tuý: nó không đọc `BUTTON_CLASS` nên không đổi cỡ chữ nào làm nó đỏ, và test cũ ở trên đã khoá cả hai token | Xoá |
| `indexOf('<ThinkingMenu')` trả -1 khi không tìm thấy, mà -1 < mọi chỉ số ⇒ xanh khi cái cần tìm đã bị xoá | Tách bước kiểm tra tồn tại, rồi mới so vị trí (mutation đã xác nhận) |

Ngoài ra reviewer chỉ ra một **lỗ hổng một chiều**: cả khối test về gợi ý phím
đều suy ra từ `handleKeyDown`, nhưng không gì khoá chiều ngược lại — bỏ
`!isTouchDevice` khỏi nhánh Enter thì bốn assert vẫn xanh trong khi dòng gợi ý
lại sai. Đã thêm assert khoá đúng hai nhánh đó.

**Hai chỗ tôi đã chốt sai và reviewer đúng:**

1. `expect(code).toContain('showJumpToLatest(hasMessages, isAtBottom)')` — tôi gọi
   đây là lớp 2 có tác dụng. Nó khoá *cách viết*, không khoá *hành vi*: đổi tên
   tham số hoặc bọc thêm một biến trung gian là đỏ mà lỗi vẫn không có. Đã đổi
   thành assert âm tính mang nghĩa: không được tồn tại `{!isAtBottom` ở đâu trong
   JSX, tức không ai được tự quyết hiện nút bằng cờ suông.
2. `DISTINCT_COLORS.size === 25` — tôi giữ vì "cùng bất biến với test khoá bảng
   màu". Đúng là trùng, nhưng nó biến một bảo hiểm đã có ở nơi khác thành quả
   bom cấp file — chính cái bom đã làm hỏng suite lần này. Đã hạ xuống còn
   "bảng đọc được không", và mutation xác nhận `design-system.test.ts` vẫn bắt
   được việc thêm màu mới (đỏ ở assert "khớp tailwind.config.ts theo cả hai
   chiều").

**Còn làm theo:** bỏ `font-sans` thừa trên nút, trả lại dòng trống bị xoá nhầm ở
`composer.tsx`, comment JSX nhắc nhánh cảm ứng, và đổi copy cảm ứng từ "nút Gửi"
sang "nút ↑" — vì nút gửi là nút tròn chỉ có mũi tên, không in chữ, nên "nút Gửi"
dẫn người dùng đi tìm một cái nhãn không tồn tại trên màn hình.

**Mutation của vòng review** (bốn cái, đều đỏ):

| Mutation | Assert đỏ |
|---|---|
| Bỏ `after:content-['']` | vùng chạm đủ 44px |
| Băng `py-2` → `py-1.5` | băng chừa đủ padding cho phần nới |
| Bỏ `!isTouchDevice` khỏi nhánh Enter | handleKeyDown không cho phép Enter gửi khi cảm ứng |
| Đổi tên `<ThinkingMenu>` | ChatExportMenu vẫn nằm trong cụm nút phải |

### 12.8 Kiểm chứng cuối (sau vòng review)

| Lệnh | Kết quả |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | 0 lỗi, 8 cảnh báo có sẵn, không có ở file đã sửa |
| `vitest run` (231 file) | 2 file đỏ, **không file nào do đợt này** |

Hai file đỏ còn lại đều là ngân sách thời gian: `redteam-picker.test.ts:191`
(`toBeLessThan(500)`, đo được 2101ms) và `secret-registry.test.ts:327`
(ReDoS budget, 2182–2970ms). Ở lần chạy trước còn thêm `teamwork-enhanced-engine`
và `web-bridge` đỏ rồi tự xanh ở lần này — đó là dấu hiệu flake do máy chậm, và
cả bốn đều nằm ngoài các file đợt này đụng tới.

---

## 13. Đợt "chốt cây xóa dở" — 2026-10-15

Bối cảnh: `task.md` (audit ngoài, chỉ đọc cấu trúc zip, không đọc được code) + cây
đang có 40 đường dẫn bị xóa chưa commit. Chủ repo đã chốt:

- Khôi phục 3 file còn được code tham chiếu: `lib/approval-binding.ts` (5 import),
  `public/sw.js` (`components/pwa-register.tsx` đăng ký `/sw.js`), và
  `tests/fixtures/mcp-demo-server.mjs` (`tests/mcp-live-stdio.test.ts` spawn).
- `docs/design-qa/`: bỏ 28 PNG khỏi git, giữ 3 `README.md` + `measurements.json`.
  Lưu ý: 3 README còn liệt kê tên PNG đã bị gỡ.
- Chờ chốt riêng: `PLAN-ui-audit.md`, `core/agent-runtime/index.ts` (barrel 0
  importer), `docs/superpowers/plans/2026-10-13-first-run-and-tab-lock.md`,
  `react/use-streaming-text.ts` (0 tham chiếu), `scripts/generate-png-icons.cjs`.

Đối chiếu `task.md` với repo thật: mục 2 (approval-binding "dual implementation" —
thật ra là facade typed gọi 1 nguồn duy nhất), mục 3 (3 script `verify:security`
không hề bỏ hoang) và mục 4 (`lib/media-models.ts` đang được dùng thật) **sai**;
mục 1a (2 bản SVG mono trùng byte) đúng — đã xóa bản sót ở `public/`; mục 5 là ý kiến —
repo giữ các micro-test vì chúng khóa bug thật.

| Bước | Chứng minh |
|---|---|
| 1. Khôi phục 7 file bằng `git restore` | 3 file + 4 file design-qa rời khỏi danh sách xóa |
| 2. `npm ci --ignore-scripts` | exit 0 |
| 3. `npm run typecheck` | exit 0 |
| 4. `npm run lint` | 0 lỗi mới |
| 5. Test hẹp: `approval-binding`, `core-state-machine`, `web-bridge`, `mcp-live-stdio` | xanh |
| 6. `npm run docs:check` | exit 0 |

Kết quả (2026-10-15):

- ✅ `npm ci --ignore-scripts` exit 0 — 666 package, 31 cảnh báo audit có sẵn (không chạy
  `audit fix`, sẽ đổi lockfile).
- ✅ `npm run typecheck` exit 0 (output rỗng).
- ✅ `npm run lint` 0 lỗi / 8 warning — đúng baseline, không thêm warning cho file khôi phục.
- ✅ Test hẹp: `approval-binding` 19/19 · `core-state-machine` 1/1 (file chỉ có một `it()`
  gộp) · `web-bridge` 29/29 · `mcp-live-stdio` 6/6 (fixture spawn được thật).
- ⚠️ `npm run docs:check` **crash ENOENT** lần đầu — không do 7 file đã khôi phục, mà do 3 file
  code vẫn đang xóa dở chưa commit: `core/agent-runtime/index.ts` (file đầu tiên theo thứ tự
  đọc), `react/use-streaming-text.ts`, `scripts/generate-png-icons.cjs`. `check-docs-sync.cjs`
  lấy danh sách từ `git ls-files` (index) rồi đọc worktree → mọi file xóa-chưa-commit đều làm
  crash. Gỡ bằng cách commit các xóa (bên dưới) → **chạy lại OK: 9 tài liệu, 0 lệch
  (610 file theo dõi)**. Phát hiện phụ để giành: `check-docs-sync.cjs` nên skip file thiếu
  thay vì crash — chưa vá, ngoài phạm vi đợt này.

Đã chốt và thi hành cùng ngày:

- Xóa `core/agent-runtime/index.ts` + `react/use-streaming-text.ts` (0 tham chiếu) — commit `b1b9e8e`.
- Bỏ 28 PNG `docs/design-qa/` (giữ README + measurements) + gỡ plan superpowers đã xong — commit `1339329`.
- Khôi phục (giữ lại): `PLAN-ui-audit.md` (còn mục chưa nghiệm thu + Lô G chưa quét) và
  `scripts/generate-png-icons.cjs` (tool tái sinh icon; PLAN §2 từng đề xuất khai `sharp` — để sau).
- Lint chạy lại sau khôi phục: vẫn 0 lỗi / 8 warning.
- Vá nốt mục 1a của `task.md`: xóa `public/vyen-logo-mono.svg` (bản sót của `907b29a`,
  trùng byte với `public/icons/vyen-logo-mono.svg`) — commit `a6460cb`; `docs:check` sau đó
  vẫn OK (609 file theo dõi).
- Còn lại: `task.md` untracked (không commit); 11 commit chưa push (6 cũ + 5 của đợt này) —
chờ chủ repo duyệt.

### Full suite 2026-10-15 (1 luồng, máy này)

`CI=true vitest run` (231 file, `--maxWorkers=1 --no-file-parallelism`): **3 đỏ / 3847**
(3842 pass, 2 skip; 759s) — cả 3 ở `tests/secret-registry.test.ts` khối ngân sách ReDoS
(`:327`; best-of-3 = 517 / 714 / 529ms vs trần 500ms). Chạy riêng file trên máy rảnh: đỏ y
hệt (517/714/529) → không phải nhiễu tải; máy này chậm (máy dev đo riêng 280–460ms; suite
759s vs 228s máy dev). Cùng họ đã ghi ở §12.6/§12.8 (từng 2–5 file đỏ, số nặng hơn
2182–4081ms). Đối chiếu phạm vi: `git diff 69b5b8e..HEAD` với pathspec của khối này
(`tests/secret-registry.test.ts`, `lib/secret-registry.ts`, `lib/security-sast.ts`,
`lib/tool-limits.ts`) = **rỗng** → không do 11 commit này. Ngưỡng thật của chốt chặn là
hồi quy quantifier trần (>5s cho 24k ký tự; bản hiện tại cách hồi quy 7–10 lần). Chốt tạm:
**để nguyên, không nới trần** (không nới assert để lấy xanh); muốn hết đỏ trên máy chậm
cần đợt riêng hiệu chỉnh test ngân sách. `redteam-picker.test.ts` lần này xanh (trước từng
đỏ 2101–2509ms).

### Code review 2026-10-15 (range `69b5b8e..1dffa3b`)

Reviewer subagent: **0 Critical, 0 Important — "Ready to push? Yes"** (tự kiểm chứng độc
lập: grep 0 tham chiếu còn lại cho mọi file bị xóa; chạy lại `docs:check` khớp §13; merge
`651e6b9` có tree trùng base). 4 Minor — chủ repo chốt 2026-10-15: **(1)+(2) đã sửa —
`0e5760e`** (DESIGN.md thêm chú thích "28 ảnh PNG đã gỡ khỏi git"; PLAN-ui-audit đóng hai
câu hỏi cũ; `docs:check` sau sửa vẫn OK 609 file); **(3)+(4) để nguyên** (hygiene lịch sử và
thẩm mỹ, không đáng viết lại/đụng). Push sẽ là fast-forward.
