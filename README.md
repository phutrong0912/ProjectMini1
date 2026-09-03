# 🎯 VKU Campus Facility Audit App (PWA & Android Native APK)

> **Hệ thống kiểm định & giám sát cơ sở vật chất giảng đường, máy chiếu, điều hòa và hệ thống điện dành cho cán bộ kiểm định và sinh viên giám sát VKU.**  
> Hoạt động ngoại tuyến 100% tại các khu vực tầng hầm, phòng thí nghiệm và tòa nhà mất sóng Wi-Fi / 4G / 5G.

---

## 📋 Tổng Quan & Bối Cảnh Thực Tế

Cán bộ quản trị cơ sở vật chất và sinh viên giám sát tại **Trường Đại học Công nghệ Thông tin & Truyền thông Việt - Hàn (VKU)** thường xuyên phải kiểm định thiết bị phòng học, hệ thống máy chiếu, điều hòa, tủ điện phân phối tại các tầng hầm kỹ thuật (Tòa nhà B, Khu thể thao đa năng) hoặc các phòng học xa trạm phát sóng — nơi hoàn toàn **không có sóng Wi-Fi và mạng di động (4G/5G)**.

Ứng dụng được thiết kế theo kiến trúc **Offline-First**, đảm bảo:
1. Khởi động tức thì dưới 1 giây mà không cần internet nhờ Service Worker App Shell caching.
2. Không bao giờ mất dữ liệu: Từng ký tự nhập và bước làm việc được tự động lưu theo thời gian thực vào IndexedDB.
3. Hàng đợi đồng bộ thông minh (FIFO Queue): Tự động đẩy khảo sát lên máy chủ ngay khi thiết bị kết nối mạng trở lại.
4. Đóng gói sẵn file cài đặt APK Android (`dist-apk/vku-facility-audit-debug.apk`) tích hợp quyền Camera và Network native.

---

## ✨ Tính Năng Cốt Lõi

### 1. 📱 PWA Standalone & Khởi Động Ngoại Tuyến Sub-Second
- **`public/manifest.json` chuẩn PWA**:
  - Cấu hình `display: "standalone"`, thanh điều hướng chuẩn app native.
  - Màu chủ đạo `theme_color: "#0284c7"` (VKU Sky Blue) và `background_color: "#0f172a"`.
  - Bộ icon đa kích thước độ nét cao: 192x192, 512x512 và icon maskable.
  - Hỗ trợ nút cài đặt nhanh trực tiếp trên giao diện trình duyệt.
- **Service Worker (`public/sw.js`)**:
  - Áp dụng chiến lược **Cache-First** đối với toàn bộ App Shell (HTML, CSS, JS, Icon, Font).
  - Tự động dọn dẹp cache phiên bản cũ khi kích hoạt.
  - Đăng ký lắng nghe sự kiện **Background Sync API** (`sync-vku-audits`).

### 2. 📝 Form Kiểm Định Đa Bước & Lưu Nháp Thời Gian Thực (IndexedDB)
- **Quy trình kiểm định 5 bước trực quan**:
  - **Bước 1 - Vị trí VKU**: Chọn Tòa nhà (A, B, C, V, K, Thư viện, Tầng hầm Thể thao, KTX), Tầng (Tầng hầm B1, Tầng 1–5, Sân thượng) và Số phòng.
  - **Bước 2 - Phân loại thiết bị**: Danh mục (Hardware, Projector, AC, Electrical, Furniture), tên model, mã Barcode/Thẻ tài sản VKU và số Serial.
  - **Bước 3 - Hiện trạng & Khuyết tật**: Đánh giá **1–5 Sao** với tiêu chí rõ ràng, nhãn lỗi thường gặp (Lưới lọc bẩn, Mất remote, Chập điện, Màn hình mờ...) và mức độ khẩn cấp (Thấp, Trung bình, Cao, Khẩn cấp nguy hiểm).
  - **Bước 4 - Bằng chứng hiện trường**: Chụp ảnh bằng chứng qua Camera (tích hợp `@capacitor/camera` trên Android và Web Camera fallback), nén ảnh tối ưu dung lượng, xem phóng to và gắn nhãn ảnh.
  - **Bước 5 - Xác nhận & Ký duyệt**: Tổng hợp thông tin, mã sinh viên / cán bộ kiểm định, lấy tọa độ GPS thực địa và nút gửi khảo sát an toàn.
