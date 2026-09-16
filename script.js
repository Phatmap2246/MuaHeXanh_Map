L.TileLayer.prototype.options.referrerPolicy = 'strict-origin-when-cross-origin';

var map = L.map('map', {
    maxBounds: [[10.0, 105.0], [12.0, 108.0]],
    maxBoundsViscosity: 1.0,
    minZoom: 10,
    maxZoom: 19,
    preferCanvas: true, 
    attributionControl: false,
    zoomControl: false 
}).setView([10.7769, 106.7009], 11);

L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'], 
    keepBuffer: 2,               
    updateWhenZooming: false,    
    updateWhenIdle: true,        
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

L.Routing.Localization = L.Routing.Localization || {};
L.Routing.Localization['vi'] = {
    directions: { N: 'hướng Bắc', NE: 'hướng Đông Bắc', E: 'hướng Đông', SE: 'hướng Đông Nam', S: 'hướng Nam', SW: 'hướng Tây Nam', W: 'hướng Tây', NW: 'hướng Tây Bắc' },
    instructions: { 'Head': ['Đi về {dir} trên {road}', 'Đi về {dir}'], 'Continue': ['Tiếp tục đi trên {road}', 'Tiếp tục đi thẳng'], 'SlightRight': ['Chếch sang phải vào {road}', 'Chếch sang phải'], 'Right': ['Rẽ phải vào {road}', 'Rẽ phải'], 'SharpRight': ['Rẽ ngoặt sang phải vào {road}', 'Rẽ ngoặt sang phải'], 'TurnAround': ['Quay đầu lại vào {road}', 'Quay đầu lại'], 'SharpLeft': ['Rẽ ngoặt sang trái vào {road}', 'Rẽ ngoặt sang trái'], 'Left': ['Rẽ trái vào {road}', 'Rẽ trái'], 'SlightLeft': ['Chếch sang trái vào {road}', 'Chếch sang trái'], 'WaypointReached': ['Đã đến điểm dừng', 'Đã đến điểm dừng'], 'Roundabout': ['Đi vào vòng xuyến và đi theo lối ra thứ {exitStr} vào {road}', 'Đi vào vòng xuyến'], 'DestinationReached': ['Bạn đã đến nơi', 'Bạn đã đến nơi'] },
    formatOrder: function(n) { return n; },
    ui: { startPlaceholder: 'Điểm xuất phát', endPlaceholder: 'Điểm đến' }
};

let routingControl = L.Routing.control({
    waypoints: [], 
    routeWhileDragging: false, 
    lineOptions: { 
        styles: [{color: '#007bff', opacity: 0.9, weight: 6}],
        extendToWaypoints: true,
        missingRouteTolerance: 0 
    },
    showAlternatives: true,
    altLineOptions: {
        styles: [{color: '#70757a', opacity: 0.5, weight: 6}]
    },
    createMarker: function(i, waypoint, n) {
        return null; 
    },
    show: true,
    addWaypoints: false,
    language: 'vi' 
}).addTo(map);

routingControl.getRouter().options.language = 'vi';

// =================================================================
// LOGIC BẢNG CHỈ ĐƯỜNG: NÚT ĐỊNH VỊ NHẢY LÊN & VUỐT 3 CẤP ĐỘ
// =================================================================
routingControl.on('routesfound', function(e) {
    let container = document.querySelector('.leaflet-routing-container');
    if (container) {
        container.classList.remove('expanded');
        container.classList.add('show-route', 'collapsed'); 
    }
    
    let controls = document.querySelector('.leaflet-bottom.leaflet-right');
    if (controls) {
        controls.classList.remove('hide-controls');
        controls.classList.add('lift-up');
    }
});

routingControl.on('routingerror', function(e) {
    let container = document.querySelector('.leaflet-routing-container');
    if (container) container.classList.remove('show-route', 'collapsed', 'expanded');
    
    let controls = document.querySelector('.leaflet-bottom.leaflet-right');
    if (controls) controls.classList.remove('hide-controls', 'lift-up');
});

