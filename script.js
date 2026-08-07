// Khởi tạo bản đồ
var map = L.map('map', {
    maxBounds: [
        [10.0, 105.0],
        [12.0, 108.0]
    ],
    maxBoundsViscosity: 1.0,
    minZoom: 10,
    maxZoom: 19,
    preferCanvas: true, // Tối ưu render: Dùng Canvas thay vì SVG/DOM Elements để vẽ đường thẳng/mặt nạ
    attributionControl: false
}).setView([10.7769, 106.7009], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    keepBuffer: 6,
    updateWhenIdle: false,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

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
    userClosedSuggestions = false; // Cho phép hiện lại khi chủ động bấm định vị
});
// 1. Khởi tạo MarkerClusterGroup thay vì LayerGroup thông thường
var markersCluster = L.markerClusterGroup({
    chunkedLoading: true, 
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    disableClusteringAtZoom: 15,
    maxClusterRadius: 40
});

map.addLayer(markersCluster); // Thêm cluster vào map
var allMarkers = [];
var userLat = null;
var userLng = null;
var currentRadius = 5;
var userClosedSuggestions = false;
var geoJsonUrl = 'data/DuLieuBanDo_CapNhat.geojson';

// DOM elements
var searchInput = document.getElementById('searchInput');
var suggestionsContainer = document.getElementById('suggestions');
var footerElement = document.getElementById('footer');
if (suggestionsContainer) {
    L.DomEvent.disableScrollPropagation(suggestionsContainer);
    L.DomEvent.disableClickPropagation(suggestionsContainer);
}

// --- HÀM ẨN/HIỆN MƯỢT MÀ BẰNG CSS CLASS ---
function hideSuggestions() {
    if (suggestionsContainer) {
        
        suggestionsContainer.classList.add('suggestions-hidden');
        
        
        suggestionsContainer.style.display = ''; 
        
        setTimeout(function() {
            map.invalidateSize();
        }, 400);
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
    if (footerElement) {
        footerElement.style.display = 'none';
    }
}

// Hàm chuyển đổi tiếng Việt 
function removeVietnameseTones(str) {
    if (!str) return "";
    str = str.toLowerCase();
    
    // Xóa dấu tiếng Việt
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");

    return str.replace(/[^a-z0-9]/g, ""); 
}


var pinHTML = '<div class="gg-pin"></div>'; 
var pinIcon = L.divIcon({
    className: 'custom-layer', 
    html: pinHTML,
    iconSize: [30, 30],
    iconAnchor: [15, 36],
    popupAnchor: [0, -36]
});



function createMarker(feature, latlng) {
    var tenXa = feature.properties['Ten Phuong/Xa'] || 'UBND Xã';
    var popupContent = '<b>' + tenXa + '</b><br>' + 
                       '<b>Phường/xã cũ</b>: ' + (feature.properties['Xa/Phuong truoc sap nhap'] || 'Chưa có thông tin') + '<br>' +
                       '<b>Địa chỉ mới: </b>' + (feature.properties['Dia chi chinh xac'] || 'Chưa có địa chỉ') + '<br>' +
                       '<b>Số điện thoại: </b>' + (feature.properties['So dien thoai'] || 'Chưa cập nhật');
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

    var marker = L.marker(latlng, { icon: labelIcon }).bindPopup(popupContent);
    return marker;
}

// Tải dữ liệu UBND
fetch(geoJsonUrl)
    .then(response => {
        if (!response.ok) throw new Error('Không tìm thấy file GeoJSON.');
        return response.json();
    })
    .then(data => {
        markersCluster.clearLayers();
        allMarkers = [];

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
                return marker; 
            },
            onEachFeature: function(feature, layer) {
                
                markersCluster.addLayer(layer);
            }
        }); 

        console.log('Đã tải ' + allMarkers.length + ' địa điểm.');
        document.title = 'Bản đồ UBND TP.HCM (' + allMarkers.length + ' điểm)';
        hideSuggestions();
    })
    .catch(error => console.error('Lỗi:', error));


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
    var soLuongHien = results.length;

    for (var j = 0; j < soLuongHien; j++) {
        var item = results[j];
        var div = document.createElement('div');
        div.className = 'suggestion-item';

        div.onclick = (function(marker, latlng) {
            return function() {
                
                map.setView([latlng.lat, latlng.lng], 16, { 
                    animate: true, 
                    duration: 1.5 
                });
                map.once('moveend', function() { 
                    marker.openPopup(); 
                });
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
        if (userLat !== null && userLng !== null) {
            timUBNDGanDay(userLat, userLng, currentRadius);
        }
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
        if (userLat !== null && userLng !== null) {
            timUBNDGanDay(userLat, userLng, currentRadius);
        }
        return;
    }
    
    // Đợi 80ms sau khi ngừng gõ mới chạy tìm kiếm
    searchTimeout = setTimeout(function() {
        hienThiKetQuaTimKiem(keyword);
    }, 80);
});

var closeSuggestionsBtn = document.getElementById('closeSuggestions');
if (closeSuggestionsBtn) {
    closeSuggestionsBtn.addEventListener('click', function() {
        hideSuggestions();
        if (searchInput) searchInput.value = '';
    });
}

// Xử lý định vị và khoảng cách
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
    var soLuongHien = danhSach.length;

    for (var i = 0; i < soLuongHien; i++) {
        var item = danhSach[i];
        var div = document.createElement('div');
        div.className = 'suggestion-item';
        div.onclick = (function(marker, lat, lng) {
            return function() {
               
                map.setView([lat, lng], 16, { 
                    animate: true, 
                    duration: 1.5 
                });
                map.once('moveend', function() { 
                    marker.openPopup(); 
                });
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

// Vẽ ranh giới mượt mà hơn với preferCanvas đã bật ở phần khởi tạo L.map
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
    // Nếu bảng đang mở (không có class tàng hình) thì mới tắt nó đi
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
        setTimeout(function() {
            map.invalidateSize();
        }, 400);
        map.off('dragstart zoomstart click touchstart', performFooterHide);
        console.log("Footer đã được ẩn vĩnh viễn.");
    }
}


function enableAutoHide() {
    map.on('dragstart zoomstart click touchstart', performFooterHide);
}
setTimeout(enableAutoHide, 1000);


var zoomHienMarker = 14; 

function kiemTraHienThiMarker() {
    var mapDOM = map.getContainer(); 
    if (map.getZoom() < zoomHienMarker) {
        mapDOM.classList.add('hide-our-markers');
    } else {
        mapDOM.classList.remove('hide-our-markers');
    }
}


kiemTraHienThiMarker();
map.on('zoomend', kiemTraHienThiMarker);