- **Lưu nháp thời gian thực (Real-time Persistence)**:
  - Dùng thư viện `idb` ghi vào object store `active_draft`.
  - Tự động khôi phục nguyên vẹn dữ liệu khi tải lại trang, đóng trình duyệt hoặc tắt nguồn điện thoại.

### 3. 🔄 Hàng Đợi Ngoại Tuyến (FIFO) & Tự Động Đồng Bộ (Background Sync)
- **Định danh UUID & Trạng thái `PENDING_SYNC`**:
  - Mỗi phiếu gửi đi khi mất mạng được cấp mã UUID duy nhất, gắn nhãn thời gian ISO và lưu vào hàng đợi `audit_queue`.
- **Cơ chế tự động đồng bộ tuần tự (FIFO Sequential Dispatch)**:
  - Lắng nghe sự kiện mạng từ `@capacitor/network` và `window.ononline`.
  - Xử lý gửi lần lượt từng phiếu theo thứ tự hàng đợi để tránh nghẽn băng thông yếu.
  - Thanh tiến trình phần trăm (%) trực tiếp trên đỉnh ứng dụng.
- **Nút mô phỏng mất sóng tầng hầm (Basement Mode Simulator)**:
  - Cho phép người kiểm thử bật/tắt chế độ mất sóng chỉ với 1 click ngay trên thanh tiêu đề để kiểm tra tính năng ngoại tuyến.
- **Ngăn kéo Hàng đợi (Queue Drawer)**:
  - Theo dõi danh sách phiếu `PENDING_SYNC`, `SYNCING`, `SYNCED`, `FAILED`.
  - Nút "Đồng bộ ngay", thử lại các phiếu lỗi và xuất file sao lưu JSON/CSV.

### 4. 🤖 Ứng Dụng Android Native (Capacitor) & File APK Đã Đóng Gói
- Tích hợp plugin native:
  - `@capacitor/camera`: Truy cập trực tiếp phần cứng máy ảnh thiết bị.
  - `@capacitor/network`: Giám sát trạng thái sóng vô tuyến thời gian thực.
- Khai báo đầy đủ quyền trong `android/app/src/main/AndroidManifest.xml`:
  - `CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `INTERNET`, `ACCESS_NETWORK_STATE`.
- File APK cài đặt hoàn chỉnh:
  - **Đường dẫn**: `dist-apk/vku-facility-audit-debug.apk`
  - **Kích thước**: ~6.03 MB
  - Biên dịch bằng Gradle 8.2.1 và OpenJDK 17.

---

## 📂 Cấu Trúc Dự Án

```text
ProjectMini1/
├── android/                             # Dự án Android Gradle gốc (Capacitor Scaffolding)
│   ├── app/
│   │   ├── src/main/AndroidManifest.xml # Khai báo quyền Camera, Network, Storage
│   │   └── build/outputs/apk/debug/     # APK đầu ra từ Gradle
│   ├── gradlew                          # Gradle wrapper
│   └── local.properties                 # Đường dẫn Android SDK
├── dist/                                # Thư mục web build (App Shell)
├── dist-apk/
│   └── vku-facility-audit-debug.apk     # File APK Android hoàn chỉnh (6.03 MB)
├── public/
│   ├── favicon.svg                      # Favicon SVG
│   ├── manifest.json                    # Web App Manifest (display: standalone, #0284c7)
│   ├── sw.js                            # Service Worker (Cache-First & Background Sync)
│   └── icons/                           # Bộ icon PWA 192x192, 512x512, maskable
├── scripts/
│   └── verify.js                        # Bộ kiểm thử tự động 6 tiêu chí kỹ thuật
├── src/
│   ├── components/
│   │   ├── Header.tsx                   # Header VKU, nút mô phỏng tầng hầm, huy hiệu sync
│   │   ├── OfflineBanner.tsx            # Banner cảnh báo mất sóng & thanh tiến trình sync
│   │   ├── InspectionWizard.tsx         # Bộ điều khiển 5 bước & khôi phục bản nháp
│   │   ├── Step1Location.tsx            # Bước 1: Vị trí tòa nhà, tầng, phòng
│   │   ├── Step2Equipment.tsx           # Bước 2: Phân loại thiết bị, mã Barcode
│   │   ├── Step3Assessment.tsx          # Bước 3: Đánh giá 1-5 Sao, nhãn lỗi, mức khẩn cấp
│   │   ├── Step4Evidence.tsx            # Bước 4: Chụp ảnh hiện trường, xem phóng to
│   │   ├── Step5Review.tsx              # Bước 5: Tổng hợp, GPS, xác nhận người kiểm định
│   │   ├── QueueDrawer.tsx              # Ngăn kéo quản lý hàng đợi FIFO & xuất JSON
│   │   └── AuditHistory.tsx             # Lịch sử phiếu khảo sát lưu trong IndexedDB
│   ├── services/
│   │   ├── db.ts                        # Cơ sở dữ liệu IndexedDB (idb wrapper)
│   │   ├── network.ts                   # Giám sát kết nối mạng (Capacitor & Web)
│   │   ├── camera.ts                    # Dịch vụ Camera Native & Web Fallback
│   │   └── sync.ts                      # Động cơ đồng bộ nền FIFO tuần tự
│   ├── types/
│   │   └── audit.ts                     # Định nghĩa TypeScript
│   ├── App.tsx                          # Root component
│   ├── index.css                        # Tailwind CSS styles
│   └── main.tsx                         # Điểm vào React
├── capacitor.config.ts                  # Cấu hình Capacitor
├── tailwind.config.js                   # Cấu hình màu VKU (#0284c7)
└── package.json                         # Dependencies và scripts
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Yêu Cầu Môi Trường
- **Node.js**: Phiên bản 18.x trở lên.
- **NPM**: Đi kèm Node.js.

