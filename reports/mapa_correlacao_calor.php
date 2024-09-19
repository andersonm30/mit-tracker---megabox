    <title>Mapa Correlação</title>
    
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>

    <!-- Leaflet.heat CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet.heat/dist/leaflet-heat.css" />
	 <style>
        /* Estilo para fazer o mapa ocupar 100% da altura da tela */
        html, body, #map {
            height: 100%;
            margin: 0;
        }
    </style>
	
	
<?php

$date = date('Y-m-d');	

$data_inicio = str_replace('Z','',str_replace('T',' ',$_REQUEST['data_inicial']));

$data_final = str_replace('Z','',str_replace('T',' ',$_REQUEST['data_final']));

$deviceid = $_REQUEST['deviceid'];

include_once('conexao88.php');

$conn = new conn();

$conn_traccar = $conn->conn_traccar();

$sql = "SELECT 	dn.id,
											d.name name_ref,
											dn.latituderef,
											dn.longituderef,
											(SELECT NAME FROM tc_devices tdd WHERE tdd.id = dn.deviceidnear) name_near,
											dn.latitudenear,
											dn.longitudenear,
											dn.distancemt,
											dn.servertime
								FROM 		tc_devices_near dn,
											tc_devices d
								WHERE		dn.deviceidref = d.id
								and			dn.deviceidref = $deviceid
								and 		dn.servertime between '$data_inicio' and '$data_final'";
								
//echo $sql;								

$devices_near = mysqli_query($conn_traccar,$sql);

?>
	
    <div id="map"></div>

    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>

    <!-- Leaflet.heat JS -->
    <script src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js"></script>

    <script>
        // Initialize Leaflet map
        var map = L.map('map').setView([ -15.7801,-47.9292], 5);

        // Google Maps API Key
        var googleMapsKey = 'YOUR_GOOGLE_MAPS_API_KEY';

        // Google Maps Layer (Standard)
        var googleLayerStandard = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=' + googleMapsKey, {
            maxZoom: 20,
            attribution: '© Google Maps'
        });

        // Google Maps Layer (Satellite)
        var googleLayerSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=' + googleMapsKey, {
            maxZoom: 20,
            attribution: '© Google Maps'
        });

        // OpenStreetMap Layer
        var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        });

        // Add default OpenStreetMap to the map
        osmLayer.addTo(map);

       function loadHeatmapFromGeoJSON(geoJSON) {
			if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
				window.location.href = 'report_nodata.php';
				return;
			}

			var heatmapData = [];

			// Extrai as coordenadas dos recursos GeoJSON
			geoJSON.features.forEach(feature => {
				if (feature.geometry && feature.geometry.coordinates) {
					heatmapData.push([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
				}
			});

			// Cria a camada de heatmap
			var heatmapLayer = L.heatLayer(heatmapData, {
				radius: 20,
				blur: 20,
				maxZoom: 10
			}).addTo(map);

			// Obtém as últimas coordenadas
			var lastCoordinate = heatmapData[heatmapData.length - 1];

			// Define a visualização do mapa para as últimas coordenadas
			map.setView(lastCoordinate, 13);
		}
		
			
<?php
	$geoJSON = '{
		"type": "FeatureCollection",
		"features": [';

	$i = 0;
	while($row_devices = mysqli_fetch_assoc($devices_near)){
	if ( $i > 0 ) { 	$geoJSON .= ','; }
	$i++;
	$geoJSON .= '{
					"geometry": {
						"type": "Point",
						"coordinates": ['.$row_devices['longituderef'].','.$row_devices['latituderef'].']
					},
					"type": "Feature",
					"properties": {
						"popupContent": "Encontro <b>'.$row_devices['name_ref'].'</b> com <b>'.$row_devices['name_near'].'</b> - Horario: '.$row_devices['servertime'].'"
					},
					"id": '.$row_devices['id'].'
				}';
	}
	$geoJSON .= ']}';
	

				
				echo "loadHeatmapFromGeoJSON($geoJSON);";
?>
        
        

        // Add layer control
        var baseMaps = {
            "Google Maps (Standard)": googleLayerStandard,
            "Google Maps (Satellite)": googleLayerSatellite,
            "OpenStreetMap": osmLayer
        };

        var overlayMaps = {};

        L.control.layers(baseMaps, overlayMaps).addTo(map);
    </script>
