// Khoi tao ban do
var map = L.map('map').setView([10.823099, 106.629664], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Them nut dinh vi
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

// Layer chua cac diem UBND va mang luu tru
var markerLayer = L.layerGroup().addTo(map);
var allMarkers = [];

// Bien luu vi tri nguoi dung va ban kinh hien tai
var userLat = null;
var userLng = null;
var currentRadius = 5;

// Duong dan den file GeoJSON
var geoJsonUrl = 'data/ubnd_hcm_Mock.geojson';

// Ham tao marker hinh toa nha chinh phu
function createMarker(feature, latlng) {
    var ten = feature.properties['Ten Phuong/Xa'] || 'Chua co ten';
    var quan = feature.properties['Quan/Huyen'] || 'Chua co quan';
    var diaChi = feature.properties['Dia chi chinh xac'] || 'Chua co dia chi';
    var sdt = feature.properties['So dien thoai'] || 'Chua cap nhat';

    var popupContent = '<b>' + ten + '</b><br>' + quan + '<br>' + diaChi + '<br>' + sdt;

    // Tao icon toa nha chinh phu bang Font Awesome
    var govIcon = L.divIcon({
        className: 'marker-government',
        html: '<i class="fas fa-landmark"></i>', // icon toa nha co cot
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });

    var marker = L.marker(latlng, { icon: govIcon }).bindPopup(popupContent);
    return marker;
}

// Tai du lieu GeoJSON
fetch(geoJsonUrl)
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Khong tim thay file GeoJSON.');
        }
        return response.json();
    })
    .then(function(data) {
        markerLayer.clearLayers();
        allMarkers = [];

        L.geoJSON(data, {
            pointToLayer: function(feature, latlng) {
                var ten = feature.properties['Ten Phuong/Xa'] || 'Chua co ten';
                var quan = feature.properties['Quan/Huyen'] || 'Chua co quan';
                var diaChi = feature.properties['Dia chi chinh xac'] || 'Chua co dia chi';
                var sdt = feature.properties['So dien thoai'] || 'Chua cap nhat';

                var marker = createMarker(feature, latlng);
                allMarkers.push({
                    marker: marker,
                    ten: ten,
                    quan: quan,
                    diaChi: diaChi,
                    latlng: latlng
                });
                return marker;
            }
        }).addTo(markerLayer);

        console.log('Da tai ' + allMarkers.length + ' dia diem.');
        document.title = 'Ban do UBND TP.HCM (' + allMarkers.length + ' diem)';
    })
    .catch(function(error) {
        console.error('Loi:', error);
    });

// Tim kiem phuong
var searchInput = document.getElementById('searchInput');
var searchBtn = document.getElementById('searchBtn');

function performSearch() {
    var keyword = searchInput.value.trim().toLowerCase();
    if (!keyword) {
        map.flyTo([10.823099, 106.629664], 12);
        return;
    }

    for (var i = 0; i < allMarkers.length; i++) {
        var item = allMarkers[i];
        var ten = item.ten.toLowerCase();
        var quan = item.quan.toLowerCase();

        if (ten.includes(keyword) || quan.includes(keyword)) {
            map.flyTo(item.latlng, 16);
            item.marker.openPopup();
            return;
        }
    }

    alert('Khong tim thay phuong nao co ten chua "' + keyword + '".');
}

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Xu ly su kien dinh vi
map.on('locationfound', function(e) {
    console.log('Da dinh vi tai:', e.latlng);
    userLat = e.latlng.lat;
    userLng = e.latlng.lng;
    timUBNDGanDay(userLat, userLng, currentRadius);
});

map.on('locationerror', function(e) {
    console.warn('Khong the dinh vi:', e.message);
});

// Tinh khoang cach Haversine (km)
function tinhKhoangCach(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Hien thi danh sach goi y
function hienThiGoiY(danhSach, banKinh) {
    var listDiv = document.getElementById('suggestions-list');
    var container = document.getElementById('suggestions');
    if (!listDiv) return;

    listDiv.innerHTML = '';

    // Cap nhat tieu de
    var title = document.querySelector('#suggestions strong');
    if (title) {
        title.textContent = 'Cac UBND gan ban (trong ' + banKinh + 'km):';
    }

    if (danhSach.length === 0) {
        listDiv.innerHTML = '<div style="color:#888; padding:4px 0;">Khong co UBND nao trong ban kinh ' + banKinh + 'km.</div>';
        container.style.display = 'block';
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

        var info = document.createElement('div');
        info.className = 'suggestion-info';
        info.innerHTML = '<strong>' + item.ten + '</strong><br><span style="font-size:0.8rem;color:#555;">' + 
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
        link.onclick = (function(marker, lat, lng) {
            return function() {
                map.flyTo([lat, lng], 16);
                marker.openPopup();
            };
        })(item.marker, item.lat, item.lng);

        div.appendChild(info);
        div.appendChild(dist);
        div.appendChild(link);
        listDiv.appendChild(div);
    }

    container.style.display = 'block';
}

// Tim cac UBND trong ban kinh
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
                diaChi: markerInfo.diaChi || 'Chua co dia chi',
                khoangCach: khoangCach,
                marker: markerInfo.marker,
                lat: lat2,
                lng: lng2
            });
        }
    }

    hienThiGoiY(ketQua, banKinh);
}

// Su kien chon ban kinh
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
            alert('Vui long dinh vi truoc khi tim kiem.');
        }
    });
});