### 1. Khởi động Web Dev Server
```bash
npm run dev
```
Truy cập: `http://localhost:3000`

### 2. Biên dịch Production Web (PWA)
```bash
npm run build
```

### 3. Chạy Bộ Kiểm Thử Tự Động (Verification Suite)
```bash
node scripts/verify.js
```
*Kiểm tra tính hợp lệ của Manifest, Service Worker, Bộ icon, Bundle dist, File APK và Android Permissions.*

### 4. Đồng bộ Capacitor & Biên dịch lại APK Android
```bash
npm run build:apk
```
*Lệnh này sẽ tự động build web, sync sang thư mục `android/`, gọi Gradle build và sao chép APK vào `dist-apk/vku-facility-audit-debug.apk`.*

### 5. Cài đặt APK lên thiết bị Android qua ADB
```bash
adb install dist-apk/vku-facility-audit-debug.apk
```

---

## 🧪 Kịch Bản Kiểm Thử Ngoại Tuyến (Test Scenarios)

### Kịch bản 1: Kiểm thử Lưu nháp tự động khi mất điện / reload
1. Mở ứng dụng trên trình duyệt hoặc điện thoại.
2. Chọn Tòa nhà, Tầng, nhập Số phòng và Tên thiết bị ở Bước 1 & Bước 2.
3. Nhấn phím `F5` hoặc đóng hẳn tab trình duyệt rồi mở lại.
4. **Kết quả**: Banner *"Đã tự động khôi phục bản nháp khảo sát lúc [Giờ:Phút]"* xuất hiện và toàn bộ thông tin đã nhập được giữ nguyên vẹn.

### Kịch bản 2: Kiểm thử Hàng đợi Ngoại tuyến & Tự động đồng bộ (Tầng hầm)
1. Trên thanh tiêu đề (Header), nhấn vào nút **"Trực tuyến"** để chuyển sang **"Tầng hầm (OFF)"** (mô phỏng mất sóng vô tuyến tầng hầm VKU).
2. Hoàn thành 5 bước khảo sát, chụp ảnh bằng chứng và nhấn nút **"Lưu vào Hàng đợi Ngoại tuyến (PENDING_SYNC)"**.
3. Mở ngăn kéo **"Hàng đợi"** để kiểm tra: phiếu khảo sát được gắn mã UUID và trạng thái `PENDING_SYNC`.
4. Nhấn nút **"Tầng hầm (OFF)"** để bật lại chế độ **"Trực tuyến"**.
5. **Kết quả**: Động cơ đồng bộ kích hoạt ngay lập tức, thanh tiến trình màu xanh chạy trên đầu trang và trạng thái phiếu tự động chuyển thành `SYNCED`.

---

## 📄 Bản Quyền & Giấy Phép

Dự án được xây dựng phục vụ công tác quản lý tài sản và cơ sở vật chất tại **Trường Đại học Công nghệ Thông tin & Truyền thông Việt - Hàn (VKU)**.
