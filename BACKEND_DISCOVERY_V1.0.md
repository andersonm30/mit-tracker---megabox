# Backend Discovery - Sistema de Upload de Fotos
**Versão:** 1.0  
**Data:** 2025-01-XX  
**Objetivo:** Análise completa da infraestrutura backend Laravel para implementação do PR-04 (Upload de Fotos de Motoristas)

---

## 📋 Sumário Executivo

**Status Atual:**
- ✅ **DeviceController** possui método `uploadImage()` funcional (referência)
- ✅ **Intervention Image** library disponível (manipulação de imagens)
- ✅ **Storage** configurado com padrão IP-based
- ❌ **DriverController** NÃO possui método de upload de foto
- ❌ **Rota** para upload de foto de motorista NÃO existe

**Conclusão:**  
Backend possui toda infraestrutura necessária. Falta apenas criar endpoint específico para drivers adaptando o padrão existente de `DeviceController@uploadImage`.

---

## 🏗️ 1. Arquitetura Laravel Identificada

### 1.1 Framework
- **Laravel**: Versão não especificada (estrutura padrão app/Http/Controllers)
- **Conexão DB Traccar**: `mysql_traccar` (usado em TcDeviceDriver model)
- **Storage**: Laravel Storage Facade com filesystem local

### 1.2 Estrutura de Diretórios
```
C:\projeto\Versao-tarkan-Jesse\back-end\
├── app/
│   ├── Http/Controllers/
│   │   ├── DriverController.php          ← Gerencia CRUD de drivers
│   │   ├── DeviceController.php          ← TEM uploadImage() - REFERÊNCIA
│   │   └── UploadsController.php         ← Upload genérico de arquivos
│   └── Models/
│       └── TcDeviceDriver.php            ← Model (tabela: tc_device_driver)
├── routes/
│   └── api.php                           ← Rotas API (POST /drivers, etc)
└── storage/
    └── app/
        └── assets/
            └── {ip}/                      ← Organização por IP do cliente
                └── assets/images/
                    ├── 100.jpg            ← Foto de device ID 100
                    ├── 101.jpg
                    └── ...
```

---

## 🎯 2. Controllers Analisados

### 2.1 DriverController.php
**Localização:** `app/Http/Controllers/DriverController.php`  
**Linhas:** ~210  
**Namespace:** `App\Http\Controllers`

**Imports:**
```php
use App\Models\UserLog;
use App\Tarkan\traccarConnector;
use Illuminate\Http\Request;
```

**Métodos Identificados:**
| Método | Rota | Descrição | Status Foto |
|--------|------|-----------|-------------|
| `post()` | POST /api/drivers | Cria novo driver + integração Traccar | ❌ Sem foto |
| `put()` | PUT /api/drivers/{driverId} | Atualiza driver existente | ❌ Sem foto |
| `checkDriver()` | POST /qr-driver | Valida QR code e vincula usuário | ❌ N/A |

**Características:**
- ✅ Usa `traccarConnector` para sincronizar com Traccar API
- ✅ Registra ações em `UserLog` (auditoria)
- ❌ **NÃO possui método de upload de imagem**
- ✅ Model TcDeviceDriver disponível (tabela: `tc_device_driver`)

**Código Exemplo - post():**
```php
public function post(Request $request){
    // 1. Cria driver no sistema
    // 2. Integra com Traccar via traccarConnector->createDriver()
    // 3. Se recebeu user_id, cria usuário QR vinculado
    // 4. Registra em UserLog
    return response()->json($data, 200);
}
```

---

### 2.2 DeviceController.php (REFERÊNCIA)
**Localização:** `app/Http/Controllers/DeviceController.php`  
**Método Chave:** `uploadImage()` (linha 275)

**Imports Críticos:**
```php
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Facades\Image;
```

**Código Completo - uploadImage():**
```php
public function uploadImage(Request $request){
    
    // 1. Verifica se diretório existe, senão cria
    if(!Storage::exists('assets/'.$request->ip().'/assets/images/')){
        Storage::makeDirectory('assets/'.$request->ip().'/assets/images/');
    }
    
    // 2. Processa imagem com Intervention Image
    Image::make($request->file('image'))
        ->fit('170', '140')  // Redimensiona (crop + resize)
        ->save(storage_path(). '/app/assets/'.$request->ip().'/assets/images/' . $request->deviceId .'.jpg')
        ->encode('jpg', 80); // Compressão 80%
    
    return response()->json(['img'=>true]);
}
```

