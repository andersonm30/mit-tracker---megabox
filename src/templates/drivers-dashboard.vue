<template>
  <div class="drivers-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <h1>Motoristas</h1>
      <el-button type="primary" @click="openCreate" :disabled="isLoading">
        <el-icon><Plus /></el-icon>
        Novo Motorista
      </el-button>
    </div>

    <!-- Search Bar -->
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="Buscar por nome ou identificador..."
        clearable
        @clear="searchQuery = ''"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <el-alert
        title="Erro ao carregar motoristas"
        type="error"
        :description="error"
        show-icon
        :closable="false"
      />
      <el-button type="primary" @click="loadDrivers" style="margin-top: 16px;">
        Tentar Novamente
      </el-button>
    </div>

    <!-- Empty State -->
    <div v-else-if="paginatedDrivers.length === 0 && !searchQuery" class="empty-state">
      <el-empty description="Nenhum motorista cadastrado">
        <el-button type="primary" @click="handleCreate">
          Cadastrar Primeiro Motorista
        </el-button>
      </el-empty>
    </div>

    <!-- No Search Results -->
    <div v-else-if="filteredDrivers.length === 0 && searchQuery" class="empty-state">
      <el-empty description="Nenhum motorista encontrado com esse filtro" />
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <el-table
        :data="paginatedDrivers"
        stripe
        style="width: 100%"
        :default-sort="{ prop: 'name', order: 'ascending' }"
      >
        <el-table-column
          label="Foto"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <div class="driver-photo-cell">
              <img
                v-if="getPhotoUrl(row.id)"
                :src="getPhotoUrl(row.id)"
                alt="Foto do motorista"
                class="driver-thumbnail"
                @error="() => onPhotoError(row.id)"
              />
              <el-icon v-else :size="32" class="photo-placeholder">
                <Avatar />
              </el-icon>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="name"
          label="Nome"
          sortable
          min-width="200"
        />
        
        <el-table-column
          prop="uniqueId"
          label="Identificador"
          sortable
          min-width="150"
        />

        <el-table-column
          label="Ações"
          width="250"
          align="center"
          fixed="right"
        >
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              @click="openReport(scope.row)"
              :disabled="isLoading"
            >
              <el-icon><Document /></el-icon>
              Relatório
            </el-button>
            <el-button
              size="small"
              @click="openEdit(scope.row)"
              :disabled="isLoading"
            >
              Editar
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
              :disabled="isLoading || deletingId === scope.row.id"
            >
              Excluir
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredDrivers.length"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Modal de Create/Edit -->
    <driver-form-modal
      v-model="isModalOpen"
      :mode="modalMode"
      :driver="selectedDriver"
      @saved="onDriverSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Avatar, Document } from '@element-plus/icons-vue';
import DriverFormModal from './components/driver-form-modal.vue';

const store = useStore();
const router = useRouter();

// State
const isLoading = ref(false);
const photoErrors = ref(new Set()); // IDs de fotos que falharam ao carregar
const error = ref(null);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = 15;
const deletingId = ref(null);

// Modal state
const isModalOpen = ref(false);
const modalMode = ref('create');
const selectedDriver = ref(null);

// Debounced search
let searchTimeout = null;
const debouncedSearch = ref('');

watch(searchQuery, (newVal) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = newVal;
    currentPage.value = 1; // Reset to first page on search
  }, 300);
});

// Cleanup debounce on unmount
onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout);
});

// Computed
const allDrivers = computed(() => store.state.drivers.driverList || []);

const filteredDrivers = computed(() => {
  if (!debouncedSearch.value) return allDrivers.value;
  
  const query = debouncedSearch.value.toLowerCase().trim();
  return allDrivers.value.filter(driver => {
    const name = (driver.name || '').toLowerCase();
    const uniqueId = (driver.uniqueId || '').toLowerCase();
    return name.includes(query) || uniqueId.includes(query);
  });
});

const paginatedDrivers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredDrivers.value.slice(start, end);
});

// Methods
async function loadDrivers() {
  isLoading.value = true;
  error.value = null;
  
  try {
    await store.dispatch('drivers/load');
  } catch (err) {
    console.error('[DriversDashboard] Erro ao carregar motoristas:', err);
    error.value = err.message || 'Falha ao carregar dados. Verifique sua conexão.';
  } finally {
    isLoading.value = false;
  }
}

function handlePageChange(page) {
  currentPage.value = page;
}

// Modal handlers
function openCreate() {
  modalMode.value = 'create';
  selectedDriver.value = null;
  isModalOpen.value = true;
}

function openEdit(driver) {
  modalMode.value = 'edit';
  selectedDriver.value = driver;
  isModalOpen.value = true;
}

function openReport(driver) {
  router.push(`/drivers/${driver.id}/report`);
}

// Get photo URL com cache busting
function getPhotoUrl(driverId) {
  if (photoErrors.value.has(driverId)) return null;
  return store.getters['drivers/getDriverImageUrl'](driverId);
}

// Handler para erro ao carregar foto
function onPhotoError(driverId) {
  photoErrors.value.add(driverId);
}

function onDriverSaved() {
  // Lista já foi recarregada no modal via drivers/load
  // Limpar cache de erros de foto
  photoErrors.value.clear();
}

async function handleDelete(driver) {
  // Prevent double delete
  if (deletingId.value === driver.id) return;
  
  try {
    await ElMessageBox.confirm(
      `Deseja realmente excluir o motorista "${driver.name}"? Esta ação não pode ser desfeita.`,
      'Confirmar Exclusão',
      {
        confirmButtonText: 'Excluir',
        cancelButtonText: 'Cancelar',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    );

    deletingId.value = driver.id;
    await store.dispatch('drivers/deleteDriver', driver.id);
    
    ElMessage.success({
      message: `Motorista "${driver.name}" excluído com sucesso`,
      duration: 2000
    });

    // Ajustar página se necessário
    const totalPages = Math.ceil(filteredDrivers.value.length / pageSize);
    if (currentPage.value > totalPages && totalPages > 0) {
      currentPage.value = totalPages;
    }

  } catch (err) {
    if (err !== 'cancel') {
      console.error('[DriversDashboard] Erro ao excluir motorista:', err);
      ElMessage.error({
        message: err.message || 'Erro ao excluir motorista',
        duration: 3000
      });
    }
  } finally {
    deletingId.value = null;
  }
}

// Lifecycle
onMounted(() => {
  loadDrivers();
});
</script>

<style scoped>
.drivers-dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.search-bar {
  margin-bottom: 20px;
}

.search-bar .el-input {
  max-width: 400px;
}

.loading-state,
.error-state,
.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.error-state .el-alert {
  max-width: 600px;
  margin: 0 auto;
}

.table-container {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* Foto do motorista na tabela */
.driver-photo-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.driver-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e4e7ed;
}

.photo-placeholder {
  color: #c0c4cc;
}

/* Responsivo */
@media (max-width: 768px) {
  .drivers-dashboard {
    padding: 12px;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
  }

  .dashboard-header h1 {
    font-size: 20px;
  }

  .search-bar .el-input {
    max-width: 100%;
  }

  .table-container {
    padding: 8px;
    overflow-x: auto;
  }

  :deep(.el-table__body-wrapper) {
    overflow-x: auto;
  }
}

@media (max-width: 480px) {
  .pagination-container :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
