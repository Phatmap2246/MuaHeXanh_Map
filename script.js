// ============================================================
// 1. KHOI TAO BAN DO
// ============================================================
var map = L.map('map').setView([10.823099, 106.629664], 12);

// Ban do nen OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Bien toan cuc de luu tat ca cac marker sau khi load
var allMarkers = [];
var markerLayer = L.layerGroup().addTo(map);

// ============================================================
// 2. DOC DU LIEU GEOJSON
// ============================================================
var geoJsonUrl = 'data/ubnd_hcm_Mock.geojson';

// Ham tao marker voi popup
function createMarker(feature, latlng) {
    var ten = feature.properties['Ten Phuong/Xa'] || 'Chua co ten';
    var quan = feature.properties['Quan/Huyen'] || 'Chua co quan';
    var diaChi = feature.properties['Dia chi chinh xac'] || 'Chua co dia chi';
    var sdt = feature.properties['So dien thoai'] || 'Chua cap nhat';

    var popupContent = `
        <b>${ten}</b><br>
        ${quan}<br>
        ${diaChi}<br>
        ${sdt}
    `;

    var customIcon = L.divIcon({
        className: 'marker-custom',
        html: '&#128205;',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
    });

    var marker = L.marker(latlng, { icon: customIcon })
        .bindPopup(popupContent);

    return marker;
}

// Tai du lieu
fetch(geoJsonUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Khong tim thay file GeoJSON. Vui long kiem tra lai.');
        }
        return response.json();
    })
    .then(data => {
        markerLayer.clearLayers();
        allMarkers = [];

        L.geoJSON(data, {
            pointToLayer: function(feature, latlng) {
                var marker = createMarker(feature, latlng);
                allMarkers.push({
                    marker: marker,
                    ten: feature.properties['Ten Phuong/Xa'] || '',
                    quan: feature.properties['Quan/Huyen'] || '',
                    latlng: latlng
                });
                return marker;
            }
        }).addTo(markerLayer);

        console.log('Da tai thanh cong ' + allMarkers.length + ' dia diem.');
        document.title = 'Ban do UBND TP.HCM (' + allMarkers.length + ' diem)';
    })
    .catch(error => {
        console.error('Loi:', error);
    });

// ============================================================
// 3. CHUC NANG TIM KIEM
// ============================================================
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