L.TileLayer.prototype.options.referrerPolicy = 'strict-origin-when-cross-origin';

var map = L.map('map', {
    maxBounds: [[10.0, 105.0], [12.0, 108.0]],
    maxBoundsViscosity: 1.0,
    minZoom: 10,
    maxZoom: 19,
    preferCanvas: true, 
    attributionControl: false
}).setView([10.7769, 106.7009], 11);

L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    keepBuffer: 6,
    updateWhenIdle: false,
    attribution: '&copy; OpenStreetMap contributors, Tiles style by HOT'
}).addTo(map);

// 1. Tự tạo bộ từ điển Tiếng Việt nạp vào thư viện
L.Routing.Localization = L.Routing.Localization || {};
L.Routing.Localization['vi'] = {
    directions: {
        N: 'hướng Bắc',
        NE: 'hướng Đông Bắc',
        E: 'hướng Đông',
        SE: 'hướng Đông Nam',
        S: 'hướng Nam',
        SW: 'hướng Tây Nam',
        W: 'hướng Tây',
        NW: 'hướng Tây Bắc'
    },
    instructions: {
        'Head': ['Đi về {dir} trên {road}', 'Đi về {dir}'],
        'Continue': ['Tiếp tục đi trên {road}', 'Tiếp tục đi thẳng'],
        'SlightRight': ['Chếch sang phải vào {road}', 'Chếch sang phải'],
        'Right': ['Rẽ phải vào {road}', 'Rẽ phải'],
        'SharpRight': ['Rẽ ngoặt sang phải vào {road}', 'Rẽ ngoặt sang phải'],
        'TurnAround': ['Quay đầu lại vào {road}', 'Quay đầu lại'],
        'SharpLeft': ['Rẽ ngoặt sang trái vào {road}', 'Rẽ ngoặt sang trái'],
        'Left': ['Rẽ trái vào {road}', 'Rẽ trái'],
        'SlightLeft': ['Chếch sang trái vào {road}', 'Chếch sang trái'],
        'WaypointReached': ['Đã đến điểm dừng', 'Đã đến điểm dừng'],
        'Roundabout': ['Đi vào vòng xuyến và đi theo lối ra thứ {exitStr} vào {road}', 'Đi vào vòng xuyến'],
        'DestinationReached': ['Bạn đã đến nơi', 'Bạn đã đến nơi']
    },
    formatOrder: function(n) {
        return n;
    },
    ui: {
        startPlaceholder: 'Điểm xuất phát',
        endPlaceholder: 'Điểm đến'
    }
};

// 2. Khởi tạo tính năng chỉ đường (Bật lại language: 'vi')
let routingControl = L.Routing.control({
    waypoints: [], 
    routeWhileDragging: false, 
    lineOptions: {
        styles: [{color: '#007bff', opacity: 0.7, weight: 6}] // Đường màu xanh
    },
    show: true,
    addWaypoints: false,
    language: 'vi' // Đã bật tiếng Việt thành công!
}).addTo(map);

// Xóa đi các từ thừa tiếng Anh (như "on the left") mà server OSRM thỉnh thoảng hay chèn vào
routingControl.getRouter().options.language = 'vi';

L.control.locate({
    position: 'topleft',
    strings: { title: 'Xem vi tri cua toi' },
    setView: 'once',
    drawCircle: true,
    follow: true,
    stopFollowingOnDrag: true,
    circleStyle: { color: '#d32f2f', weight: 2, opacity: 0.5 }
}).addTo(map);

document.querySelector('.leaflet-control-locate')?.addEventListener('click', function() {
    userClosedSuggestions = false; 
});

var layerTatCa = L.layerGroup(); 
var layerDaiDien = L.layerGroup(); 
var ZOOM_MOC = 13.5; 
var KHOANG_CACH_KM = 6; 

var allMarkers = [];
var userLat = null;
var userLng = null;
var currentRadius = 5;
var userClosedSuggestions = false;
var geoJsonUrl = 'data/DuLieuBanDo_CapNhat.geojson';

