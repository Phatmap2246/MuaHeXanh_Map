// Khoi tao ban do
var map = L.map('map', {
    maxBounds: [
        [10.0, 105.0],
        [12.0, 108.0]
    ],
    maxBoundsViscosity: 1.0,
    minZoom: 10,
    maxZoom: 19,
    attributionControl: false
}).setView([10.7769, 106.7009], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.control.locate({
    position: 'topleft',
    strings: {
        title: 'Xem vi tri cua toi'
    },
    setView: 'once',
    drawCircle: true,
    follow: true,
    stopFollowingOnDrag: true,
    circleStyle: {
        color: '#d32f2f',
        weight: 2,
        opacity: 0.5
    }
}).addTo(map);

var markerLayer = L.layerGroup().addTo(map);
var allMarkers = [];
var userLat = null;
var userLng = null;
var currentRadius = 5;

var geoJsonUrl = 'data/DuLieuBanDo_CapNhat.geojson';

function removeVietnameseTones(str) {
    str = str.toLowerCase();
    var map = {
        'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        'đ': 'd'
    };
    return str.replace(/[^a-z0-9\s]/g, function(ch) {
        return map[ch] || ch;
    });
}

function createMarker(feature, latlng) {
    var ten = feature.properties['Ten Phuong/Xa'] || 'Chưa có tên';
    var phongCu = feature.properties['Xa/Phuong truoc sap nhap'] || 'Chưa có thông tin';
    var diaChi = feature.properties['Dia chi chinh xac'] || 'Chưa có địa chỉ';
    var sdt = feature.properties['So dien thoai'] || 'Chưa cập nhật';

    var popupContent = '<div style="font-size:0.95rem; line-height:1.6;">' +
                   '<b style="font-size:1.1rem; color:#1b5e20;">' + ten + '</b><br>' +
                   '<b>Phường/xã cũ:</b> ' + phongCu + '<br>' +
                   '<b>Địa chỉ mới:</b> ' + diaChi + '<br>' +
                   '<b>Số điện thoại:</b> ' + sdt +
                   '</div>';

    var pinHTML = `
        <div class="marker-pin">
            <div class="pin-head">
                <i class="fas fa-landmark"></i>
            </div>
            <div class="pin-tail"></div>
        </div>
    `;

    var pinIcon = L.divIcon({
        className: '',
        html: pinHTML,
        iconSize: [40, 56],
        iconAnchor: [20, 56],   
        popupAnchor: [0, -56]    
    });

    var marker = L.marker(latlng, { icon: pinIcon }).bindPopup(popupContent);
    return marker;
}

fetch(geoJsonUrl)
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Không tìm thấy file GeoJSON.');
        }
        return response.json();
    })
    .then(function(data) {
        markerLayer.clearLayers();
        allMarkers = [];

        L.geoJSON(data, {
            pointToLayer: function(feature, latlng) {
                var marker = createMarker(feature, latlng);
                allMarkers.push({
                    marker: marker,
                    ten: feature.properties['Ten Phuong/Xa'] || 'Chưa có tên',
                    phongCu: feature.properties['Xa/Phuong truoc sap nhap'] || 'Chưa có thông tin',
                    diaChi: feature.properties['Dia chi chinh xac'] || 'Chưa có địa chỉ',
                    latlng: latlng
                });
                return marker;
            }
        }).addTo(markerLayer);

        console.log('Đã tải ' + allMarkers.length + ' địa điểm.');
        document.title = 'Bản đồ UBND TP.HCM (' + allMarkers.length + ' điểm)';
    })
    .catch(function(error) {
        console.error('Lỗi:', error);
    });

var searchInput = document.getElementById('searchInput');
var suggestionsContainer = document.getElementById('suggestions');
var footerElement = document.getElementById('footer');

