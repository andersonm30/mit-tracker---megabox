<?php 
$file = 'Relatorio_percurso_'.$_GET['deviceid'].'_'.rand().'.xls';

header("Content-Type:   application/vnd.ms-excel; charset=utf-8");
header("Content-Disposition: attachment; filename=$file");  //File name extension was wrong
header("Expires: 0");
header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
header("Cache-Control: private",false);

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Percurso</title>
</head>
<body>

<?php
function formata_data($data_raw,$year_len){
	if( $year_len == 2 ) {
		$data_comand = date('d/m/y H:i:s', strtotime("$data_raw"));		
	} else {
		$data_comand = date('d/m/Y H:i:s', strtotime("$data_raw"));		
	}
	return $data_comand;
}


session_start();

$deviceId = $_GET['deviceid'];
$from = $_GET['data_inicial'];
$to = $_GET['data_final'];
$data_ini =  $_GET['data_inicial']; 
$data_fim =  $_GET['data_final'];


	echo "<div>";
	echo "<table border='0' width='100%'>";
	echo "<tr>";
	echo "<td colspan=4 width='80%' align='center'><h2><u>Relatório de Percurso</u></h2></td>";
	echo "</tr>";
	echo "<tr>";
	echo "<td colspan=2 align='left'></td>";
	echo "</tr>";
	echo "<tr>";
	echo "<td colspan=3 align='left'><b>&nbsp;&nbsp;Período:</b> ".$data_ini." a ".$data_fim."</td>";
	echo "</tr>";
	

include 'api_traccar.php';

$traccar = new traccar();

$login = $traccar->login('admin','admin');	
	
$sessionId = $login->response;

session_start();
$_SESSION['user'] = 'admin';
$_SESSION['sessionId'] = $sessionId;
$_SESSION['Basic'] = base64_encode( 'admin' . ':' . 'admin' );
			
$response = $traccar->devices($sessionId,$deviceId);

$devices = json_decode($response->response,true);

foreach( $devices as $device){
	$device_name = $device['name'];
	$imei = $device['uniqueId'];
	echo "<tr>";
	echo "<td colspan=2 align='left'><b>&nbsp;&nbsp;Nome:</b> $device_name </td>";
	echo "</tr>";
	echo "<tr>";
	echo "<td colspan=2 align='left'><b>&nbsp;&nbsp;Imei:</b> $imei </td>";
	echo "</tr>";
	echo "</table>";	
	echo "</div><br><hr><br>";
}
	
$response = $traccar->positions($sessionId,$deviceId,$from,$to);
$positions = json_decode($response->response,true);

$i = 0;
$agg = 0;
$endereco_ant ='';
$coordenadas  = array();
$vazio  = array();

echo "<table border='1' width='100%'>";
echo "<tr>";
	echo "<td><b>Data</b></td>";
	echo "<td><b>Latitude</b></td>";
	echo "<td><b>Longitude</b></td>";
	echo "<td><b>Endereço</b></td>";
	echo "</tr>";

foreach( $positions as $position){
	$i++;
	$agg++;
	
	//var_dump($position);
    // Informações
	$id = $position['id'];
    $nomeDevice = $device_name;
    $horario = formata_data($position['serverTime'],4);
    $endereco = $position['address'];
    $latitude = $position['latitude'];
    $longitude = $position['longitude'];
	
	echo "<tr>";
	echo "<td > $horario</td>";
	echo "<td >$latitude</td>";
	echo "<td >$longitude</td>";
	echo "<td >$endereco</td>";
	echo "</tr>";
	
}
echo "</table>";

?>

</body>
</html>

