# QUY TẮC TỐI CAO TRÊN TERMUX ANDROID (BẮT BUỘC TUÂN THỦ):
1. CẤM TUYỆT ĐỐI dùng `setsid`, `nohup`, hoặc các lệnh ép chạy ngầm.
2. CẤM dùng dấu ống dẫn phức tạp (`| tail`, `| wc`, `| grep`) trong bash.
3. Không tự ý chạy test hay kiểm tra nặng (vitest, docs:check, tsc) qua OpenCode. Chỉ chỉnh sửa file, việc chạy test để người dùng tự lo bên ngoài.
4. Mọi lệnh git bắt buộc phải có cờ `--no-pager`.