**Características do Padrão:**
| Item | Valor |
|------|-------|
| **Campo form-data** | `image` (via `$request->file('image')`) |
| **Parâmetro ID** | `$request->deviceId` (passado no body ou query) |
| **Path Storage** | `assets/{ip}/assets/images/{deviceId}.jpg` |
| **IP Client** | `$request->ip()` (organização por IP) |
| **Dimensões** | 170x140 pixels (crop fit) |
| **Formato** | JPEG com qualidade 80% |
| **Validação** | ❌ Sem validação explícita (aceita qualquer file) |
| **Sobrescrita** | ✅ Sim (sempre mesmo nome de arquivo) |

---

### 2.3 UploadsController.php (GENÉRICO)
**Localização:** `app/Http/Controllers/UploadsController.php`  
**Linhas:** ~46

**Métodos:**
1. **setUpdate(Request $request, $id)** - Upload genérico
2. **setDelete($id, $fileName)** - Delete arquivo
3. **list($id)** - Lista arquivos

**Código Exemplo - setUpdate():**
```php
public function setUpdate(Request $request, $id)
{
    $request->validate([
        'file' => 'required|file|mimes:pdf,doc,docx,txt,jpg,jpeg,png,gif,zip|max:20480', // 20MB max
    ]);
    
    $file = $request->file('file');
    $path = $file->store("uploads/{$id}"); // Laravel storage/app/uploads/{id}/
    
    return response()->json(['url' => Storage::url($path)], 200);
}
```

**Características:**
- ✅ Validação robusta (mimes, max 20MB)
- ✅ Retorna URL pública do arquivo
- ✅ Organiza por ID em `uploads/{id}/`
- ❌ Não processa imagens (apenas armazena)
- ❌ Não sobrescreve (gera nomes únicos)

---

## 🛣️ 3. Rotas API (api.php)

**Localização:** `routes/api.php`

**Rotas Drivers Existentes:**
```php
// Grupo QR Driver
Route::group(['prefix'=>'qr-driver'],function(){
    Route::post("/",[DriverController::class,'checkDriver']);
});

// Grupo API Drivers (dentro de middleware auth ou outro grupo)
Route::group(['prefix'=>'drivers'],function(){
    Route::post("/",[DriverController::class,'post']);                    // Criar driver
    Route::put("/{driverId}",[DriverController::class,'put']);            // Atualizar driver
});
```

**Rota Device Photo (REFERÊNCIA):**
```php
Route::post('/devices/{deviceId}/photo', [DeviceController::class, 'uploadImage']);
```

**❌ AUSENTE:**
```php
// NÃO EXISTE AINDA - PRECISA SER CRIADA:
Route::post('/drivers/{driverId}/photo', [DriverController::class, 'uploadDriverPhoto']);
```

---

## 📤 4. Formato de Upload

### 4.1 Request (Device Pattern)
**Método:** `POST`  
**Content-Type:** `multipart/form-data`

**cURL Exemplo (Device):**
```bash
curl -X POST "http://api.example.com/api/devices/123/photo" \
  -H "Authorization: Bearer {token}" \
  -F "image=@/path/to/photo.jpg" \
  -F "deviceId=123"
```

**Parâmetros:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `image` | File | ✅ Sim | Arquivo da imagem (form-data) |
| `deviceId` | String/Int | ✅ Sim | ID do device (body ou query) |

### 4.2 Response (Device Pattern)
**Sucesso (200):**
```json
{
  "img": true
}
```

**Erro (500):**
```json
{
  "message": "Error message"
}
```

### 4.3 Proposta para Driver
**Request Adaptado:**
```bash
curl -X POST "http://api.example.com/api/drivers/456/photo" \
  -H "Authorization: Bearer {token}" \
  -F "image=@/path/to/driver-photo.jpg" \
  -F "driverId=456"
```

**Response Sugerido:**
```json
{
  "success": true,
  "photo_url": "/storage/assets/127.0.0.1/assets/images/drivers/456.jpg",
  "timestamp": 1735689600000
}
```

---

## 💾 5. Sistema de Storage

### 5.1 Estrutura de Armazenamento
**Path Base:** `C:\projeto\Versao-tarkan-Jesse\back-end\storage\app\`

**Organização Atual (Devices):**
```
storage/app/
└── assets/
    ├── 127.0.0.1/                    ← IP do cliente (localhost dev)
    │   └── assets/images/
    │       ├── 100.jpg               ← Device ID 100
    │       ├── 101.jpg               ← Device ID 101
    │       └── ...
    └── default/                       ← IP não identificado?
        └── assets/images/