var searchInput = document.getElementById('searchInput');
var suggestionsContainer = document.getElementById('suggestions');
var footerElement = document.getElementById('footer');

if (suggestionsContainer) {
    L.DomEvent.disableScrollPropagation(suggestionsContainer);
    L.DomEvent.disableClickPropagation(suggestionsContainer);
}

function hideSuggestions() {
    if (suggestionsContainer) {
        suggestionsContainer.classList.add('suggestions-hidden');
        suggestionsContainer.style.display = ''; 
        setTimeout(function() { map.invalidateSize(); }, 400);
    }
    if (footerElement && typeof footerHidden !== 'undefined' && !footerHidden) {
        footerElement.style.display = 'block';
    }
}

function showSuggestions() {
    if (suggestionsContainer) {
        suggestionsContainer.classList.remove('suggestions-hidden');
        suggestionsContainer.style.display = ''; 
    }
    if (footerElement) footerElement.style.display = 'none';
}

function removeVietnameseTones(str) {
    if (!str) return "";
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    return str.replace(/[^a-z0-9]/g, ""); 
}

function createMarker(feature, latlng) {
    var tenXa = feature.properties['Ten Phuong/Xa'] || 'UBND Xã';
    var phongCu = feature.properties['Xa/Phuong truoc sap nhap'] || 'Chưa có thông tin';
    var diaChi = feature.properties['Dia chi chinh xac'] || 'Chưa có địa chỉ';
    var sdt = feature.properties['So dien thoai'] || 'Chưa cập nhật';

    // Đưa nút Chỉ đường vào Popup của dữ liệu thật
    var popupContent = `
        <div style="text-align: left;">
            <h4 style="margin: 0 0 8px 0; color: #d32f2f;">${tenXa}</h4>
            <p style="margin: 0 0 5px 0; font-size: 14px;"><b>Phường/xã cũ:</b> ${phongCu}</p>
            <p style="margin: 0 0 5px 0; font-size: 14px;"><b>Địa chỉ:</b> ${diaChi}</p>
            <p style="margin: 0 0 12px 0; font-size: 14px;"><b>SĐT:</b> ${sdt}</p>
            
            <button onclick="getRouteTo(${latlng.lat}, ${latlng.lng})" 
                    style="background: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; width: 100%; font-weight: bold; font-size: 14px;">
                <i class="fas fa-location-arrow"></i> Chỉ đường đến đây
            </button>
        </div>
    `;

    var combinedHTML = `
        <div class="marker-with-label">
            <div class="gg-pin"></div>
            <span class="pin-label">${tenXa}</span>
        </div>
    `;
    
    var labelIcon = L.divIcon({
        className: 'custom-layer', 
        html: combinedHTML,
        iconSize: [0, 0], 
        iconAnchor: [13, 13], 
        popupAnchor: [0, -15] 
    });

    return L.marker(latlng, { icon: labelIcon }).bindPopup(popupContent);
}

