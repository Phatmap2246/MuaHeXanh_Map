// Khoi tao ban do voi gioi han TP.HCM
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

// Map nen OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Nut dinh vi
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

// Layer va bien toan cuc
var markerLayer = L.layerGroup().addTo(map);
var allMarkers = [];
var userLat = null;
var userLng = null;
var currentRadius = 5;

// Duong dan den file GeoJSON UBND
var geoJsonUrl = 'data/ubnd_hcm_Mock.geojson';

// Tao marker hinh toa nha chinh phu (su dung Font Awesome)
function createMarker(feature, latlng) {
    var ten = feature.properties['Ten Phuong/Xa'] || 'Chua co ten';
    var quan = feature.properties['Quan/Huyen'] || 'Chua co quan';
    var diaChi = feature.properties['Dia chi chinh xac'] || 'Chua co dia chi';
    var sdt = feature.properties['So dien thoai'] || 'Chua cap nhat';

    var popupContent = '<b>' + ten + '</b><br>' + quan + '<br>' + diaChi + '<br>' + sdt;

    var govIcon = L.divIcon({
        className: 'marker-government',
        html: '<i class="fas fa-landmark"></i>',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });

    var marker = L.marker(latlng, { icon: govIcon }).bindPopup(popupContent);
    return marker;
}

// Tai du lieu UBND
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
                var marker = createMarker(feature, latlng);
                allMarkers.push({
                    marker: marker,
                    ten: feature.properties['Ten Phuong/Xa'] || 'Chua co ten',
                    quan: feature.properties['Quan/Huyen'] || 'Chua co quan',
                    diaChi: feature.properties['Dia chi chinh xac'] || 'Chua co dia chi',
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
        map.flyTo([10.7769, 106.7009], 11);
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

// Dong suggestions khi nhan nut X
var closeSuggestionsBtn = document.getElementById('closeSuggestions');
if (closeSuggestionsBtn) {
    closeSuggestionsBtn.addEventListener('click', function() {
        var suggestionsContainer = document.getElementById('suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    });
}

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
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Hien thi danh sach goi y (click toan bo dong)
function hienThiGoiY(danhSach, banKinh) {
    var listDiv = document.getElementById('suggestions-list');
    var container = document.getElementById('suggestions');
    if (!listDiv) return;

    listDiv.innerHTML = '';

    var title = document.querySelector('#suggestions strong');
    if (title) {
        title.textContent = 'Cac UBND gan ban (trong ' + banKinh + 'km):';
    }

    if (danhSach.length === 0) {
        listDiv.innerHTML = '<div style="color:#888; padding:8px 0;">Khong co UBND nao trong ban kinh ' + banKinh + 'km.</div>';
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

        // Click toan bo dong
        div.onclick = (function(marker, lat, lng) {
            return function() {
                map.flyTo([lat, lng], 16);
                marker.openPopup();
            };
        })(item.marker, item.lat, item.lng);

        // Thong tin
        var info = document.createElement('div');
        info.className = 'suggestion-info';
        info.innerHTML = '<strong>' + item.ten + '</strong><span style="font-size:0.8rem;color:#555;display:block;">' +
            item.diaChi + '</span>';

        // Khoang cach
        var dist = document.createElement('span');
        dist.className = 'suggestion-distance';
        var km = item.khoangCach;
        if (km < 1) {
            dist.textContent = (km * 1000).toFixed(0) + ' m';
        } else {
            dist.textContent = km.toFixed(1) + ' km';
        }

        // Chu "Xem" chi hien thi, khong click duoc
        var link = document.createElement('span');
        link.className = 'suggestion-link';
        link.textContent = 'Xem';

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

// Ve ranh gioi TP.HCM (mo rong bao gom ca Vung Tau, Binh Duong)
const urlBoundary = 'data/hcm_new.geojson';


fetch(urlBoundary)
    .then(res => {
        if (!res.ok) throw new Error('Khong the tai file ranh gioi.');
        return res.json();
    })
    .then(data => {
        console.log('Da tai du lieu ranh gioi thanh cong!');

        // Tao toa do mat na bao phu toan bo ban do
        let worldCoords = [
            [-180, 90],
            [180, 90],
            [180, -90],
            [-180, -90],
            [-180, 90]
        ];
        let maskCoordinates = [worldCoords];
        let allBoundaries = [];

        // Kiem tra cau truc file
        if (data.type === "FeatureCollection" && data.features) {
            data.features.forEach(feature => {
                let geom = feature.geometry;
                allBoundaries.push(feature);

                // Dao chieu inner ring de tao lo cho mat na
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
            console.error("Cau truc file GeoJSON khong dung chuan FeatureCollection.");
            return;
        }

        // Ve vien do cho toan bo khu vuc ranh gioi
        const boundaryLayer = L.geoJSON(allBoundaries, {
            style: {
                color: '#ff1744',
                weight: 2,
                fillOpacity: 0
            },
            interactive: false
        }).addTo(map);

        // Phu mat na toi mau len ben ngoai ranh gioi
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

        // Tu dong zoom vua khit voi ranh gioi
        map.fitBounds(boundaryLayer.getBounds());

        console.log('Da ve ranh gioi va tao vung mo ben ngoai thanh cong!');
    })
    .catch(error => {
        console.error('Loi khi tai file ranh gioi: ', error);
    });