setTimeout(() => {
    let routingContainer = document.querySelector('.leaflet-routing-container');
    if (routingContainer) {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        routingContainer.addEventListener('click', function(e) {
            if (routingContainer.classList.contains('collapsed')) {
                routingContainer.classList.remove('collapsed');
                routingContainer.classList.add('expanded');
                let controls = document.querySelector('.leaflet-bottom.leaflet-right');
                if (controls) controls.classList.add('hide-controls');
            }
        });

        routingContainer.addEventListener('touchstart', function(e) {
            if (routingContainer.scrollTop > 0) return; 
            startY = e.touches[0].clientY;
            isDragging = true;
            routingContainer.style.transition = 'none'; 
        }, { passive: true });

        routingContainer.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            currentY = e.touches[0].clientY;
            let deltaY = currentY - startY;

            if (routingContainer.classList.contains('collapsed') && deltaY > 0) {
                routingContainer.style.transform = `translateY(${deltaY}px)`; 
            }
        }, { passive: true });

        routingContainer.addEventListener('touchend', function(e) {
            if (!isDragging) return;
            isDragging = false;
            routingContainer.style.transition = ''; 
            
            let deltaY = currentY - startY;
            let controls = document.querySelector('.leaflet-bottom.leaflet-right');
            
            if (routingContainer.classList.contains('collapsed')) {
                if (deltaY < -30) {
                    routingContainer.classList.remove('collapsed');
                    routingContainer.classList.add('expanded');
                    if (controls) controls.classList.add('hide-controls');
                    
                } else if (deltaY > 40) {
                    // Xóa class để CSS tự động kéo rớt bảng xuống
                    routingContainer.classList.remove('show-route', 'collapsed', 'expanded');
                    if (controls) controls.classList.remove('hide-controls', 'lift-up');
                    
                    // CHỜ 400ms MỚI XÓA DATA, ĐỂ CSS KỊP CHẠY ANIMATION TRƯỢT XUỐNG
                    setTimeout(() => {
                        routingControl.setWaypoints([]); 
                    }, 400); 
                }
            } else if (routingContainer.classList.contains('expanded')) {
                if (deltaY > 40 && routingContainer.scrollTop <= 0) {
                    routingContainer.classList.remove('expanded');
                    routingContainer.classList.add('collapsed');
                    if (controls) {
                        controls.classList.remove('hide-controls');
                        controls.classList.add('lift-up');
                    }
                }
            }
            routingContainer.style.transform = ''; 
        });
    }
}, 1000); 

L.control.locate({
    position: 'bottomright',
    strings: { title: 'Vị trí của tôi' },
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

// =================================================================
// THẺ THÔNG TIN BOTTOM SHEET (CÓ VUỐT ĐÓNG & 2 NÚT BẤM)
// =================================================================
function openInfoSheet(ten, phongCu, diaChi, sdt, lat, lng) {
    let routingContainer = document.querySelector('.leaflet-routing-container');
    if (routingContainer && routingContainer.classList.contains('show-route')) {
        routingContainer.classList.remove('show-route', 'expanded', 'collapsed'); 
        setTimeout(() => {
            if (typeof routingControl !== 'undefined') routingControl.setWaypoints([]); 
        }, 400); // Đợi bảng chỉ đường tụt xuống xong mới xóa data để tránh giật
    } else {
        if (typeof routingControl !== 'undefined') routingControl.setWaypoints([]); 
    }

    let controls = document.querySelector('.leaflet-bottom.leaflet-right');
    if (controls) {
        controls.classList.remove('hide-controls');
        controls.classList.add('lift-up');
    }

    let sheet = document.getElementById('info-bottom-sheet');
    
    if (!sheet) {
        sheet = document.createElement('div');
        sheet.id = 'info-bottom-sheet';
        sheet.className = 'bottom-sheet';
        sheet.innerHTML = `
            <div class="drag-handle"></div>
            <button id="close-sheet-btn"><i class="fas fa-times"></i></button>
            <div id="sheet-content"></div>
        `;
        document.body.appendChild(sheet);

        document.getElementById('close-sheet-btn').addEventListener('click', function() {
            sheet.classList.remove('show');
            if (controls) controls.classList.remove('lift-up'); 
        });

        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        sheet.addEventListener('touchstart', function(e) {
            startY = e.touches[0].clientY;
            isDragging = true;
            sheet.style.transition = 'none'; 
        }, { passive: true });

        sheet.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            currentY = e.touches[0].clientY;
            let deltaY = currentY - startY;
            if (deltaY > 0) {
                sheet.style.transform = `translateY(${deltaY}px)`; 
            }
        }, { passive: true });

        sheet.addEventListener('touchend', function(e) {
            if (!isDragging) return;
            isDragging = false;
            sheet.style.transition = ''; 
            let deltaY = currentY - startY;

            if (deltaY > 100) { 
                sheet.classList.remove('show');
                if (controls) controls.classList.remove('lift-up'); 
                setTimeout(() => { sheet.style.transform = ''; }, 300); 
            } else {
                sheet.style.transform = '';
            }
        });
    }

    let contentHTML = `
        <h4>${ten}</h4>
        <p><b>Phường/xã cũ:</b> ${phongCu}</p>
        <p><b>Địa chỉ:</b> ${diaChi}</p>
        <p><b>SĐT:</b> ${sdt}</p>
        
        <div class="action-buttons">
            <button class="route-btn" onclick="getRouteTo(${lat}, ${lng})">
                <i class="fas fa-directions"></i> Chỉ đường
            </button>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" class="gg-map-btn">
                <i class="fas fa-map-marked-alt"></i> GG Maps
            </a>
        </div>
    `;
    
    document.getElementById('sheet-content').innerHTML = contentHTML;
    sheet.style.transform = ''; 
    sheet.classList.add('show'); 
    hideSuggestions(); 
}