```

**Observações:**
- ✅ Organização por IP permite multi-tenant
- ⚠️ Path repetido `assets/assets/` (possível legado)
- ⚠️ Sempre sobrescreve arquivo (não mantém histórico)

### 5.2 Proposta para Drivers
**Opção A - Mesmo diretório de devices:**
```
assets/{ip}/assets/images/
├── 100.jpg          ← Device ID 100
├── driver_1.jpg     ← Driver ID 1 (prefixo para evitar colisão)
├── driver_2.jpg
```

**Opção B - Diretório separado (RECOMENDADO):**
```
assets/{ip}/assets/
├── images/          ← Devices
│   ├── 100.jpg
│   └── 101.jpg
└── drivers/         ← Drivers (novo)
    ├── 1.jpg
    └── 2.jpg
```

### 5.3 Acesso Público
**Laravel Storage Link:**
```bash
php artisan storage:link
```
Cria symlink: `public/storage → storage/app/public`

**⚠️ PROBLEMA:** Imagens estão em `storage/app/assets/`, NÃO em `storage/app/public/`

**Possíveis Soluções:**
1. Mover para `storage/app/public/assets/`
2. Criar rota controller que serve imagens com auth
3. Configurar symlink customizado
4. Usar frontend proxy (API retorna base64 ou stream)

---

## 🔌 6. Intervention Image Library

**Documentação:** http://image.intervention.io/  
**Versão:** Assumida 2.x (Laravel Facade disponível)

### 6.1 Métodos Utilizados

**fit(width, height)**
```php
Image::make($file)->fit(170, 140)
// Redimensiona E croppa para dimensões exatas
// Mantém proporção do centro da imagem
```

**save(path)**
```php
->save(storage_path().'/app/assets/...')
// Salva em disco (não retorna response diretamente)
```

**encode(format, quality)**
```php
->encode('jpg', 80)
// Define formato e compressão (1-100)
```

### 6.2 Outros Métodos Úteis
```php
// Redimensionar mantendo proporção (sem crop)
->resize(800, 800, function ($constraint) {
    $constraint->aspectRatio();
    $constraint->upsize(); // Não aumenta se menor
})

// Compressão automática
->encode('jpg', 70) // Recomendado para fotos de motoristas

// Adicionar marca d'água
->insert('watermark.png', 'bottom-right', 10, 10)

// Converter para base64
->encode('data-url')
```

---

## 🔍 7. Integração com Drivers Module

### 7.1 Model TcDeviceDriver
**Localização:** `app/Models/TcDeviceDriver.php`

**Código:**
```php
namespace App\Models;

use App\Casts\Json;
use Illuminate\Database\Eloquent\Model;

class TcDeviceDriver extends Model{
    protected $table = "tc_device_driver";
    protected $connection = 'mysql_traccar'; // Banco separado!
}
```

**Observações:**
- ✅ Usa conexão `mysql_traccar` (não o banco principal Laravel)
- ⚠️ Não possui casts, fillable, hidden definidos (código truncado?)
- ❓ Schema da tabela desconhecido (sem migration encontrada)

### 7.2 Integração Traccar
**traccarConnector Usage:**
```php
$traccar = new traccarConnector($request);
$traccar->createDriver($driverData);
```

**Questões:**
- ❓ Traccar API suporta foto de driver?
- ❓ Precisa sincronizar foto com Traccar ou só local?
- ❓ Traccar retorna URL de foto em GET /api/drivers?

---

## 🚨 8. Gaps e Limitações Identificadas

| Gap | Severidade | Descrição | Impacto PR-04 |
|-----|-----------|-----------|---------------|
| **Sem rota driver photo** | 🔴 CRÍTICO | Não existe POST /api/drivers/{id}/photo | Bloqueante |
| **Sem método uploadDriverPhoto** | 🔴 CRÍTICO | DriverController não tem método upload | Bloqueante |
| **Validação ausente** | 🟡 MÉDIO | DeviceController não valida tipo/tamanho | Segurança |
| **Sobrescrita sem backup** | 🟡 MÉDIO | Sempre sobrescreve foto anterior | Perda dados |
| **IP-based storage** | 🟡 MÉDIO | Organização por IP pode confundir | Multi-tenant |
| **Path fora de public** | 🟡 MÉDIO | assets/ não está em public/ symlink | Acesso web |
| **Schema DB desconhecido** | 🟢 BAIXO | Não sabemos se tc_device_driver tem campo photo | Info |
| **Sem soft delete** | 🟢 BAIXO | Deletar driver não limpa foto | Storage leak |

---

## ✅ 9. Recomendações Técnicas

### 9.1 Backend (Novo Endpoint)
**Criar em DriverController.php:**

```php
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Facades\Image;

