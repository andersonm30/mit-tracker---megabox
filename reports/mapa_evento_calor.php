    <title>Mapa de Eventos</title>
    
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
	$deviceid = $_GET['deviceid'];
        $data_ini = $_GET['data_inicial'];
        $data_final = $_GET['data_final'];

    echo "<div id='map' data-geojson-url='gera_geojson_evento_traccar.php?id=0&calor=1&deviceid=".$deviceid."&dt_ini=".$data_ini."&dt_fim=".$data_final."'></div>";
	?>
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

        // Function to load heatmap from GeoJSON
        function loadHeatmapFromGeoJSON() {
			const mapDiv = document.getElementById('map');	
			var geoJSONUrl = mapDiv.getAttribute('data-geojson-url');
            fetch(geoJSONUrl)
                .then(response => response.json())
                .then(data => {
					 if (data.features.length === 0) {
						 //window.location.href = 'report_nodata.php';
						 alert('Sem dados para exibir !!!');
					} else {
						var heatmapData = [];

						// Extract coordinates from GeoJSON features
						data.features.forEach(feature => {
							if (feature.geometry && feature.geometry.coordinates) {
								heatmapData.push([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
							}
						});
						
						//map.setZoom(14);
						
						
						// Create the heatmap layer
						var heatmapLayer = L.heatLayer(heatmapData, {
							radius: 30,
							blur: 20,
							maxZoom: 5
						}).addTo(map);
						 // Get the last coordinates
						var lastCoordinate = heatmapData[heatmapData.length - 1];

						// Set map view to the last coordinate
						map.setView(lastCoordinate, 13);
					}	
                })
                .catch(error => console.error('Error loading GeoJSON:', error));
        }

        // Load heatmap from GeoJSON when the page is loaded
        loadHeatmapFromGeoJSON();

        // Add layer control
        var baseMaps = {
            "Google Maps (Standard)": googleLayerStandard,
            "Google Maps (Satellite)": googleLayerSatellite,
            "OpenStreetMap": osmLayer
        };

        var overlayMaps = {};

        L.control.layers(baseMaps, overlayMaps).addTo(map);
    </script>

