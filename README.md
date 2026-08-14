<div align="center">
  <!-- Dải sóng lượn chớp tắt ở trên cùng -->
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:00A651,100:006400&height=180&section=header&text=BẢN%20ĐỒ%20MÙA%20HÈ%20XANH&fontSize=42&fontAlignY=35&animation=twinkling" width="100%"/>
  <br/>
  
  <!-- Logo chính chủ chèn ngay giữa -->
 
  
<img src="https://readme-typing-svg.demolab.com?font=Dancing+Script&weight=600&size=30&pause=0.5&color=00A651&center=true&vCenter=true&width=700&lines=B%E1%BA%A3n+%C4%90%E1%BB%93+S%E1%BB%91+UBND+C%C3%A1c+Ph%C6%B0%E1%BB%9Dng+M%E1%BB%9Bi;Chi%E1%BA%BFn+d%E1%BB%8Bch+M%C3%B9a+H%C3%A8+Xanh+2026;%E1%BB%A8ng+d%E1%BB%A5ng+B%E1%BA%A3n+%C4%90%E1%BB%93+Web+T%C6%B0%C6%A1ng+T%C3%A1c" alt="Typing SVG" />
 </div>

<p align="center">
  <img src="https://img.shields.io/badge/Chiến_dịch-Mùa_Hè_Xanh_2026-00A651?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Phiên_bản-1.0.0-00A651?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Trạng_thái-Hoạt_động-00A651?style=for-the-badge" />
</p>

---

### Tổng quan dự án

**Bản Đồ Số UBND TP.HCM** là dự án xây dựng hệ thống bản đồ tương tác hiển thị vị trí trụ sở các Ủy ban Nhân dân phường, xã mới của Thành phố Hồ Chí Minh sau đợt sáp nhập theo Nghị quyết số 1685/NQ-UBTVQH15. Đây là công trình thanh niên mang dấu ấn công nghệ thông tin thuộc chiến dịch Mùa Hè Xanh 2026, hỗ trợ người dân tra cứu thông tin địa lý và định vị cơ quan hành chính một cách nhanh chóng.

> "Công nghệ số hóa bản đồ đưa thông tin hành chính đến gần hơn với người dân."

---

### Truy cập trực tuyến

Hệ thống đã được triển khai hoàn thiện và có thể truy cập trực tiếp trên mọi thiết bị thông qua nền tảng Vercel:

**Link truy cập:** [https://mua-he-xanh-map.vercel.app](https://mua-he-xanh-map.vercel.app)

---

### Cấu trúc hệ thống

| File / Thư mục | Mô tả | Vai trò |
| :--- | :--- | :--- |
| **index.html** | Giao diện khung của bản đồ | Cấu trúc UI, tải thư viện |
| **style.css** | Định dạng giao diện trực quan | Giao diện hiển thị, hiệu ứng |
| **script.js** | Core logic xử lý bản đồ và thuật toán | Điều khiển tương tác, nội suy tọa độ |
| **DuLieuBanDo_CapNhat.geojson** | Cơ sở dữ liệu tọa độ và thông tin UBND | Nguồn dữ liệu chính |
| **hcm_new.geojson** | Dữ liệu vẽ lớp mặt nạ ranh giới TP.HCM | Tạo lớp phủ (Mask) khu vực |

---

### Tính năng kỹ thuật nổi bật

| Kỹ năng / Tính năng | Chi tiết | Thuật toán áp dụng |
| :--- | :--- | :--- |
| **Gom cụm khoảng cách** | Lọc điểm đại diện theo bán kính địa lý (km) thực tế. Bản đồ hiển thị gọn gàng, không bị chớp giật. | `Distance-based Clustering`, Toán học nội suy Pixel |
| **Hiệu ứng Spiderfy** | Tự động phóng to và bung các điểm liền kề về đúng tọa độ thực tế trên mặt đường khi click. | |
| **Tìm kiếm thông minh** | Tra cứu nhanh vị trí theo tên phường/xã mới và cũ. | Kỹ thuật `Regex` chuẩn hóa chuỗi Tiếng Việt không dấu |
| **Định vị GPS & Tính khoảng cách** | Xác định tọa độ người dùng và đề xuất danh sách UBND lân cận theo bán kính tùy chọn (5km, 10km, 15km). | `Geolocation API`, Thuật toán `Haversine` đo khoảng cách cầu |
| **Tối ưu hóa Render** | Sử dụng Canvas thay cho SVG/DOM Elements để vẽ đường thẳng và mặt nạ ranh giới, tăng tốc độ tải trang. | Cấu hình `preferCanvas: true` |
|**Data đã được xử lý kỹ càng**|Cả team đã cùng nhau lọc và điều chỉnh địa chỉ và toạ độ cho từng UBND phường. |**Team Work** |

---

### Công nghệ sử dụng

<p align="center">
  <img src="https://img.shields.io/badge/Nền_tảng-Web_Application-00A651?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Dữ_liệu-GeoJSON-00A651?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Triển_khai-Vercel-00A651?style=for-the-badge" />
</p>

| Thành phần | Công nghệ | Mục đích |
| :--- | :--- | :--- |
| **Front-end Core** | HTML5, CSS3, Vanilla JavaScript | Xây dựng giao diện và logic thuần, không phụ thuộc Framework. |
| **Định dạng không gian**| GeoJSON | Lưu trữ và trích xuất tọa độ địa lý dạng cấu trúc. |
| **Hosting** | Vercel | Triển khai web tĩnh tự động hóa, tốc độ cao. |

---
## Lưu ý quan trọng

Bản đồ này được xây dựng hoàn toàn phi lợi nhuận, hướng tới mục tiêu phục vụ cộng đồng và đóng góp vào công tác số hóa dữ liệu địa phương. Mặc dù đội ngũ phát triển đã nỗ lực đối chiếu thông tin sát nhất với thực tế, các dữ liệu về ranh giới hành chính và tọa độ UBND chỉ mang tính chất tham khảo tại thời điểm thực hiện dự án. Sản phẩm không có giá trị thay thế cho các văn bản, bản đồ địa giới hành chính chính thức do cơ quan Nhà nước ban hành.

<div align="center">
   <img src="Logo/logo%20DHSG_MHX_LOGO MHX.png" alt="Logo Mùa Hè Xanh SGU" width="280"/>
  <br/>
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:00A651,100:006400&height=120&section=footer" width="100%"/>
  <br/>
  <b>Thực hiện bằng tất cả tâm huyết bởi Team Bản Đồ Số - Đội hình bình dân học vụ - Mùa Hè Xanh SGU 2026</b>
  <br/>
  <sub>Chiến dịch Mùa Hè Xanh 2026</sub>
</div>
