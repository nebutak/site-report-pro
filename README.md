# 🚀 SiteReport Pro - Hệ Thống Quản Lý Báo Cáo Thi Công Công Trình

**SiteReport Pro** là giải pháp phần mềm chuyên nghiệp giúp các nhà thầu, chủ đầu tư, tư vấn giám sát quản lý, lập báo cáo thi công hàng ngày (Daily Construction Report) một cách trực quan, chính xác và đồng bộ theo thời gian thực.

---

## 🎨 Tổng Quan Giao Diện & Thương Hiệu
Hệ thống được thiết kế với giao diện hiện đại, tối giản nhưng vô cùng trực quan:
- **Biểu tượng ứng dụng (Logo/Favicon):** Biểu tượng Khiên Bảo Vệ màu trắng được cách điệu bằng các đường nét kỹ thuật bản vẽ xây dựng, đặt trên nền Squircle (hình tròn bo góc) màu xanh nước biển hiện đại, thể hiện sự tin cậy, vững chắc và tính chuyên nghiệp của công trình.
- **Tone màu chủ đạo:** Hệ thống hỗ trợ Dark Mode & Light Mode linh hoạt với bảng màu xanh dương đậm (Slate/Blue/Indigo) phối hợp các màu trạng thái (Emerald - Thành công, Amber - Chờ duyệt, Purple - Thành viên).

---

## 🌟 Tính Năng Nổi Bật

### 🏢 Quản Lý Dự Án (Projects)
*   Thêm mới, cập nhật và quản lý danh sách các công trình/dự án đang triển khai.
*   Cấu hình thông tin nhà thầu, chủ đầu tư, đơn vị tư vấn giám sát, người lập báo cáo mặc định và các cấu hình email nhận báo cáo.
*   Quản lý Logo thương hiệu riêng cho từng dự án.

### 📝 Lập Báo Cáo Hàng Ngày (Daily Reports)
*   Lập báo cáo nhanh chóng theo từng ngày thi công cụ thể.
*   **Thông tin thời tiết:** Ghi nhận điều kiện thời tiết các buổi trong ngày (Nắng, Mưa, Bình thường, Sóng gió...).
*   **Quản lý nhân lực (Manpower):** Thống kê số lượng kỹ sư, công nhân, bảo vệ thực tế trên công trường.
*   **Quản lý thiết bị (Equipment):** Theo dõi số lượng máy móc thi công (Hoạt động, Sửa chữa, Hỏng hóc).
*   **Quản lý vật tư nhập (Materials):** Ghi nhận vật tư đưa vào công trường phục vụ sản xuất.
*   **Hạng mục thi công (Work Items):** Quản lý khối lượng thiết kế, lũy kế kỳ trước, thực hiện trong ngày, lũy kế thực tế và % hoàn thành. Hỗ trợ hệ thống cây hạng mục cha-con thông minh.
*   **Hình ảnh hiện trường (Images):** Tải lên và quản lý ảnh chụp thực tế tại công trường kèm mô tả/chú thích chi tiết.

### 🛡️ Phân Quyền & Phê Duyệt (Role & Approval Flow)
*   Hệ thống phân quyền phân cấp chặt chẽ:
    *   `ADMIN`: Toàn quyền quản trị hệ thống.
    *   `PROJECT_MANAGER`: Quản lý dự án, phê duyệt báo cáo ngày.
    *   `REPORTER`: Người lập và ghi nhận dữ liệu thực tế tại hiện trường.
    *   `REVIEWER`: Người kiểm duyệt dữ liệu trước khi gửi đi.
*   **Quy trình trạng thái báo cáo:** `Nháp (DRAFT)` ➡️ `Đang kiểm duyệt (IN_REVIEW)` ➡️ `Đã phê duyệt (APPROVED)` ➡️ `Đã gửi (SENT)`.
*   **Lịch sử phiên bản (Audit Log / Versions):** Theo dõi mọi thay đổi trong báo cáo, ghi nhận lý do điều chỉnh và khôi phục về các phiên bản cũ khi cần.

