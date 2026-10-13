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
