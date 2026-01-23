<template>
  <el-select
    v-model="formData"
    @change="addUser($event)"
    :value-key="'id'"
    filterable
    :placeholder="KT('user.users')"
    :size="'large'"
    :no-match-text="KT('NO_MATCH_TEXT')"
    :no-data-text="KT('NO_DATA_TEXT')"
  >
    <el-option
      v-for="item in selectableUsers"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    >
      <!-- Conteúdo custom do option -->
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          {{ item.name }}
        </span>

        <!-- Badges só quando counts carregados -->
        <div v-if="areCountsLoaded" style="display:flex; gap:6px; align-items:center;">
          <el-tag size="small" type="info">
            D: {{ getUserDeviceCount(item.id) }}
          </el-tag>
          <el-tag size="small" type="warning">
            U: {{ getUserSubUsersCount(item.id) }}
          </el-tag>
        </div>
      </div>
    </el-option>
  </el-select>

  <div style="border: silver 1px solid; border-radius: 5px;margin-top: 10px;height: calc(70vh - 200px)">
    <div v-for="(user,k) in selected" style="display: flex;border-bottom: silver 1px dotted;" :key="user.id">
      <div style="padding: 7px;flex: 1;">{{ user.name }}</div>
      <div style="padding: 5px;padding-right: 10px;font-size: 18px;" @click="remove(k)">
        <i class="fas fa-minus-square"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/switch/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/tab-pane/style/css'
import 'element-plus/es/components/tabs/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/checkbox/style/css'
import 'element-plus/es/components/tag/style/css'

import { ElSelect, ElOption, ElTag } from "element-plus";
import { ref, defineExpose, computed, onMounted } from 'vue'
import { useStore } from 'vuex';

const store = useStore();

const formData = ref(null);
const selected = ref([]);

const clear = () => {
  selected.value = [];
}

defineExpose({ selected, clear })

const remove = (key) => {
  selected.value.splice(key, 1);
}

// ✅ Usa o getter (já filtra isShared)
const users = computed(() => store.getters['users/getUsers'] || []);

// ✅ Mantém sua regra: esconder o user 1 se não for admin
const selectableUsers = computed(() =>
  users.value.filter(u => !(Number(u.id) === 1 && Number(store.state.auth?.id) !== 1))
);

// ✅ counts helpers
const areCountsLoaded = computed(() => store.getters['users/areCountsLoaded']());
const getUserDeviceCount = (userId) => store.getters['users/getUserDeviceCount'](userId);
const getUserSubUsersCount = (userId) => store.getters['users/getUserSubUsersCount'](userId);

const addUser = (userId) => {
  const id = Number(userId);

  const check = selected.value.find((c) => Number(c.id) === id);
  if (!check) {
    const user = store.getters["users/getUser"](id);
    if (user) selected.value.push(user);
  }

  formData.value = null;
}

onMounted(async () => {
  // Carrega users se ainda não tiver
  if (!store.state.users?.userList?.length) {
    try { await store.dispatch('users/load'); } catch (_) {}
  }

  // Tenta counts (silencioso se backend não tiver /users/counts)
  if (!areCountsLoaded.value) {
    try { await store.dispatch('users/getAllUsersCounts'); } catch (_) {}
  }
});
</script>
