<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Percurso</title>
    <style>
        .device-info {
            border: 1px solid #ccc;
            border-radius: 10px;
            padding: 10px;
            margin-bottom: 20px;
        }
        .map-container {
            width: 270px;
            height: 170px;
        }
    </style>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
</head>
<body>

<script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>

  <script src="https://code.jquery.com/jquery-3.7.1.js" integrity="sha256-eKhayi8LEQwp4NKxN+CfCh+3qOVUtJn3QNZ0TciWLP4=" crossorigin="anonymous"></script>  
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js"></script>
	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
	<script src="https://cdn.datatables.net/2.0.5/js/dataTables.js"></script>
	

<?php

date_default_timezone_set('America/Sao_Paulo');

function formata_data($data_raw,$year_len){
	if( $year_len == 2 ) {
		$data_comand = date('d/m/y H:i:s', strtotime("$data_raw"));		
	} else {
		$data_comand = date('d/m/Y H:i:s', strtotime("$data_raw"));		
	}
	return $data_comand;
}


$deviceId = $_GET['deviceid'];
$from = $_GET['data_inicial'];
$to = $_GET['data_final'];

$data_ini =  $from; 
$data_fim =  $to; 
$agrupar = 1;


	echo "<div>";
	echo "<table border='0' width='100%'>";
	echo "<tr>";
	echo "<td rowspan=3 width='10%' align='center' ><img src='img/logo.png' width='80px' height='80px'></img></td>";
	echo "<td colspan=2 width='80%' align='center'><h2><u>Relatório de Percurso</u></h2></td>";
	echo "</tr>";
	echo "<tr>";
	echo "<td colspan=2 align='left'></td>";
	echo "</tr>";
	echo "<tr>";
	echo "<td colspan=2 align='left'><b>&nbsp;&nbsp;Período:</b> ".formata_data($data_ini,4)." a ".formata_data($data_fim,4)."</td>";
	echo "</tr>";
	echo "</table>";	
	echo "</div><br><hr><br>";


	include 'api_traccar.php';


    $traccar = new traccar();

    $login = $traccar->login('administrador','$uporte80');

    $sessionId = $login->response;

    session_start();
    $_SESSION['user'] = 'admin';
    $_SESSION['sessionId'] = $sessionId;
    $_SESSION['Basic'] = base64_encode( 'admin' . ':' . 'admin' );


	$response = $traccar->devices($_SESSION['sessionId'],$deviceId);

	$devices = json_decode($response->response,true);

foreach( $devices as $device){
	$device_name = $device['name'];
}

$response = $traccar->positions($_SESSION['sessionId'],$deviceId,$from,$to);



$positions = json_decode($response->response,true);

$i = 0;
$agg = 0;
$endereco_ant ='';
$coordenadas  = array();
$vazio  = array();


foreach( $positions as $position){
	$i++;
	$agg++;
	
    // Informações
	$id = $position['id'];
    $nomeDevice = $device_name;
    $horario = formata_data($position['serverTime'],4);
    $endereco = $position['address'];
    $latitude = $position['latitude'];
    $longitude = $position['longitude'];
	
	$coordenadas[] = array(
        'latitude' => $latitude, // Gerando latitude aleatória entre -90 e 90
        'longitude' => $longitude // Gerando longitude aleatória entre -180 e 180
    );
	
	if ( $agrupar == $agg ){
		// Div para o mapa
		imprimir_mapa($nomeDevice,$horario,$endereco,$id,$coordenadas);
		$agg = 0;
		unset ($coordenadas);
	}	
	$endereco_ant = $endereco;
}

function imprimir_mapa($nomeDevice,$horario,$endereco,$id,$coordenadas){
	$marcadores = '';
	
	foreach ($coordenadas as $coordenada) {
		$latitude = $coordenada['latitude'];
		$longitude = $coordenada['longitude'];	
		$marcadores .= "L.marker([$latitude, $longitude],{icon: markerIcon}).addTo(map$id);";
		
	}
	
	//echo $marcadores.'<br>';
	echo "<div class='device-info'>
				<table border='0'>
					<tr>
						<td width='70%'>    
							<p><strong>Nome do device: </strong>$nomeDevice - $id</p>
							<p><strong>Horário: </strong>$horario</p>
							<p><strong>Endereço: </strong>$endereco</p>
						</td>
						<td width='30%' align>    
						<div id='map-$id' class='map-container' align='right'></div>
						<script> 
							// Creating map options
							 var mapOptions = {
								center: [17.385044, 78.486671],
								zoom: 15,
								zoomControl: false
							 }
							
							const map$id = new L.map('map-$id', mapOptions).setView([$latitude, $longitude], 15);
							
													
							L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 20}).addTo(map$id);
							var markerIcon = L.icon({iconUrl: 'img/pin.png',iconSize: [38, 38], iconAnchor: [19, 38]});
							
							$marcadores
							
							</script>		
						</td>
					</tr>   
				</table>    
			</div>";
	
}
if( $i > 0) {	
	//imprimir_mapa($nomeDevice,$horario,$endereco,$id,$coordenadas);
} else {
	//header('Location: report_nodata.php');
	exit;
}	
?>

</body>
</html>