fetch(geoJsonUrl)
    .then(response => {
        if (!response.ok) throw new Error('Không tìm thấy file GeoJSON.');
        return response.json();
    })
    .then(data => {
        layerTatCa.clearLayers();
        layerDaiDien.clearLayers();
        allMarkers = [];
        var tapDaiDien = [];

        L.geoJSON(data, {
            pointToLayer: function(feature, latlng) {
                var marker = createMarker(feature, latlng);
                var ten = feature.properties['Ten Phuong/Xa'] || 'Chưa có tên';
                var phongCu = feature.properties['Xa/Phuong truoc sap nhap'] || 'Chưa có thông tin';
                
                allMarkers.push({
                    marker: marker,
                    ten: ten,
                    phongCu: phongCu,
                    diaChi: feature.properties['Dia chi chinh xac'] || 'Chưa có địa chỉ',
                    latlng: latlng,
                    tenKhongDau: removeVietnameseTones(ten),
                    phongCuKhongDau: removeVietnameseTones(phongCu) 
                });
                
                layerTatCa.addLayer(marker); 
                return marker; 
            }
        }); 

        data.features.forEach(currentFeature => {
            var coords = currentFeature.geometry.coordinates;
            var currentLatLng = L.latLng(coords[1], coords[0]); 
            var hopLe = true;

            for (var i = 0; i < tapDaiDien.length; i++) {
                var repCoords = tapDaiDien[i].geometry.coordinates;
                var repLatLng = L.latLng(repCoords[1], repCoords[0]);
                if (currentLatLng.distanceTo(repLatLng) < (KHOANG_CACH_KM * 1000)) {
                    hopLe = false;
                    break;
                }
            }
            if (hopLe) tapDaiDien.push(currentFeature);
        });

        tapDaiDien.forEach(feature => {
            var coords = feature.geometry.coordinates;
            var latlng = L.latLng(coords[1], coords[0]);
            var repMarker = createMarker(feature, latlng);
            
            repMarker.on('click', function() {
                map.flyTo(latlng, ZOOM_MOC + 1, { animate: true, duration: 1.2 });
                map.once('moveend', function() {
                    var matched = allMarkers.find(m => m.latlng.lat === latlng.lat && m.latlng.lng === latlng.lng);
                    if (matched) matched.marker.openPopup();
                });
            });
            
            layerDaiDien.addLayer(repMarker);
        });

        if (map.getZoom() < ZOOM_MOC) map.addLayer(layerDaiDien);
        else map.addLayer(layerTatCa);

        console.log('Đã nạp xong bản đồ!');
        hideSuggestions();
    })
    .catch(error => console.error('Lỗi:', error));

map.on('zoomend', function() {
    var currentZoom = map.getZoom();
    if (currentZoom < ZOOM_MOC) {
        if (map.hasLayer(layerTatCa)) map.removeLayer(layerTatCa);
        if (!map.hasLayer(layerDaiDien)) map.addLayer(layerDaiDien);
    } else {
        if (map.hasLayer(layerDaiDien)) map.removeLayer(layerDaiDien);
        if (!map.hasLayer(layerTatCa)) map.addLayer(layerTatCa);
    }
});

function hienThiKetQuaTimKiem(keyword) {
    var keywordNoAccent = removeVietnameseTones(keyword);
    var results = allMarkers.filter(function(item) {
        return item.tenKhongDau.includes(keywordNoAccent) || item.phongCuKhongDau.includes(keywordNoAccent);
    });

    var listDiv = document.getElementById('suggestions-list');
    if (!listDiv) return;

    listDiv.innerHTML = '';
    var title = document.querySelector('#suggestions strong');
    if (title) {
        title.textContent = results.length > 0 
            ? 'Kết quả tìm kiếm "' + keyword + '" (' + results.length + '):' 
            : 'Kết quả tìm kiếm "' + keyword + '":';
    }

    if (results.length === 0) {
        listDiv.innerHTML = '<div style="color:#888; padding:12px 0; text-align:center;">Không tìm thấy phường/xã có tên "' + keyword + '"</div>';
        showSuggestions();
        return;
    }

    var fragment = document.createDocumentFragment();
    for (var j = 0; j < results.length; j++) {
        var item = results[j];
        var div = document.createElement('div');
        div.className = 'suggestion-item';

        div.onclick = (function(marker, latlng) {
            return function() {
                map.flyTo(latlng, 16, { animate: true, duration: 1.5 });
                map.once('moveend', function() { marker.openPopup(); });
            };
        })(item.marker, item.latlng);

        div.innerHTML = `
            <div class="suggestion-info">
                <strong>${item.ten}</strong>
                <span style="font-size:0.8rem;color:#555;display:block;">${item.diaChi}</span>
                <span style="font-size:0.7rem;color:#888;display:block;">Phường/xã cũ: ${item.phongCu}</span>
            </div>
            <span class="suggestion-link">Xem</span>
        `;
        fragment.appendChild(div);
    }
    listDiv.appendChild(fragment);
    showSuggestions();
}

var searchTimeout;
function performSearch() {
    var keyword = searchInput.value.trim();
    if (!keyword) {
        map.flyTo([10.7769, 106.7009], 11);
        hideSuggestions();
        if (userLat !== null && userLng !== null) timUBNDGanDay(userLat, userLng, currentRadius);
        return;
    }
    hienThiKetQuaTimKiem(keyword);
}

searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        clearTimeout(searchTimeout);
        performSearch();
    }
});

searchInput.addEventListener('input', function() {
    var keyword = this.value.trim();
    clearTimeout(searchTimeout);
    userClosedSuggestions = false;
    if (keyword === '') {
        hideSuggestions();
        if (userLat !== null && userLng !== null) timUBNDGanDay(userLat, userLng, currentRadius);
        return;
    }
    searchTimeout = setTimeout(function() { hienThiKetQuaTimKiem(keyword); }, 80);
});

var closeSuggestionsBtn = document.getElementById('closeSuggestions');
if (closeSuggestionsBtn) {
    closeSuggestionsBtn.addEventListener('click', function() {
        hideSuggestions();
        if (searchInput) searchInput.value = '';
    });
}

map.on('locationfound', function(e) {
    userLat = e.latlng.lat;
    userLng = e.latlng.lng;
    if (!userClosedSuggestions && searchInput.value.trim() === '') {
        timUBNDGanDay(userLat, userLng, currentRadius);
    }
});

map.on('locationerror', function(e) { console.warn('Không thể định vị:', e.message); });

function tinhKhoangCach(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function hienThiGoiY(danhSach, banKinh) {
    var listDiv = document.getElementById('suggestions-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';
    
    var title = document.querySelector('#suggestions strong');
    if (title) title.textContent = 'Các UBND gần bạn (trong ' + banKinh + 'km):';

    if (danhSach.length === 0) {
        listDiv.innerHTML = '<div style="color:#888; padding:8px 0;">Không có UBND nào trong bán kính ' + banKinh + 'km.</div>';
        showSuggestions();
        return;
    }

    danhSach.sort((a, b) => a.khoangCach - b.khoangCach);
    
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < danhSach.length; i++) {
        var item = danhSach[i];
        var div = document.createElement('div');
        div.className = 'suggestion-item';
        div.onclick = (function(marker, lat, lng) {
            return function() {
                map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });
                map.once('moveend', function() { marker.openPopup(); });
            };
        })(item.marker, item.lat, item.lng);

        var distStr = item.khoangCach < 1 ? (item.khoangCach * 1000).toFixed(0) + ' m' : item.khoangCach.toFixed(1) + ' km';
        div.innerHTML = `
            <div class="suggestion-info">
                <strong>${item.ten}</strong>
                <span style="font-size:0.8rem;color:#555;display:block;">${item.diaChi}</span>
            </div>
            <span class="suggestion-distance">${distStr}</span>
            <span class="suggestion-link">Xem</span>
        `;
        fragment.appendChild(div);
    }
    listDiv.appendChild(fragment);
    showSuggestions();
}

function timUBNDGanDay(lat, lng, banKinh) {
    if (!banKinh) banKinh = 5;
    var ketQua = [];
    for (var i = 0; i < allMarkers.length; i++) {
        var markerInfo = allMarkers[i];
        var lat2 = markerInfo.latlng.lat;
        var lng2 = markerInfo.latlng.lng;
        var khoangCach = tinhKhoangCach(lat, lng, lat2, lng2);
        if (khoangCach <= banKinh) {
            ketQua.push({
                ten: markerInfo.ten,
                diaChi: markerInfo.diaChi || 'Chưa có địa chỉ',
                khoangCach: khoangCach,
                marker: markerInfo.marker,
                lat: lat2,
                lng: lng2
            });
        }
    }
    hienThiGoiY(ketQua, banKinh);
}

var radiusBtns = document.querySelectorAll('.radius-btn');
radiusBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
        radiusBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentRadius = parseFloat(this.getAttribute('data-radius'));
        userClosedSuggestions = false;
        if (userLat !== null && userLng !== null) {
            timUBNDGanDay(userLat, userLng, currentRadius);
        } else {
            alert('Vui lòng định vị trước khi tìm kiếm.');
        }
    });
});

