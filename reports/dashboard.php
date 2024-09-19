<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>88TEC - Admin Dashboard</title>
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <meta content="" name="keywords">
    <meta content="" name="description">

    <!-- Favicon -->
    <link href="img/favicon.ico" rel="icon">

    <!-- Google Web Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&family=Roboto:wght@500;700&display=swap" rel="stylesheet"> 
    
    <!-- Icon Font Stylesheet -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">

    <!-- Customized Bootstrap Stylesheet -->
    <link href="css/bootstrap.min.css" rel="stylesheet">

    <!-- Template Stylesheet -->
    <link href="css/style.css" rel="stylesheet">
</head>
<body>
<?php
include('conexao88.php');

$conn = new conn();
$conn_gestao = $conn->conn_gestao();
$conn_traccar = $conn->conn_traccar();

$sql = "SELECT online, offline, manutencao, estoque, alarmes, geocercas, 
        DATE_FORMAT(dt_atualizacao,'%d/%m') data, 
        DATE_FORMAT(dt_atualizacao,'%d/%m/%Y %H:%i') data_atual 
        FROM gt_total_kpis 
        ORDER BY dt_atualizacao DESC LIMIT 7";

$cons_kpis = mysqli_query($conn_gestao, $sql);

$labels = '';
$online = '';
$offline = '';
$estoque = '';
$manutencao = '';
$alarmes = '';
$geocercas = '';		
$i = 0;
while($resp_kpis = mysqli_fetch_assoc($cons_kpis)){
    $online = ','.$resp_kpis['online'].$online;
    $labels = ',"'.$resp_kpis['data'].'"'.$labels;
    $offline = ','.$resp_kpis['offline'].$offline;
    $estoque = ','.$resp_kpis['estoque'].$estoque;
    $manutencao = ','.$resp_kpis['manutencao'].$manutencao;
    $alarmes = ','.$resp_kpis['alarmes'].$alarmes;
    $geocercas = ','.$resp_kpis['geocercas'].$geocercas;
    if( $i == 0 ){
        $i++;
        $online_atu = substr($online,1);
        $offline_atu = substr($offline,1);
        $estoque_atu = substr($estoque,1);
        $manutencao_atu = substr($manutencao,1);
        $data_atual = $resp_kpis['data_atual'];
    }	
}	
?>
    <div class="container-fluid pt-4 px-4">
        <div class="row g-4">
            <div class="col-sm-6 col-xl-3">
                <div class="bg-secondary rounded d-flex align-items-center justify-content-between p-4">
                    <i class="fa fa-check-circle fa-3x text-success"></i>
                    <div class="ms-3">
                        <p class="mb-2"><b>Online</b></p>
                        <h6 class="mb-0"><?php echo $online_atu;?></h6>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-xl-3">
                <div class="bg-secondary rounded d-flex align-items-center justify-content-between p-4">
                    <i class="fa fa-times-circle fa-3x text-danger"></i>
                    <div class="ms-3">
                        <p class="mb-2"><b>Offline</b></p>
                        <h6 class="mb-0"><?php echo $offline_atu;?></h6>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-xl-3">
                <div class="bg-secondary rounded d-flex align-items-center justify-content-between p-4">
                    <i class="fa fa-tools fa-3x text-warning"></i>
                    <div class="ms-3">
                        <p class="mb-2"><b>Manutenção</b></p>
                        <h6 class="mb-0"><?php echo $manutencao_atu;?></h6>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-xl-3">
                <div class="bg-secondary rounded d-flex align-items-center justify-content-between p-4">
                    <i class="fa fa-boxes fa-3x text-info"></i>
                    <div class="ms-3">
                        <p class="mb-2"><b>Estoque</b></p>
                        <h6 class="mb-0"><?php echo $estoque_atu;?></h6>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="container-fluid pt-4 px-4">
        <div class="row g-4">
            <div class="col-sm-12 col-xl-6">
                <div class="bg-secondary text-center rounded p-4">
                    <div class="d-flex align-items-center justify-content-between mb-4 text-danger">
                        <h6 class="mb-0">Status Dispositivos</h6>
                        <a href=""><?php echo $data_atual; ?></a>
                    </div>
                    <canvas id="status-dispositivos"></canvas>
                </div>
            </div>
            <div class="col-sm-12 col-xl-6">
                <div class="bg-secondary text-center rounded p-4">
                    <div class="d-flex align-items-center justify-content-between mb-4">
                        <h6 class="mb-0">Alertas/Geocercas</h6>
                        <a href=""><?php echo $data_atual; ?></a>
                    </div>
                    <canvas id="alarmes-geocercas"></canvas>
                </div>
            </div>
        </div>
    </div>

    <div class="container-fluid pt-4 px-4">
        <div class="bg-secondary text-center rounded p-4">
            <div class="d-flex align-items-center justify-content-between mb-4">
                <h6 class="mb-0">Alertas Recentes</h6>
                <a href=""></a>
            </div>
            <div class="table-responsive">
                <table class="table text-start align-middle table-bordered table-hover mb-0">
                    <thead>
                        <tr class="text-white">
                            <th>Data</th>
                            <th scope="col">Device</th>
                            <th scope="col">Nome</th>
                            <th scope="col">Tipo</th>
                            <th scope="col">Status</th>
                            <th scope="col">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $sql = 'SELECT d.name, e.id, e.type, 
                                DATE_FORMAT(DATE_ADD(e.eventtime, INTERVAL -3 HOUR),"%d/%m/%Y %H:%i") eventtime, 
                                e.deviceid, e.attributes, 
                                (SELECT CONCAT(NAME,"#",AREA) geo FROM tc_geofences g WHERE e.geofenceid = g.id) geocerca, 
                                (SELECT CONCAT(latitude,"#",longitude,"#",address) FROM tc_positions p WHERE e.positionid = p.id) position, 
                                d.nomecompleto 
                                FROM tc_events e, tc_devices d 
                                WHERE e.deviceid = d.id 
                                AND TYPE != "deviceOnline" 
                                AND TYPE != "deviceOffline" 
                                AND TYPE != "deviceUnknown" 
                                AND TYPE != "deviceMoving" 
                                AND TYPE != "deviceStopped" 
                                AND e.eventtime BETWEEN DATE_ADD(NOW(), INTERVAL -10 DAY) AND DATE_ADD(NOW(), INTERVAL 3 HOUR) 
                                ORDER BY e.id DESC LIMIT 15';

                        $cons_eventos = mysqli_query($conn_traccar, $sql);

                        while($resp_eventos = mysqli_fetch_assoc($cons_eventos)){
                            $tipo = $resp_eventos['type'];
                            $attributes = $resp_eventos['attributes'];
                            if($tipo == 'alarm') { 
                                $tipo = 'Alarme'; 
                                $icon = 'img/alerta.png'; 
                            } elseif ($tipo == 'geofenceEnter') { 
                                $tipo = 'Entrada Geocerca'; 
                                $icon = 'img/entrada.png';
                            } elseif ($tipo == 'geofenceExit') { 
                                $tipo = 'Saida Geocerca'; 
                                $icon = 'img/saida.png';
                            } 
                            $attributes = str_replace(['alarmInrange','removing','"','}', '{', '"alarm":"'], ['Aproximação',' de remoção','','','',''], $attributes);
                            $tipo = $tipo. ' '.$attributes;

                            echo "<tr>
                                    <td>{$resp_eventos['eventtime']}</td>
                                    <td>{$resp_eventos['name']}</td>
                                    <td>{$resp_eventos['nomecompleto']}</td>
                                    <td>{$tipo}</td>
                                    <td>Ativo</td>
                                    <td><a class='btn btn-sm btn-primary' href=''>Detail</a></td>
                                  </tr>";
                        }
                        ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- JavaScript Libraries -->
    <script src="https://code.jquery.com/jquery-3.7.1.js" integrity="sha256-eKhayi8LEQwp4NKxN+CfCh+3qOVUtJn3QNZ0TciWLP4=" crossorigin="anonymous"></script>  
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="lib/chart/chart.min.js"></script>
    <script src="lib/easing/easing.min.js"></script>
    <script src="lib/waypoints/waypoints.min.js"></script>
    <script src="lib/owlcarousel/owl.carousel.min.js"></script>
    <script src="lib/tempusdominus/js/moment.min.js"></script>
    <script src="lib/tempusdominus/js/moment-timezone.min.js"></script>
    <script src="lib/tempusdominus/js/tempusdominus-bootstrap-4.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
    <script src="https://cdn.datatables.net/2.0.5/js/dataTables.js"></script>
    <script src="js/main.js"></script>

    <script>
    var ctx1 = $("#status-dispositivos").get(0).getContext("2d");
    var myChart1 = new Chart(ctx1, {
        type: "bar",
        data: {
            labels: [<?php echo substr($labels,1); ?>],
            datasets: [{
                    label: "Online",
                    data: [<?php echo substr($online,1); ?>],
                    backgroundColor: "rgba(0, 200, 22, .6)"
                },
                {
                    label: "Offline",
                    data: [<?php echo substr($offline,1); ?>],
                    backgroundColor: "rgba(235, 22, 22, .6)"
                },
                {
                    label: "Manutencao",
                    data: [<?php echo substr($manutencao,1); ?>],
                    backgroundColor: "rgba(253, 233, 16, .6)"
                },
                {
                    label: "Estoque",
                    data: [<?php echo substr($estoque,1); ?>],
                    backgroundColor: "rgba(255, 140, 0, .6)"
                }
            ]
            },
        options: {
            responsive: true
        }
    });

    var ctx2 = $("#alarmes-geocercas").get(0).getContext("2d");
    var myChart2 = new Chart(ctx2, {
        type: "line",
        data: {
            labels: [<?php echo substr($labels,1); ?>],
            datasets: [{
                    label: "Alarmes",
                    data: [<?php echo substr($alarmes,1); ?>],
                    backgroundColor: "rgba(235, 22, 22, .7)",
                    fill: true
                },
                {
                    label: "Geocercas",
                    data: [<?php echo substr($geocercas,1); ?>],
                    backgroundColor: "rgba(235, 22, 22, .5)",
                    fill: true
                }
            ]
            },
        options: {
            responsive: true
        }
    });
    </script>
</body>
</html>