function hienThiKetQuaTimKiem(keyword) {
    var keywordNoAccent = removeVietnameseTones(keyword);
    var results = [];

    for (var i = 0; i < allMarkers.length; i++) {
        var item = allMarkers[i];
        var tenNoAccent = removeVietnameseTones(item.ten);
        var phongCuNoAccent = removeVietnameseTones(item.phongCu);

        if (tenNoAccent.includes(keywordNoAccent) || phongCuNoAccent.includes(keywordNoAccent)) {
            results.push({
                ten: item.ten,
                phongCu: item.phongCu,
                diaChi: item.diaChi,
                latlng: item.latlng,
                marker: item.marker,
                lat: item.latlng.lat,
                lng: item.latlng.lng
            });
        }
    }

    var listDiv = document.getElementById('suggestions-list');
    if (!listDiv) return;

    listDiv.innerHTML = '';

    var title = document.querySelector('#suggestions strong');
    if (title) {
        if (results.length > 0) {
            title.textContent = 'Kết quả tìm kiếm "' + keyword + '" (' + results.length + '):';
        } else {
            title.textContent = 'Kết quả tìm kiếm "' + keyword + '":';
        }
    }

    if (results.length === 0) {
        listDiv.innerHTML = '<div style="color:#888; padding:12px 0; text-align:center;">Không tìm thấy phường/xã có tên "' + keyword + '"</div>';
        suggestionsContainer.style.display = 'block';
        if (footerElement) footerElement.style.display = 'none';
        return;
    }

    var soLuongHien = Math.min(results.length, 10);

    for (var j = 0; j < soLuongHien; j++) {
        var item = results[j];
        var div = document.createElement('div');
        div.className = 'suggestion-item';

        div.onclick = (function(marker, latlng) {
            return function() {
                map.flyTo([latlng.lat, latlng.lng], 16);
                marker.openPopup();
            };
        })(item.marker, item.latlng);

        var info = document.createElement('div');
        info.className = 'suggestion-info';
        info.innerHTML = '<strong>' + item.ten + '</strong><span style="font-size:0.8rem;color:#555;display:block;">' +
            item.diaChi + '</span>';

        var phongCuSpan = document.createElement('span');
        phongCuSpan.style.cssText = 'font-size:0.7rem;color:#888;display:block;';
        phongCuSpan.textContent = 'Phường/xã cũ: ' + item.phongCu;
        info.appendChild(phongCuSpan);

        var link = document.createElement('span');
        link.className = 'suggestion-link';
        link.textContent = 'Xem';

        div.appendChild(info);
        div.appendChild(link);
        listDiv.appendChild(div);
    }

    suggestionsContainer.style.display = 'block';
    if (footerElement) footerElement.style.display = 'none';
}

function performSearch() {
    var keyword = searchInput.value.trim();
    if (!keyword) {
        map.flyTo([10.7769, 106.7009], 11);
        suggestionsContainer.style.display = 'none';
        if (footerElement) footerElement.style.display = 'block';
        if (userLat !== null && userLng !== null) {
            timUBNDGanDay(userLat, userLng, currentRadius);
        }
        return;
    }

    hienThiKetQuaTimKiem(keyword);
}

searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

searchInput.addEventListener('input', function() {
    var keyword = this.value.trim();
    if (keyword === '') {
        suggestionsContainer.style.display = 'none';
        if (footerElement) footerElement.style.display = 'block';
        if (userLat !== null && userLng !== null) {
            timUBNDGanDay(userLat, userLng, currentRadius);
        }
        return;
    }
    hienThiKetQuaTimKiem(keyword);
});

// Dong suggestions khi nhan nut X
var closeSuggestionsBtn = document.getElementById('closeSuggestions');
if (closeSuggestionsBtn) {
    closeSuggestionsBtn.addEventListener('click', function() {
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
        if (footerElement) {
            footerElement.style.display = 'block';
        }
        if (searchInput) {
            searchInput.value = '';
        }
    });
}

map.on('locationfound', function(e) {
    console.log('Đã định vị tại:', e.latlng);
    userLat = e.latlng.lat;
    userLng = e.latlng.lng;
    if (searchInput.value.trim() === '') {
        timUBNDGanDay(userLat, userLng, currentRadius);
    }
});

map.on('locationerror', function(e) {
    console.warn('Không thể định vị:', e.message);
});