---

## 🛠️ Công Nghệ Sử Dụng

| Tầng (Layer) | Công nghệ / Thư viện |
| :--- | :--- |
| **Frontend** | React 19, **Next.js 15 (App Router)**, Tailwind CSS, TypeScript, Lucide Icons, React Hook Form, Zod |
| **Backend** | **NestJS 11**, Prisma ORM, JWT Authentication, Multer (Upload files), Class Validator |
| **Database** | **MariaDB / MySQL** (kết nối tối ưu qua `@prisma/adapter-mariadb`) |
| **Báo cáo & Xuất bản** | PDF generator (Puppeteer), Excel Generator (exceljs), Word Generator (docx) |
| **Quản lý Monorepo** | NPM Workspaces, Concurrently (chạy song song dự án) |

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
site-report-pro/
├── backend/            # Mã nguồn Server (NestJS Web API)
│   ├── prisma/         # Prisma Schema và Scripts Seed dữ liệu
│   ├── src/            # Controllers, Services, Modules chính
│   └── package.json
├── frontend/           # Mã nguồn Client (Next.js App)
│   ├── src/
│   │   ├── app/        # Next.js Pages & Layouts (Dashboard, Projects, Reports)
│   │   ├── features/   # Contexts & Modules dùng chung (Auth, Theme)
│   │   └── lib/        # API Client kết nối Server
│   └── package.json
├── package.json        # File cấu hình NPM Workspaces (Root)
└── docker-compose.yml  # File chạy các dịch vụ bổ trợ (nếu có)
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khể Chạy

### 1. Yêu Cầu Hệ Thống
*   Đã cài đặt **Node.js** (Khuyến nghị phiên bản `>= 20.x`).
*   Đã cài đặt hệ quản trị cơ sở dữ liệu **MySQL** hoặc **MariaDB**.

### 2. Cấu Hình Biến Môi Trường (Environment Variables)

#### Cấu hình Backend:
Tạo file `.env` tại thư mục `/backend` với nội dung:
```env
PORT=3001
DATABASE_URL="mysql://username:password@localhost:3306/site_report_pro"
JWT_SECRET="nhap_chuoi_khoa_bao_mat_cua_ban_tai_day"
NODE_ENV=development
```

#### Cấu hình Frontend:
Tạo file `.env.local` tại thư mục `/frontend` với nội dung:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Cài Đặt Dependency
Tại thư mục gốc dự án, chạy lệnh sau để tự động cài đặt thư viện cho cả Workspace Frontend và Backend:
```bash
npm run install:all
```

### 4. Khởi Tạo Cơ Sở Dữ Liệu
Chạy các lệnh sau trong thư mục `/backend` để đồng bộ cơ sở dữ liệu và seed tài khoản quản trị mặc định:
```bash
cd backend
npx prisma db push
npx prisma db seed
```
*(Tài khoản quản trị mặc định sau khi seed: **`admin@example.com`** / mật khẩu **`Password123`**)*

### 5. Khởi Chạy Dự Án Lập Trình (Development)
Tại thư mục gốc dự án, khởi chạy đồng thời cả Frontend và Backend chỉ bằng một lệnh duy nhất:
```bash
npm run dev
```
*   **Frontend (Client):** Sẽ chạy tại địa chỉ [http://localhost:3000](http://localhost:3000)
*   **Backend (API Server):** Sẽ chạy tại địa chỉ [http://localhost:3001/api](http://localhost:3001/api)

---

## 📝 Quy Trình Phát Triển & Đóng Góp
1. Luôn đồng bộ thay đổi cơ sở dữ liệu qua Prisma (`npx prisma migrate dev` hoặc `npx prisma db push`).
2. Giao diện luôn tuân thủ hệ thống theme linh hoạt (Light/Dark mode) lưu trữ tại LocalStorage.
3. Khi chỉnh sửa dữ liệu báo cáo, cơ chế versioning tự động ghi lại lịch sử bản ghi giúp tăng tính trung thực và bảo mật thông tin.
