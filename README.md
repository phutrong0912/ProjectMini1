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

## 🌐 Hướng Dẫn Triển Khai Live Demo Trực Tuyến

Dự án đã được cấu hình sẵn sàng 100% để deploy lên bất kỳ nền tảng lưu trữ tĩnh & serverless nào với đầy đủ hỗ trợ routing SPA, PWA Manifest và Service Worker:

### 1. 🐙 GitHub Pages (Tự động qua GitHub Actions)
Dự án đã tích hợp sẵn workflow tự động build và deploy trong [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
- **Bước 1**: Đẩy code lên GitHub:
  ```bash
  git add .
  git commit -m "feat: setup live demo deployment configs"
  git push origin main
  ```
- **Bước 2**: Trên giao diện GitHub của repository (`https://github.com/phutrong0912/ProjectMini1`):
  1. Vào **Settings** -> mục **Pages** (cột bên trái).
  2. Tại **Build and deployment** -> **Source**, chọn **GitHub Actions**.
- **Bước 3**: Workflow sẽ tự động chạy trong tab **Actions** và cung cấp Live URL tại:
  👉 **`https://phutrong0912.github.io/ProjectMini1/`**

---

### 2. ⚡ Cloudflare Pages (Khuyên dùng - Cực nhanh & Ổn định)
Dự án đã có file [`public/_redirects`](public/_redirects) để xử lý định tuyến SPA trên Cloudflare Pages:
- **Cách 1: Kết nối trực tiếp với GitHub (Khuyên dùng)**
  1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/).
  2. Chọn mục **Workers & Pages** -> Nhấn **Create application** -> Chọn tab **Pages** -> Nhấn **Connect to Git**.
  3. Chọn repository **`phutrong0912/ProjectMini1`**.
  4. Cấu hình thông số build:
     - **Framework preset**: `Vite`
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
  5. Nhấn **Save and Deploy**. Cloudflare sẽ cung cấp URL dạng:  
     👉 **`https://vku-facility-audit.pages.dev`**
- **Cách 2: Triển khai trực tiếp qua Wrangler CLI**:
  ```bash
  npx wrangler pages deploy dist --project-name=vku-facility-audit
  ```

---

### 3. ▲ Vercel
Dự án đã bao gồm cấu hình tối ưu trong file [`vercel.json`](vercel.json):
- **Cách 1: Kết nối qua giao diện Web (1 Click)**
  1. Truy cập [vercel.com/new](https://vercel.com/new).
  2. Chọn Import repository **`phutrong0912/ProjectMini1`**.
  3. Giữ nguyên cấu hình mặc định (Framework: `Vite`, Output: `dist`).
  4. Nhấn **Deploy**. Vercel sẽ tự động cung cấp Live URL dạng:  
     👉 **`https://project-mini-1.vercel.app`**
- **Cách 2: Triển khai qua Vercel CLI**:
  ```bash
  npx vercel --prod
  ```

---

### 4. 💠 Netlify
Dự án đã bao gồm cấu hình trong file [`netlify.toml`](netlify.toml):
- **Cách 1: Kết nối qua giao diện Netlify**
  1. Truy cập [app.netlify.com](https://app.netlify.com/) -> Nhấn **Add new site** -> **Import an existing project**.
  2. Chọn **GitHub** và cấp quyền truy cập repository **`phutrong0912/ProjectMini1`**.
  3. Nhấn **Deploy ProjectMini1**. Netlify sẽ build và cung cấp URL dạng:  
     👉 **`https://vku-facility-audit.netlify.app`**
- **Cách 2: Triển khai qua Netlify CLI**:
  ```bash
  npx netlify deploy --prod --dir=dist
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