public function uploadDriverPhoto(Request $request, $driverId){
    
    // 1. Validação robusta
    $request->validate([
        'image' => 'required|image|mimes:jpeg,jpg,png|max:10240', // 10MB max
    ]);
    
    // 2. Verifica se driver existe
    $driver = TcDeviceDriver::where('id', $driverId)->first();
    if (!$driver) {
        return response()->json(['error' => 'Driver not found'], 404);
    }
    
    // 3. Define path (opção B: diretório separado)
    $directory = 'assets/'.$request->ip().'/assets/drivers/';
    if(!Storage::exists($directory)){
        Storage::makeDirectory($directory);
    }
    
    // 4. Processa imagem (800x800 para drivers, maior que devices)
    $path = storage_path().'/app/'.$directory . $driverId .'.jpg';
    Image::make($request->file('image'))
        ->fit(800, 800)        // Maior resolução para drivers
        ->encode('jpg', 70)    // Compressão 70%
        ->save($path);
    
    // 5. Registra em log
    UserLog::create([
        'user_id' => auth()->id(),
        'action' => 'driver_photo_upload',
        'entity_id' => $driverId,
        'entity_type' => 'driver'
    ]);
    
    // 6. Atualiza timestamp no banco (se existir campo)
    // $driver->photo_updated_at = now();
    // $driver->save();
    
    return response()->json([
        'success' => true,
        'photo_url' => '/storage/'.$directory.$driverId.'.jpg',
        'timestamp' => time() * 1000 // Milliseconds para JS
    ], 200);
}
```

### 9.2 Rota (api.php)
```php
Route::group(['prefix'=>'drivers'],function(){
    Route::post("/",[DriverController::class,'post']);
    Route::put("/{driverId}",[DriverController::class,'put']);
    
    // NOVO:
    Route::post("/{driverId}/photo",[DriverController::class,'uploadDriverPhoto']);
    Route::delete("/{driverId}/photo",[DriverController::class,'deleteDriverPhoto']); // Opcional
});
```

### 9.3 Frontend (PR-04)
**Componente:**
- Drag & drop ou file input
- Preview antes do upload
- Redimensiona no client para 800x800 (reduzir payload)
- Compressão client-side com Canvas API (~70% quality)
- Envia via FormData:
  ```javascript
  const formData = new FormData()
  formData.append('image', file)
  await axios.post(`/api/drivers/${driverId}/photo`, formData, {
    headers: {'Content-Type': 'multipart/form-data'}
  })
  ```

**Integração Store:**
- Após upload bem-sucedido, atualizar `imageUpdateTimestamp[driverId]`
- Usar timestamp para cache busting: `?t=${timestamp}`

### 9.4 Segurança
```php
// Adicionar middleware auth
Route::middleware(['auth:sanctum'])->group(function(){
    Route::post('/drivers/{driverId}/photo', ...);
});

// Validar ownership (usuário pode editar esse driver?)
if (!$user->canEditDriver($driverId)) {
    return response()->json(['error' => 'Unauthorized'], 403);
}
```

---

## 📊 10. Contrato API Proposto

### 10.1 Upload Photo

**Endpoint:**
```
POST /api/drivers/{driverId}/photo
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (form-data):**
```
image: (binary file)
```

**Response 200 - Success:**
```json
{
  "success": true,
  "photo_url": "/storage/assets/127.0.0.1/assets/drivers/123.jpg",
  "timestamp": 1735689600000
}
```

**Response 404 - Driver Not Found:**
```json
{
  "error": "Driver not found"
}
```

