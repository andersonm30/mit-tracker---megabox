<!DOCTYPE html>
<html lang="en">
<title>Relatório de Eventos</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
 <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"  crossorigin=""></script>

	<style>
        html, body {
            height: 100%;
            margin: 0;
        }
        .leaflet-container {
            height: 100%;
            width: 100%;
            max-width: 100%;
            max-height: 100%;
        }
    </style>
<?php 
	
	$deviceid = $_GET['deviceid'];
        $data_ini = $_GET['data_inicial'];
        $data_final = $_GET['data_final'];
	


	echo "<div id='map' data-geojson-url='gera_geojson_evento_traccar.php?deviceid=".$deviceid."&dt_ini=".$data_ini."&dt_fim=".$data_final."'></div>";

?>

<script>
    const map = L.map('map').setView([-15.7801, -47.9292], 5);

    var googleLayerStandard = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 25,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    var googleLayerSatellite = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 25,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    var openStreetMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    });

    openStreetMapLayer.addTo(map); // Adiciona o mapa do OpenStreetMap como padrão

    var baseMaps = {
        "Google (Padrão)": googleLayerStandard,
        "Google (Satélite)": googleLayerSatellite,
        "OpenStreetMap": openStreetMapLayer
    };

    L.control.layers(baseMaps).addTo(map);


    function onEachFeature(feature, layer) {
        let popupContent = "";

        if (feature.properties && feature.properties.popupContent) {
            popupContent += feature.properties.popupContent;
        }

        layer.bindPopup(popupContent);
    }

    function loadGeoJSON() {
        const mapDiv = document.getElementById('map');
        const geoJSONUrl = mapDiv.getAttribute('data-geojson-url');

        fetch(geoJSONUrl)
            .then(response => response.json())
            .then(data => {
				if (data.features.length === 0) {
						alert('Sem dados para exibir');
				} else {
					L.geoJSON(data, {
						pointToLayer: function (feature, latlng) {
							if (feature.geometry.type === 'Point') {
								if (feature.geometry.radius === 0) {	
									map.setZoom(14);
									map.panTo(latlng);
									var markerIcon = L.icon({
										iconUrl: feature.properties.icon,
										iconSize: [38, 38], // Tamanho do ícone do boneco
										iconAnchor: [19, 38], // Ponto de âncora do ícone
									});
									return L.marker(latlng,{icon: markerIcon});
								} else {
									return L.circle(latlng, {
																	radius: feature.geometry.radius,
																	fillColor: '#ff0000',
																	color: '#000',
																	opacity: 1,
																	fillOpacity: 0.1
																});
								}			
							} else if (feature.geometry.type === 'Polygon') {
								return L.polygon(latlng);
							} 
						},
						onEachFeature: onEachFeature
					}).addTo(map);
				}	
            })
            .catch(error => console.error('Error loading GeoJSON:', error));
    }
	
    loadGeoJSON();
</script>	
