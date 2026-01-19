<?php
/**
 * Upload de Fotos de Instalação e Vistoria de Dispositivos
 * 
 * Endpoint: /tarkan/device/upload-photo
 * Parâmetros:
 *   - deviceId: ID do dispositivo
 *   - type: 'installation' ou 'inspection'
 *   - index: 1, 2 ou 3 (número da foto)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Permitir requisições OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verificar se é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido. Use POST.']);
    exit;
}

// Obter parâmetros
$deviceId = isset($_GET['deviceId']) ? intval($_GET['deviceId']) : null;
$type = isset($_GET['type']) ? $_GET['type'] : null;
$index = isset($_GET['index']) ? intval($_GET['index']) : null;

// Validar parâmetros
if (!$deviceId || !$type || !$index) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Parâmetros inválidos',
        'details' => 'deviceId, type e index são obrigatórios'
    ]);
    exit;
}

// Validar tipo
if (!in_array($type, ['installation', 'inspection'])) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Tipo inválido',
        'details' => 'type deve ser "installation" ou "inspection"'
    ]);
    exit;
}

// Validar índice
if ($index < 1 || $index > 3) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Índice inválido',
        'details' => 'index deve ser 1, 2 ou 3'
    ]);
    exit;
}

// Verificar se arquivo foi enviado
if (!isset($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Nenhum arquivo enviado',
        'details' => 'Por favor, selecione uma imagem'
    ]);
    exit;
}

$file = $_FILES['file'];

// Verificar erros de upload
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erro ao fazer upload',
        'details' => 'Código de erro: ' . $file['error']
    ]);
    exit;
}

// Validar tipo MIME
$allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedMimes)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Tipo de arquivo inválido',
        'details' => 'Apenas imagens (JPEG, PNG, GIF, WebP) são permitidas'
    ]);
    exit;
}

// Validar tamanho (máximo 5MB)
$maxSize = 5 * 1024 * 1024; // 5MB em bytes
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Arquivo muito grande',
        'details' => 'O tamanho máximo permitido é 5MB'
    ]);
    exit;
}

// Definir diretórios
$baseDir = __DIR__ . '/assets/device-photos';
$deviceDir = $baseDir . '/' . $deviceId;
$typeDir = $deviceDir . '/' . $type;

// Criar diretórios se não existirem
if (!is_dir($baseDir)) {
    mkdir($baseDir, 0755, true);
}
if (!is_dir($deviceDir)) {
    mkdir($deviceDir, 0755, true);
}
if (!is_dir($typeDir)) {
    mkdir($typeDir, 0755, true);
}

// Gerar nome do arquivo
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
if (empty($extension)) {
    // Determinar extensão pelo MIME type
    $mimeToExt = [
        'image/jpeg' => 'jpg',
        'image/jpg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp'
    ];
    $extension = $mimeToExt[$mimeType] ?? 'jpg';
}

$filename = $type . '_' . $index . '.' . $extension;
$filepath = $typeDir . '/' . $filename;

// Remover foto anterior se existir
if (file_exists($filepath)) {
    unlink($filepath);
}

// Mover arquivo
if (!move_uploaded_file($file['tmp_name'], $filepath)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erro ao salvar arquivo',
        'details' => 'Não foi possível mover o arquivo para o diretório de destino'
    ]);
    exit;
}

// Retornar URL da foto
$photoUrl = '/tarkan/assets/device-photos/' . $deviceId . '/' . $type . '/' . $filename;

// Resposta de sucesso
http_response_code(200);
echo json_encode([
    'success' => true,
    'url' => $photoUrl,
    'filename' => $filename,
    'size' => $file['size'],
    'type' => $mimeType,
    'deviceId' => $deviceId,
    'photoType' => $type,
    'photoIndex' => $index
]);
exit;