function createMarker(feature, latlng) {
    var tenXa = feature.properties['Ten Phuong/Xa'] || 'UBND Xã';
    var phongCu = feature.properties['Xa/Phuong truoc sap nhap'] || 'Chưa có thông tin';
    var diaChi = feature.properties['Dia chi chinh xac'] || 'Chưa có địa chỉ';
    var sdt = feature.properties['So dien thoai'] || 'Chưa cập nhật';

    var combinedHTML = `
        <div class="marker-with-label">
            <div class="gg-pin"></div>
            <span class="pin-label">${tenXa}</span>
        </div>
    `;
    
    var labelIcon = L.divIcon({ className: 'custom-layer', html: combinedHTML, iconSize: [0, 0], iconAnchor: [13, 13], popupAnchor: [0, -15] });
    let marker = L.marker(latlng, { icon: labelIcon });
    
    marker.on('click', function() {
        map.flyTo(latlng, 15, { animate: true, duration: 1 });
        openInfoSheet(tenXa, phongCu, diaChi, sdt, latlng.lat, latlng.lng);
    });

    return marker;
}

// =================================================================
// LAZY LOAD DỮ LIỆU MARKER & RANH GIỚI BẢN ĐỒ
// =================================================================
setTimeout(function() {
    fetch(geoJsonUrl)
        .then(response => { if (!response.ok) throw new Error('Lỗi GeoJSON.'); return response.json(); })
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
                        sdt: feature.properties['So dien thoai'] || 'Chưa cập nhật',
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
                    if (currentLatLng.distanceTo(repLatLng) < (KHOANG_CACH_KM * 1000)) { hopLe = false; break; }
                }
                if (hopLe) tapDaiDien.push(currentFeature);
            });

            tapDaiDien.forEach(feature => {
                var coords = feature.geometry.coordinates;
                var latlng = L.latLng(coords[1], coords[0]);
                var repMarker = createMarker(feature, latlng);
                layerDaiDien.addLayer(repMarker);
            });

            if (map.getZoom() < ZOOM_MOC) map.addLayer(layerDaiDien);
            else map.addLayer(layerTatCa);
            hideSuggestions();
        })
        .catch(error => console.error('Lỗi:', error));
}, 400);

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
    if (title) title.textContent = results.length > 0 ? 'Kết quả tìm kiếm "' + keyword + '" (' + results.length + '):' : 'Kết quả tìm kiếm "' + keyword + '":';

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

        div.onclick = (function(info) {
            return function() {
                map.flyTo(info.latlng, 16, { animate: true, duration: 1.5 });
                map.once('moveend', function() { 
                    openInfoSheet(info.ten, info.phongCu, info.diaChi, info.sdt, info.latlng.lat, info.latlng.lng);
                });
            };
        })(item);

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

searchInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') { clearTimeout(searchTimeout); performSearch(); }});
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
if (closeSuggestionsBtn) closeSuggestionsBtn.addEventListener('click', function() { hideSuggestions(); if (searchInput) searchInput.value = ''; });

map.on('locationfound', function(e) {
    userLat = e.latlng.lat;
    userLng = e.latlng.lng;
    if (!userClosedSuggestions && searchInput.value.trim() === '') timUBNDGanDay(userLat, userLng, currentRadius);
});

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
        div.onclick = (function(info) {
            return function() {
                map.flyTo([info.lat, info.lng], 16, { animate: true, duration: 1.5 });
                map.once('moveend', function() { 
                    openInfoSheet(info.ten, info.phongCu, info.diaChi, info.sdt, info.lat, info.lng);
                });
            };
        })(item);

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
                phongCu: markerInfo.phongCu,
                sdt: markerInfo.sdt,
                khoangCach: khoangCach,
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
        if (userLat !== null && userLng !== null) timUBNDGanDay(userLat, userLng, currentRadius);
        else alert('Vui lòng định vị trước khi tìm kiếm.');
    });
});

setTimeout(function() {
    const urlBoundary = 'data/hcm_new.json';
    fetch(urlBoundary)
        .then(res => { if (!res.ok) throw new Error('Lỗi ranh giới'); return res.json(); })
        .then(data => {
            let maskCoordinates = [[[-180, 90], [180, 90], [180, -90], [-180, -90], [-180, 90]]];
            let allBoundaries = [];
            if (data.type === "FeatureCollection" && data.features) {
                data.features.forEach(feature => {
                    let geom = feature.geometry;
                    allBoundaries.push(feature);
                    if (geom.type === 'MultiPolygon') geom.coordinates.forEach(poly => { maskCoordinates.push([...poly[0]].reverse()); });
                    else if (geom.type === 'Polygon') maskCoordinates.push([...geom.coordinates[0]].reverse());
                });
            }
            const boundaryLayer = L.geoJSON(allBoundaries, { style: { color: '#ff1744', weight: 2, fillOpacity: 0 }, interactive: false }).addTo(map);
            L.geoJSON({ "type": "Feature", "geometry": { "type": "Polygon", "coordinates": maskCoordinates } }, { style: { color: 'transparent', fillColor: '#1a1a2e', fillOpacity: 0.7, fillRule: 'evenodd', className: 'map-mask' }, interactive: false }).addTo(map);
            map.fitBounds(boundaryLayer.getBounds());
        })
        .catch(error => console.error('Lỗi ranh giới:', error));
}, 800);

map.on('click', function() {
    let sheet = document.getElementById('info-bottom-sheet');
    if (sheet && sheet.classList.contains('show')) {
        sheet.classList.remove('show');
        let controls = document.querySelector('.leaflet-bottom.leaflet-right');
        if (controls) controls.classList.remove('lift-up');
    }
});

map.on('mousedown touchstart dragstart wheel', function() {
    if (suggestionsContainer && !suggestionsContainer.classList.contains('suggestions-hidden')) {
        hideSuggestions();
        userClosedSuggestions = true;
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

function getRouteTo(lat, lng) {
    let sheet = document.getElementById('info-bottom-sheet');
    if (sheet) sheet.classList.remove('show');

    if (userLat !== null && userLng !== null) {
        routingControl.setWaypoints([ L.latLng(userLat, userLng), L.latLng(lat, lng) ]);
        return; 
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(pos) {
                userLat = pos.coords.latitude;
                userLng = pos.coords.longitude;
                routingControl.setWaypoints([ L.latLng(userLat, userLng), L.latLng(lat, lng) ]);
            }, 
            function(err) {
                console.warn("Lỗi GPS:", err);
                alert("Không thể lấy vị trí của bạn! Lỗi hệ thống báo: " + err.message);
            }, 
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    } else {
        alert("Trình duyệt không hỗ trợ tính năng định vị.");
    }
}