const urlBoundary = 'data/hcm_new.geojson';
fetch(urlBoundary)
    .then(res => {
        if (!res.ok) throw new Error('Không thể tải file ranh giới.');
        return res.json();
    })
    .then(data => {
        let worldCoords = [[-180, 90], [180, 90], [180, -90], [-180, -90], [-180, 90]];
        let maskCoordinates = [worldCoords];
        let allBoundaries = [];

        if (data.type === "FeatureCollection" && data.features) {
            data.features.forEach(feature => {
                let geom = feature.geometry;
                allBoundaries.push(feature);
                if (geom.type === 'MultiPolygon') {
                    geom.coordinates.forEach(poly => { maskCoordinates.push([...poly[0]].reverse()); });
                } else if (geom.type === 'Polygon') {
                    maskCoordinates.push([...geom.coordinates[0]].reverse());
                }
            });
        }

        const boundaryLayer = L.geoJSON(allBoundaries, {
            style: { color: '#ff1744', weight: 2, fillOpacity: 0 },
            interactive: false
        }).addTo(map);

        L.geoJSON({
            "type": "Feature",
            "geometry": { "type": "Polygon", "coordinates": maskCoordinates }
        }, {
            style: { color: 'transparent', fillColor: '#1a1a2e', fillOpacity: 0.7, fillRule: 'evenodd', className: 'map-mask' },
            interactive: false
        }).addTo(map);

        map.fitBounds(boundaryLayer.getBounds());
    })
    .catch(error => console.error('Lỗi khi tải file ranh giới:', error));

map.on('mousedown touchstart dragstart wheel', function() {
    if (suggestionsContainer && !suggestionsContainer.classList.contains('suggestions-hidden')) {
        hideSuggestions();
        userClosedSuggestions = true
    }
});

var footerHidden = false;
function performFooterHide() {
    if (!footerHidden && footerElement) {
        footerElement.classList.add('footer-hidden');
        footerHidden = true;
        setTimeout(function() { map.invalidateSize(); }, 400);
        map.off('dragstart zoomstart click touchstart', performFooterHide);
    }
}

function enableAutoHide() {
    map.on('dragstart zoomstart click touchstart', performFooterHide);
}
setTimeout(enableAutoHide, 1000);

let marker = L.marker([destLat, destLng]).addTo(map);

let popupContent = `
    <div style="text-align: center;">
        <h4 style="margin: 0 0 5px 0;">Đối tượng: Sinh viên</h4>
        <p style="margin: 0 0 10px 0;">Chưa khám y tế</p>
        <button onclick="getRouteTo(${destLat}, ${destLng})" 
                style="background: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; width: 100%; font-weight: bold;">
            <i class="fas fa-location-arrow"></i> Chỉ đường đến đây
        </button>
    </div>
`;

marker.bindPopup(popupContent);

function getRouteTo(lat, lng) {
    map.closePopup();

    // 1. Ưu tiên xài tọa độ đã có sẵn nếu bạn đã bấm nút Định vị trước đó
    // Cách này giúp đường vẽ ra ngay lập tức, không bị Safari chặn
    if (userLat !== null && userLng !== null) {
        routingControl.setWaypoints([
            L.latLng(userLat, userLng),
            L.latLng(lat, lng)
        ]);
        return; // Dừng hàm tại đây, không xin quyền GPS nữa
    }

    // 2. Nếu chưa có tọa độ, yêu cầu trình duyệt lấy vị trí
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(pos) {
                // Cập nhật luôn tọa độ vào biến dùng chung
                userLat = pos.coords.latitude;
                userLng = pos.coords.longitude;
                
                routingControl.setWaypoints([
                    L.latLng(userLat, userLng),
                    L.latLng(lat, lng)
                ]);
            }, 
            function(err) {
                console.warn("Lỗi GPS:", err);
                alert("Không thể lấy vị trí của bạn! Lỗi hệ thống báo: " + err.message);
            }, 
            {
                enableHighAccuracy: true,
                timeout: 15000, // Tăng lên 15 giây để Safari có đủ thời gian phản hồi
                maximumAge: 0
            }
        );
    } else {
        alert("Trình duyệt hoặc thiết bị của bạn không hỗ trợ tính năng định vị.");
    }
}