function tinhKhoangCach(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function hienThiGoiY(danhSach, banKinh) {
    var listDiv = document.getElementById('suggestions-list');
    var container = document.getElementById('suggestions');
    if (!listDiv) return;

    listDiv.innerHTML = '';

    var title = document.querySelector('#suggestions strong');
    if (title) {
        title.textContent = 'Các UBND gần bạn (trong ' + banKinh + 'km):';
    }

    if (danhSach.length === 0) {
        listDiv.innerHTML = '<div style="color:#888; padding:8px 0;">Không có UBND nào trong bán kính ' + banKinh + 'km.</div>';
        container.style.display = 'block';
        if (footerElement) footerElement.style.display = 'none';
        return;
    }

    danhSach.sort(function(a, b) {
        return a.khoangCach - b.khoangCach;
    });

    var soLuongHien = Math.min(danhSach.length, 10);

    for (var i = 0; i < soLuongHien; i++) {
        var item = danhSach[i];
        var div = document.createElement('div');
        div.className = 'suggestion-item';

        div.onclick = (function(marker, lat, lng) {
            return function() {
                map.flyTo([lat, lng], 16);
                marker.openPopup();
            };
        })(item.marker, item.lat, item.lng);

        var info = document.createElement('div');
        info.className = 'suggestion-info';
        info.innerHTML = '<strong>' + item.ten + '</strong><span style="font-size:0.8rem;color:#555;display:block;">' +
            item.diaChi + '</span>';

        var dist = document.createElement('span');
        dist.className = 'suggestion-distance';
        var km = item.khoangCach;
        if (km < 1) {
            dist.textContent = (km * 1000).toFixed(0) + ' m';
        } else {
            dist.textContent = km.toFixed(1) + ' km';
        }

        var link = document.createElement('span');
        link.className = 'suggestion-link';
        link.textContent = 'Xem';

        div.appendChild(info);
        div.appendChild(dist);
        div.appendChild(link);
        listDiv.appendChild(div);
    }

    container.style.display = 'block';
    if (footerElement) footerElement.style.display = 'none';
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
        radiusBtns.forEach(function(b) {
            b.classList.remove('active');
        });
        this.classList.add('active');

        var radius = parseFloat(this.getAttribute('data-radius'));
        currentRadius = radius;

        if (userLat !== null && userLng !== null) {
            timUBNDGanDay(userLat, userLng, radius);
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
        console.log('Đã tải dữ liệu ranh giới thành công!');

        let worldCoords = [
            [-180, 90],
            [180, 90],
            [180, -90],
            [-180, -90],
            [-180, 90]
        ];
        let maskCoordinates = [worldCoords];
        let allBoundaries = [];

        if (data.type === "FeatureCollection" && data.features) {
            data.features.forEach(feature => {
                let geom = feature.geometry;
                allBoundaries.push(feature);

                if (geom.type === 'MultiPolygon') {
                    geom.coordinates.forEach(poly => {
                        let reversedHole = [...poly[0]].reverse();
                        maskCoordinates.push(reversedHole);
                    });
                } else if (geom.type === 'Polygon') {
                    let reversedHole = [...geom.coordinates[0]].reverse();
                    maskCoordinates.push(reversedHole);
                }
            });
        } else {
            console.error("Cấu trúc file GeoJSON không đúng chuẩn FeatureCollection.");
            return;
        }

        const boundaryLayer = L.geoJSON(allBoundaries, {
            style: {
                color: '#ff1744',
                weight: 2,
                fillOpacity: 0
            },
            interactive: false
        }).addTo(map);

        const maskGeoJSON = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": maskCoordinates
            }
        };

        L.geoJSON(maskGeoJSON, {
            style: {
                color: 'transparent',
                fillColor: '#1a1a2e',
                fillOpacity: 0.7,
                fillRule: 'evenodd',
                className: 'map-mask'
            },
            interactive: false
        }).addTo(map);

        map.fitBounds(boundaryLayer.getBounds());

        console.log('Đã vẽ ranh giới và tạo vùng mờ bên ngoài thành công!');
    })
    .catch(error => {
        console.error('Lỗi khi tải file ranh giới:', error);
    });

map.on('dragstart', function() {
    if (suggestionsContainer && suggestionsContainer.style.display === 'block') {
        suggestionsContainer.style.display = 'none';
        if (footerElement) footerElement.style.display = 'block';
    }
});