**Response 422 - Validation Error:**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "image": [
      "The image field is required.",
      "The image must be a file of type: jpeg, jpg, png."
    ]
  }
}
```

**Response 500 - Server Error:**
```json
{
  "error": "Failed to process image",
  "message": "Intervention Image error details..."
}
```

### 10.2 Delete Photo (Opcional)

**Endpoint:**
```
DELETE /api/drivers/{driverId}/photo
```

**Response 200:**
```json
{
  "success": true,
  "message": "Photo deleted successfully"
}
```

### 10.3 Get Photo URL (Via GET /api/drivers)

**Endpoint Existente:**
```
GET /api/drivers
GET /api/drivers/{driverId}
```

**Response Atual (assumido):**
```json
{
  "id": 123,
  "name": "João Silva",
  "uniqueId": "CNH123456",
  ...
}
```

**Response Proposto (com foto):**
```json
{
  "id": 123,
  "name": "João Silva",
  "uniqueId": "CNH123456",
  "photo_url": "/storage/assets/127.0.0.1/assets/drivers/123.jpg?t=1735689600000",
  "photo_updated_at": "2025-01-01T12:00:00Z",
  ...
}
```

---

## ⚠️ 11. Riscos e Considerações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| **Storage quota** | BAIXA | ALTO | Implementar limpeza de fotos órfãs |
| **Concurrent uploads** | MÉDIA | BAIXO | Laravel handle (sobrescreve) |
| **File injection** | ALTA | CRÍTICO | Validação robusta (mimes, extension, size) |
| **IP spoofing** | BAIXA | MÉDIO | Usar user_id ao invés de IP para path |
| **CORS issues** | MÉDIA | MÉDIO | Configurar cors.php para multipart |
| **Memory limit** | BAIXA | ALTO | Validar max 10MB, resize no client |
| **Traccar sync** | MÉDIA | BAIXO | Decidir se sincroniza foto com Traccar API |

---

## 🧪 12. Checklist de Implementação

### Backend
- [ ] Adicionar método `uploadDriverPhoto()` em DriverController
- [ ] Adicionar rota POST `/api/drivers/{driverId}/photo`
- [ ] Validar tipo de arquivo (jpeg, jpg, png)
- [ ] Validar tamanho máximo (10MB)
- [ ] Criar diretório `assets/{ip}/assets/drivers/`
- [ ] Processar com Intervention Image (800x800, JPEG 70%)
- [ ] Retornar response com photo_url e timestamp
- [ ] Adicionar log em UserLog
- [ ] Testar com Postman/cURL
- [ ] Implementar delete endpoint (opcional)
- [ ] Verificar se precisa campo no banco (photo_url, photo_updated_at)

### Frontend (PR-04)
- [ ] Criar componente DriverPhotoUpload.vue
- [ ] Implementar drag & drop
- [ ] Preview da imagem selecionada
- [ ] Redimensionar client-side (Canvas API)
- [ ] Compressão client-side (~70%)
- [ ] Upload via FormData multipart
- [ ] Atualizar imageUpdateTimestamp no store após upload
- [ ] Adicionar coluna "Foto" na tabela do dashboard
- [ ] Integrar no driver-form-modal.vue
- [ ] Loading state durante upload
- [ ] Error handling (422, 500)
- [ ] Success message com ElMessage

### Testes
- [ ] Teste unitário uploadDriverPhoto()
- [ ] Teste validação (file type, size)
- [ ] Teste driver não encontrado (404)
- [ ] Teste upload bem-sucedido (200)
- [ ] Teste sobrescrita de foto existente
- [ ] Teste frontend E2E com Playwright
- [ ] Teste cache busting (timestamp)
- [ ] Teste CORS (se frontend em domínio diferente)

---

## 📚 13. Referências

**Documentação:**
- Laravel Storage: https://laravel.com/docs/filesystem
- Intervention Image: http://image.intervention.io/api/fit
- FormData API: https://developer.mozilla.org/en-US/docs/Web/API/FormData

**Arquivos Backend:**
- `app/Http/Controllers/DriverController.php` (base para novo método)
- `app/Http/Controllers/DeviceController.php` (referência uploadImage)
- `app/Http/Controllers/UploadsController.php` (validações)
- `routes/api.php` (definir nova rota)
- `app/Models/TcDeviceDriver.php` (verificar schema)

**Arquivos Frontend (já entregues):**
- `src/store/modules/drivers.js` (imageUpdateTimestamp pronto)
- `src/templates/drivers-dashboard.vue` (adicionar coluna foto)
- `src/templates/components/driver-form-modal.vue` (integrar upload)

---

## 🎯 14. Próximos Passos

1. **Validação com Usuário:**
   - Confirmar dimensões da foto (800x800 OK?)
   - Confirmar qualidade JPEG (70% OK?)
   - Confirmar path separado `assets/drivers/` vs mesmo diretório de devices

2. **Decisões Técnicas:**
   - [ ] Sincronizar foto com Traccar API? (verificar se Traccar suporta)
   - [ ] Adicionar campos no banco? (photo_url, photo_updated_at)
   - [ ] Implementar soft delete de fotos?
   - [ ] Usar IP ou user_id para organizar storage?

3. **Implementação PR-04:**
   - [ ] Backend: criar endpoint (1-2h)
   - [ ] Frontend: componente upload (2-3h)
   - [ ] Frontend: integração dashboard/modal (1h)
   - [ ] Testes manuais (1h)
   - [ ] Code review e ajustes (1h)
   - **Total estimado:** 6-8 horas

---

**Documento gerado por:** GitHub Copilot Agent  
**Revisão:** Pendente (v1.0 draft)  
**Status:** ✅ PRONTO PARA REVISÃO E IMPLEMENTAÇÃO
